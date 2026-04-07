import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===================== HTML → PDF Engine =====================

interface Span {
  text: string;
  bold: boolean;
  underline: boolean;
  fontSize: number;
  color: string;
}

interface Block {
  spans: Span[];
  align: "left" | "center" | "right";
}

// --- Tokenizer ---
interface Token {
  type: "open" | "close" | "self" | "text";
  tag?: string;
  attrs?: string;
  text?: string;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>|<!--[\s\S]*?-->|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[0].startsWith("<!--")) continue; // skip comments
    if (m[3] !== undefined) {
      tokens.push({ type: "text", text: m[3] });
    } else {
      const tag = m[1].toLowerCase();
      const attrs = m[2] || "";
      if (m[0].startsWith("</")) {
        tokens.push({ type: "close", tag });
      } else if (m[0].endsWith("/>") || ["br", "hr", "img", "input"].includes(tag)) {
        tokens.push({ type: "self", tag, attrs });
      } else {
        tokens.push({ type: "open", tag, attrs });
      }
    }
  }
  return tokens;
}

// --- Style extraction ---
function getStyleAttr(attrs: string, prop: string): string | null {
  const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i);
  if (!styleMatch) return null;
  const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`, "i");
  const m = styleMatch[1].match(re);
  return m ? m[1].trim() : null;
}

function getAlign(attrs: string): "left" | "center" | "right" {
  const a = getStyleAttr(attrs, "text-align");
  if (a === "center" || a === "right") return a;
  return "left";
}

function normalizeColor(c: string): string {
  if (!c) return "#000000";
  c = c.trim();
  if (c.startsWith("#")) return c;
  const m = c.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    return `#${parseInt(m[1]).toString(16).padStart(2, '0')}${parseInt(m[2]).toString(16).padStart(2, '0')}${parseInt(m[3]).toString(16).padStart(2, '0')}`;
  }
  return "#000000";
}

function decodeEntities(t: string): string {
  return t
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á").replace(/&eacute;/g, "é").replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó").replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á").replace(/&Eacute;/g, "É").replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó").replace(/&Uacute;/g, "Ú").replace(/&Ntilde;/g, "Ñ")
    .replace(/&ordm;/g, "º").replace(/&ordf;/g, "ª").replace(/&iexcl;/g, "¡")
    .replace(/&iquest;/g, "¿").replace(/&euro;/g, "€").replace(/&deg;/g, "°")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

// --- Recursive walk to produce blocks ---
const BLOCK_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "ul", "ol", "table", "tr"]);

interface StyleState {
  bold: boolean;
  underline: boolean;
  fontSize: number;
  color: string;
}

function parseHtml(html: string): Block[] {
  const tokens = tokenize(html);
  const blocks: Block[] = [];
  let pos = 0;

  // Current inline accumulator
  let currentSpans: Span[] = [];
  let currentAlign: "left" | "center" | "right" = "left";

  function flushInline(forceEmpty = false) {
    const hasContent = currentSpans.some(s => s.text.trim().length > 0);
    if (hasContent) {
      blocks.push({ spans: [...currentSpans], align: currentAlign });
    } else if (forceEmpty) {
      // Preserve empty paragraphs as spacing
      blocks.push({ spans: [{ text: "", bold: false, underline: false, fontSize: 11, color: "#000000" }], align: currentAlign });
    }
    currentSpans = [];
  }

  function walk(style: StyleState, blockAlign: "left" | "center" | "right") {
    while (pos < tokens.length) {
      const tok = tokens[pos];

      if (tok.type === "text") {
        pos++;
        const text = decodeEntities(tok.text!);
        if (text) {
          currentSpans.push({
            text,
            bold: style.bold,
            underline: style.underline,
            fontSize: style.fontSize,
            color: style.color,
          });
        }
        continue;
      }

      if (tok.type === "close") {
        pos++;
        return; // exit to parent
      }

      if (tok.type === "self") {
        pos++;
        if (tok.tag === "br") {
          // Flush current line and start new one
          flushInline();
          currentAlign = blockAlign;
        }
        continue;
      }

      // Open tag
      if (tok.type === "open") {
        const tag = tok.tag!;
        const attrs = tok.attrs || "";
        pos++;

        if (BLOCK_TAGS.has(tag)) {
          // Flush any accumulated inline content first
          flushInline();
          
          const align = getAlign(attrs) || blockAlign;
          currentAlign = align;

          // Determine font size for headings
          const newStyle = { ...style };
          if (tag === "h1") { newStyle.fontSize = 24; newStyle.bold = true; }
          else if (tag === "h2") { newStyle.fontSize = 20; newStyle.bold = true; }
          else if (tag === "h3") { newStyle.fontSize = 16; newStyle.bold = true; }

          // Check for inline styles on block element
          const fs = getStyleAttr(attrs, "font-size");
          if (fs) {
            const n = parseFloat(fs);
            if (n > 0) newStyle.fontSize = n;
          }
          const col = getStyleAttr(attrs, "(?:^|;\\s*)color");
          if (col) newStyle.color = normalizeColor(col);
          
          const fw = getStyleAttr(attrs, "font-weight");
          if (fw === "bold" || fw === "700" || fw === "800" || fw === "900") newStyle.bold = true;
          
          const td = getStyleAttr(attrs, "text-decoration");
          if (td && td.includes("underline")) newStyle.underline = true;

          walk(newStyle, align);

          // Flush what we collected inside this block - force empty to preserve spacing
          flushInline(true);
          currentAlign = blockAlign;
        } else {
          // Inline tag
          const newStyle = { ...style };
          if (tag === "b" || tag === "strong") newStyle.bold = true;
          if (tag === "u" || tag === "ins") newStyle.underline = true;
          if (tag === "i" || tag === "em") { /* italic not supported, skip */ }

          if (tag === "span" || tag === "font") {
            const fs = getStyleAttr(attrs, "font-size");
            if (fs) {
              const n = parseFloat(fs);
              if (n > 0) newStyle.fontSize = n;
            }
            // color - more careful regex to not match background-color
            const styleStr = (attrs.match(/style\s*=\s*"([^"]*)"/i) || [])[1] || "";
            const colorMatch = styleStr.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
            if (colorMatch) {
              // Make sure it's not background-color
              const prefix = styleStr.substring(0, styleStr.indexOf(colorMatch[0]));
              if (!prefix.endsWith("background-") && !prefix.endsWith("bg")) {
                newStyle.color = normalizeColor(colorMatch[1]);
              }
            }
            const fw = getStyleAttr(attrs, "font-weight");
            if (fw === "bold" || fw === "700" || fw === "800" || fw === "900") newStyle.bold = true;
            const td = getStyleAttr(attrs, "text-decoration");
            if (td && td.includes("underline")) newStyle.underline = true;

            // font tag color attribute
            const colorAttr = attrs.match(/color\s*=\s*"([^"]*)"/i);
            if (colorAttr) newStyle.color = normalizeColor(colorAttr[1]);
          }

          walk(newStyle, blockAlign);
        }
      }
    }
  }

  walk({ bold: false, underline: false, fontSize: 11, color: "#000000" }, "left");
  flushInline(); // flush remaining

  // If nothing parsed, try plain text fallback
  if (blocks.length === 0 && html.trim()) {
    const plain = html.replace(/<[^>]*>/g, "");
    for (const line of decodeEntities(plain).split("\n")) {
      blocks.push({
        spans: [{ text: line, bold: false, underline: false, fontSize: 11, color: "#000000" }],
        align: "left",
      });
    }
  }

  return blocks;
}

// ===================== PDF Builder =====================

const HELVETICA_WIDTHS: Record<string, number> = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
  '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556,
  '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778,
  'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944,
  'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556,
  '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556,
  'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556,
  'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722,
  'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584,
  'á': 556, 'é': 556, 'í': 278, 'ó': 556, 'ú': 556, 'ñ': 556,
  'Á': 667, 'É': 667, 'Í': 278, 'Ó': 778, 'Ú': 722, 'Ñ': 722,
  'ü': 556, 'Ü': 722, 'º': 370, 'ª': 370, '¿': 611, '¡': 333, '€': 556, '°': 400,
};

// Bold widths are ~5-8% wider on average; approximate by multiplying
function measureText(text: string, fontSize: number, bold = false): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const cw = HELVETICA_WIDTHS[text[i]] || 556;
    w += cw;
  }
  const base = (w / 1000) * fontSize;
  return bold ? base * 1.05 : base;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [
    parseInt(hex.substring(0, 2), 16) / 255,
    parseInt(hex.substring(2, 4), 16) / 255,
    parseInt(hex.substring(4, 6), 16) / 255,
  ];
}

function toHex(s: string): string {
  let hex = '';
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if (code > 255) code = 63; // '?'
    hex += code.toString(16).padStart(2, '0');
  }
  return hex;
}

// Word-wrap spans into multiple visual lines
function wrapBlock(block: Block, maxWidth: number): { spans: Span[]; align: "left" | "center" | "right" }[] {
  const lines: { spans: Span[]; align: typeof block.align }[] = [];
  let curSpans: Span[] = [];
  let curW = 0;

  for (const span of block.spans) {
    // Split by words (keeping spaces)
    const parts = span.text.split(/(\s+)/);
    let buf = "";

    for (const part of parts) {
      if (!part) continue;
      const pw = measureText(buf + part, span.fontSize, span.bold);
      if (curW + pw > maxWidth && (curSpans.length > 0 || buf.length > 0)) {
        if (buf) curSpans.push({ ...span, text: buf });
        lines.push({ spans: curSpans, align: block.align });
        curSpans = [];
        curW = 0;
        buf = part.replace(/^\s+/, ""); // trim leading whitespace on new line
      } else {
        buf += part;
      }
    }
    if (buf) {
      const bw = measureText(buf, span.fontSize, span.bold);
      curSpans.push({ ...span, text: buf });
      curW += bw;
    }
  }
  if (curSpans.length > 0) {
    lines.push({ spans: curSpans, align: block.align });
  }
  if (lines.length === 0) {
    lines.push({ spans: [{ text: "", bold: false, underline: false, fontSize: 11, color: "#000000" }], align: block.align });
  }
  return lines;
}

function buildPdf(blocks: Block[]): Uint8Array {
  const enc = new TextEncoder();
  const PW = 595, PH = 842, M = 50;
  const UW = PW - M * 2;

  const pageStreams: string[] = [];
  let s = "";
  let y = PH - M;

  const newPage = () => { pageStreams.push(s); s = ""; y = PH - M; };

  for (const block of blocks) {
    // Check if this is an empty block (empty paragraph = vertical spacing)
    const isEmpty = block.spans.every(sp => sp.text.trim() === "");
    if (isEmpty) {
      const emptyLh = 11 * 0.8; // compact line height for empty paragraphs
      y -= emptyLh;
      if (y < M) newPage();
      continue;
    }

    const visualLines = wrapBlock(block, UW);
    
    for (const vl of visualLines) {
      const maxFs = Math.max(...vl.spans.map(sp => sp.fontSize), 11);
      const lh = maxFs * 1.2;

      if (y - lh < M) newPage();

      // Measure total width for alignment
      let totalW = 0;
      for (const sp of vl.spans) totalW += measureText(sp.text, sp.fontSize, sp.bold);

      let x = M;
      if (vl.align === "center") x = M + (UW - totalW) / 2;
      else if (vl.align === "right") x = M + UW - totalW;

      s += "BT\n";
      let tx = x;
      for (const sp of vl.spans) {
        const fn = sp.bold ? "/F2" : "/F1";
        const [r, g, b] = hexToRgb(sp.color);
        s += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n`;
        s += `${fn} ${sp.fontSize} Tf\n`;
        s += `1 0 0 1 ${tx.toFixed(2)} ${y.toFixed(2)} Tm\n`;
        s += `<${toHex(sp.text)}> Tj\n`;
        const w = measureText(sp.text, sp.fontSize, sp.bold);

        if (sp.underline) {
          s += "ET\n";
          s += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG\n0.5 w\n`;
          s += `${tx.toFixed(2)} ${(y - 2).toFixed(2)} m ${(tx + w).toFixed(2)} ${(y - 2).toFixed(2)} l S\n`;
          s += "BT\n";
        }
        tx += w;
      }
      s += "ET\n";
      y -= lh;
    }

    // Paragraph spacing between blocks
    y -= 3;
  }

  pageStreams.push(s);

  // Assemble PDF
  const objs: string[] = [];
  let oc = 0;
  const add = (c: string) => { oc++; objs.push(`${oc} 0 obj\n${c}\nendobj\n`); return oc; };

  add(`<< /Type /Catalog /Pages 2 0 R >>`);
  const np = pageStreams.length;
  const fp = 5;
  const kids = Array.from({ length: np }, (_, i) => `${fp + i * 2} 0 R`).join(" ");
  add(`<< /Type /Pages /Kids [${kids}] /Count ${np} >>`);
  add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  for (let i = 0; i < np; i++) {
    const sb = enc.encode(pageStreams[i]);
    const sid = fp + i * 2 + 1;
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${sid} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`);
    add(`<< /Length ${sb.length} >>\nstream\n${new TextDecoder().decode(sb)}\nendstream`);
  }

  let pdf = `%PDF-1.4\n`;
  const offs: number[] = [];
  for (const o of objs) { offs.push(pdf.length); pdf += o; }
  const xr = pdf.length;
  pdf += `xref\n0 ${oc + 1}\n0000000000 65535 f \n`;
  for (const o of offs) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${oc + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return enc.encode(pdf);
}

// ===================== Template Logic =====================

function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }
  return result;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

// ===================== Server =====================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      animal_id, animal_type, buyer_id, precio,
      vendedor_nombre, vendedor_dni, vendedor_domicilio,
      preview_only, rendered_html, buyer_override,
      test_pdf, template_content, template_animal_type,
    } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // --- Test PDF mode: fill template with dummy data and return PDF ---
    if (test_pdf && template_content) {
      const dummyVars: Record<string, string> = template_animal_type === "bird"
        ? {
            nombre_comun: "Canario",
            especie: "Serinus canaria",
            sexo: "Macho",
            fecha_nacimiento: "15-03-2024",
            cites: "ES-1234/2024",
            anilla: "ABC-001",
            microchip: "900123456789012",
            miteco: "MT-2024-00001",
            padre: "XYZ-099",
            madre: "XYZ-100",
            nombre_comprador: "Juan",
            apellidos_comprador: "García López",
            dni_comprador: "12345678A",
            domicilio_comprador: "Calle Ejemplo 1, 28001 Madrid",
            fecha_documento: new Date().toISOString().slice(0, 10).split('-').reverse().join('-'),
            precio: "150.00",
            vendedor_nombre: "María Pérez Ruiz",
            vendedor_dni: "87654321B",
            vendedor_domicilio: "Av. de la Constitución 10, 41001 Sevilla",
          }
        : {
            nombre: "Rocky",
            raza: "Pastor Alemán",
            color: "Negro y fuego",
            sexo: "Macho",
            fecha_nacimiento: "01-06-2024",
            microchip: "900123456789012",
            pedigree: "LOE-123456",
            nombre_comprador: "Juan",
            apellidos_comprador: "García López",
            dni_comprador: "12345678A",
            domicilio_comprador: "Calle Ejemplo 1, 28001 Madrid",
            fecha_documento: new Date().toISOString().slice(0, 10).split('-').reverse().join('-'),
            precio: "500.00",
            vendedor_nombre: "María Pérez Ruiz",
            vendedor_dni: "87654321B",
            vendedor_domicilio: "Av. de la Constitución 10, 41001 Sevilla",
          };

      const renderedTest = replaceTemplateVars(template_content, dummyVars);
      const blocks = parseHtml(renderedTest);
      const pdfBytes = buildPdf(blocks);

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="cesion_prueba.pdf"',
        },
      });
    }

    // For preview with new buyer, use buyer_override data instead of fetching from DB
    let buyer: any;
    if (buyer_override && preview_only) {
      buyer = buyer_override;
    } else {
      const { data: buyerData, error: buyerErr } = await supabase
        .from("buyers").select("*").eq("id", buyer_id).single();
      if (buyerErr) throw new Error(`Comprador no encontrado: ${buyerErr.message}`);
      buyer = buyerData;
    }

    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for DB
    const today = todayISO.split('-').reverse().join('-'); // DD-MM-YYYY for display
    let templateGroupKey = "";
    let templateVars: Record<string, string> = {};

    if (animal_type === "bird") {
      const { data: bird, error } = await supabase
        .from("birds").select("*, bird_species_catalog(*)").eq("id", animal_id).single();
      if (error) throw new Error(`Ave no encontrada: ${error.message}`);

      const speciesCatalog = bird.bird_species_catalog;
      const nombreEspecie = speciesCatalog?.nombre_especie || "";
      const nombreComun = speciesCatalog?.nombre_comun || bird.especie;
      templateGroupKey = `${nombreComun}::${nombreEspecie}`;

      let padreNombre = bird.padre_externo || "";
      let madreNombre = bird.madre_externa || "";
      if (bird.padre_id) {
        const { data: padre } = await supabase.from("birds").select("anilla, especie").eq("id", bird.padre_id).single();
        if (padre) padreNombre = padre.anilla || `Ave ${padre.especie}`;
      }
      if (bird.madre_id) {
        const { data: madre } = await supabase.from("birds").select("anilla, especie").eq("id", bird.madre_id).single();
        if (madre) madreNombre = madre.anilla || `Ave ${madre.especie}`;
      }

      templateVars = {
        nombre_comun: nombreComun,
        especie: nombreEspecie || bird.especie,
        sexo: bird.sexo,
        fecha_nacimiento: formatDate(bird.fecha_nacimiento),
        cites: bird.numero_cites || "",
        anilla: bird.anilla || "",
        microchip: bird.microchip || "",
        miteco: bird.id_miteco || "",
        padre: padreNombre,
        madre: madreNombre,
        nombre_comprador: buyer.nombre,
        apellidos_comprador: buyer.apellidos,
        dni_comprador: buyer.dni,
        domicilio_comprador: buyer.domicilio,
        fecha_documento: today,
        precio: Number(precio).toFixed(2),
      };
    } else {
      const { data: dog, error } = await supabase
        .from("dogs").select("*").eq("id", animal_id).single();
      if (error) throw new Error(`Perro no encontrado: ${error.message}`);

      templateGroupKey = dog.raza;
      templateVars = {
        nombre: dog.nombre,
        raza: dog.raza,
        color: dog.color,
        sexo: dog.sexo,
        fecha_nacimiento: formatDate(dog.fecha_nacimiento),
        microchip: dog.microchip || "",
        pedigree: dog.pedigree || "",
        nombre_comprador: buyer.nombre,
        apellidos_comprador: buyer.apellidos,
        dni_comprador: buyer.dni,
        domicilio_comprador: buyer.domicilio,
        fecha_documento: today,
        precio: Number(precio).toFixed(2),
      };
    }

    // Find template
    const { data: template } = await supabase
      .from("cession_templates").select("template_content")
      .eq("animal_type", animal_type).eq("group_key", templateGroupKey).single();

    if (!template?.template_content) {
      const label = animal_type === "bird" ? "especie" : "raza";
      throw new Error(`Esta ${label} aún no tiene creado un documento de cesión en el apartado Plantillas de Cesión`);
    }

    const rendered = replaceTemplateVars(template.template_content, templateVars);
    console.log(`Using custom template for ${animal_type}/${templateGroupKey}`);

    if (preview_only) {
      return new Response(
        JSON.stringify({ rendered_html: rendered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalHtml = rendered_html || rendered;
    const blocks = parseHtml(finalHtml);
    const pdfBytes = buildPdf(blocks);

    // Upload
    const fileName = `cesion_${animal_type}_${animal_id}_${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("cessions").upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new Error(`Error al subir PDF: ${uploadErr.message}`);

    // Upsert cession record
    const { data: existingCession } = await supabase
      .from("cessions").select("id")
      .eq("animal_id", animal_id).eq("animal_type", animal_type)
      .order("created_at", { ascending: false }).limit(1).single();

    if (existingCession) {
      const { error: cessionErr } = await supabase
        .from("cessions").update({ buyer_id, precio: Number(precio), fecha_cesion: todayISO, pdf_ref: fileName })
        .eq("id", existingCession.id);
      if (cessionErr) throw new Error(`Error al actualizar cesión: ${cessionErr.message}`);
    } else {
      const { error: cessionErr } = await supabase.from("cessions").insert({
        animal_id, animal_type, buyer_id, precio: Number(precio), fecha_cesion: todayISO, pdf_ref: fileName,
      });
      if (cessionErr) throw new Error(`Error al crear cesión: ${cessionErr.message}`);
    }

    // Update animal
    const table = animal_type === "bird" ? "birds" : "dogs";
    const { error: updateErr } = await supabase.from(table)
      .update({ fecha_cesion: todayISO, comprador_id: buyer_id }).eq("id", animal_id);
    if (updateErr) throw new Error(`Error al actualizar animal: ${updateErr.message}`);

    const { data: urlData } = await supabase.storage.from("cessions").createSignedUrl(fileName, 3600);

    return new Response(
      JSON.stringify({ success: true, pdf_url: urlData?.signedUrl, pdf_ref: fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
