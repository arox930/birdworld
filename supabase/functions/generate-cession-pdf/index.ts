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
    if (m[0].startsWith("<!--")) continue;
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

  let currentSpans: Span[] = [];
  let currentAlign: "left" | "center" | "right" = "left";

  function flushInline(forceEmpty = false) {
    const hasContent = currentSpans.some(s => s.text.trim().length > 0);
    if (hasContent) {
      blocks.push({ spans: [...currentSpans], align: currentAlign });
    } else if (forceEmpty) {
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
        return;
      }

      if (tok.type === "self") {
        pos++;
        if (tok.tag === "br") {
          flushInline();
          currentAlign = blockAlign;
        }
        continue;
      }

      if (tok.type === "open") {
        const tag = tok.tag!;
        const attrs = tok.attrs || "";
        pos++;

        if (BLOCK_TAGS.has(tag)) {
          flushInline();
          
          const align = getAlign(attrs) || blockAlign;
          currentAlign = align;

          const newStyle = { ...style };
          if (tag === "h1") { newStyle.fontSize = 24; newStyle.bold = true; }
          else if (tag === "h2") { newStyle.fontSize = 20; newStyle.bold = true; }
          else if (tag === "h3") { newStyle.fontSize = 16; newStyle.bold = true; }

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

          flushInline(true);
          currentAlign = blockAlign;
        } else {
          const newStyle = { ...style };
          if (tag === "b" || tag === "strong") newStyle.bold = true;
          if (tag === "u" || tag === "ins") newStyle.underline = true;
          if (tag === "i" || tag === "em") { /* italic not supported */ }

          if (tag === "span" || tag === "font") {
            const fs = getStyleAttr(attrs, "font-size");
            if (fs) {
              const n = parseFloat(fs);
              if (n > 0) newStyle.fontSize = n;
            }
            const styleStr = (attrs.match(/style\s*=\s*"([^"]*)"/i) || [])[1] || "";
            const colorMatch = styleStr.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
            if (colorMatch) {
              const prefix = styleStr.substring(0, styleStr.indexOf(colorMatch[0]));
              if (!prefix.endsWith("background-") && !prefix.endsWith("bg")) {
                newStyle.color = normalizeColor(colorMatch[1]);
              }
            }
            const fw = getStyleAttr(attrs, "font-weight");
            if (fw === "bold" || fw === "700" || fw === "800" || fw === "900") newStyle.bold = true;
            const td = getStyleAttr(attrs, "text-decoration");
            if (td && td.includes("underline")) newStyle.underline = true;

            const colorAttr = attrs.match(/color\s*=\s*"([^"]*)"/i);
            if (colorAttr) newStyle.color = normalizeColor(colorAttr[1]);
          }

          walk(newStyle, blockAlign);
        }
      }
    }
  }

  walk({ bold: false, underline: false, fontSize: 11, color: "#000000" }, "left");
  flushInline();

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

function wrapBlock(block: Block, maxWidth: number): { spans: Span[]; align: "left" | "center" | "right" }[] {
  const lines: { spans: Span[]; align: typeof block.align }[] = [];
  let curSpans: Span[] = [];
  let curW = 0;

  for (const span of block.spans) {
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
        buf = part.replace(/^\s+/, "");
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

// ===================== Image helpers =====================

interface LogoImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  isJpeg: boolean;
}

function parseJpegDimensions(data: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i < data.length - 1) {
    if (data[i] !== 0xFF) break;
    const marker = data[i + 1];
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      const height = (data[i + 5] << 8) | data[i + 6];
      const width = (data[i + 7] << 8) | data[i + 8];
      return { width, height };
    }
    const len = (data[i + 2] << 8) | data[i + 3];
    i += 2 + len;
  }
  return null;
}

function parsePngDimensions(data: Uint8Array): { width: number; height: number } | null {
  // PNG signature check
  if (data[0] !== 0x89 || data[1] !== 0x50) return null;
  // IHDR chunk starts at byte 8, width at 16, height at 20
  const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
  const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
  return { width, height };
}

// ===================== Build PDF with optional logo =====================

function buildPdf(blocks: Block[], logo?: LogoImage): Uint8Array {
  const enc = new TextEncoder();
  const PW = 595, PH = 842, M = 50;
  const UW = PW - M * 2;

  // Logo dimensions for placement (max 80pt tall, proportional)
  let logoDrawW = 0, logoDrawH = 0;
  if (logo) {
    const maxH = 80;
    const maxW = 150;
    const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
    logoDrawW = logo.width * scale;
    logoDrawH = logo.height * scale;
  }

  const pageStreams: string[] = [];
  let s = "";
  let y = PH - M;
  let isFirstPage = true;

  const addLogoToPage = () => {
    if (logo && isFirstPage) {
      // Place logo at top-right corner
      const lx = PW - M - logoDrawW;
      const ly = PH - M - logoDrawH;
      s += `q\n`;
      s += `${logoDrawW.toFixed(2)} 0 0 ${logoDrawH.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)} cm\n`;
      s += `/Im1 Do\n`;
      s += `Q\n`;
      // Reserve space for logo area on right side (adjust y if needed)
      y = Math.min(y, PH - M - logoDrawH - 10);
    }
  };

  const newPage = () => { pageStreams.push(s); s = ""; y = PH - M; isFirstPage = false; };

  // Add logo on first page
  addLogoToPage();

  for (const block of blocks) {
    const isEmpty = block.spans.every(sp => sp.text.trim() === "");
    if (isEmpty) {
      const emptyLh = 11 * 1.15;
      y -= emptyLh;
      if (y < M) newPage();
      continue;
    }

    const visualLines = wrapBlock(block, UW);
    
    for (const vl of visualLines) {
      const maxFs = Math.max(...vl.spans.map(sp => sp.fontSize), 11);
      const lh = maxFs * 1.35;

      if (y - lh < M) newPage();

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

    y -= 5;
  }

  pageStreams.push(s);

  // Assemble PDF
  const objs: string[] = [];
  let oc = 0;
  const add = (c: string) => { oc++; objs.push(`${oc} 0 obj\n${c}\nendobj\n`); return oc; };

  // 1: Catalog
  add(`<< /Type /Catalog /Pages 2 0 R >>`);
  // 2: Pages (placeholder, will be filled)
  const np = pageStreams.length;
  
  // 3: Font Helvetica
  add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  // 4: Font Helvetica-Bold
  add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // 5: Image XObject (if logo)
  let imgObjId = 0;
  if (logo) {
    const filter = logo.isJpeg ? "/DCTDecode" : "/FlateDecode";
    const colorSpace = "/DeviceRGB";
    // For JPEG, we embed the raw bytes directly
    // For PNG, we'd need to extract the raw image data - for simplicity we handle JPEG
    const imgStream = logo.bytes;
    const imgDict = `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter ${filter} /Length ${imgStream.length} >>`;
    oc++;
    imgObjId = oc;
    // Build binary object
    const header = enc.encode(`${oc} 0 obj\n${imgDict}\nstream\n`);
    const footer = enc.encode(`\nendstream\nendobj\n`);
    // We'll handle this specially in the binary assembly
    objs.push(`__IMAGE__`); // placeholder
  }

  // Pages object (obj 2) - need to build after knowing page object IDs
  const firstPageObjId = oc + 1;
  
  // Build resources dict
  let resourcesDict = `/Font << /F1 3 0 R /F2 4 0 R >>`;
  if (logo && imgObjId) {
    resourcesDict += ` /XObject << /Im1 ${imgObjId} 0 R >>`;
  }

  const pageObjIds: number[] = [];
  for (let i = 0; i < np; i++) {
    const sb = enc.encode(pageStreams[i]);
    oc++;
    pageObjIds.push(oc);
    const contentId = oc + 1;
    objs.push(`${oc} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${contentId} 0 R /Resources << ${resourcesDict} >> >>\nendobj\n`);
    oc++;
    objs.push(`${oc} 0 obj\n<< /Length ${sb.length} >>\nstream\n${new TextDecoder().decode(sb)}\nendstream\nendobj\n`);
  }

  // Now build the actual PDF binary
  const kids = pageObjIds.map(id => `${id} 0 R`).join(" ");
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${np} >>\nendobj\n`;

  // Assemble everything as binary to handle image stream
  const parts: Uint8Array[] = [];
  const headerBytes = enc.encode(`%PDF-1.4\n`);
  parts.push(headerBytes);

  const offsets: number[] = [];
  let currentOffset = headerBytes.length;

  // Object 1 (Catalog)
  const obj1 = enc.encode(objs[0]);
  offsets.push(currentOffset);
  parts.push(obj1);
  currentOffset += obj1.length;

  // Object 2 (Pages) 
  const obj2 = enc.encode(pagesObj);
  offsets.push(currentOffset);
  parts.push(obj2);
  currentOffset += obj2.length;

  // Object 3 (Font1)
  const obj3 = enc.encode(objs[1]);
  offsets.push(currentOffset);
  parts.push(obj3);
  currentOffset += obj3.length;

  // Object 4 (Font2)
  const obj4 = enc.encode(objs[2]);
  offsets.push(currentOffset);
  parts.push(obj4);
  currentOffset += obj4.length;

  // Object 5 (Image, if present)
  let objIndex = 3; // next index in objs array
  if (logo && imgObjId) {
    offsets.push(currentOffset);
    const imgHeader = enc.encode(`${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${logo.isJpeg ? "/DCTDecode" : "/FlateDecode"} /Length ${logo.bytes.length} >>\nstream\n`);
    parts.push(imgHeader);
    currentOffset += imgHeader.length;
    parts.push(logo.bytes);
    currentOffset += logo.bytes.length;
    const imgFooter = enc.encode(`\nendstream\nendobj\n`);
    parts.push(imgFooter);
    currentOffset += imgFooter.length;
    objIndex++; // skip the placeholder
  }

  // Page and content stream objects
  for (let i = objIndex; i < objs.length; i++) {
    offsets.push(currentOffset);
    const objBytes = enc.encode(objs[i]);
    parts.push(objBytes);
    currentOffset += objBytes.length;
  }

  // Cross-reference table
  const xrefOffset = currentOffset;
  const totalObjs = oc + 1;
  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (const o of offsets) {
    xref += `${String(o).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(enc.encode(xref));

  // Combine all parts
  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }

  return result;
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

// ===================== Fetch logo from storage =====================

async function fetchLogo(supabase: any): Promise<LogoImage | undefined> {
  try {
    const { data: files } = await supabase.storage.from("uploads").list("", { search: "cession-logo" });
    const logoFile = files?.find((f: any) => f.name.startsWith("cession-logo"));
    if (!logoFile) return undefined;

    const { data, error } = await supabase.storage.from("uploads").download(logoFile.name);
    if (error || !data) return undefined;

    const arrayBuf = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;

    let dims: { width: number; height: number } | null = null;
    if (isJpeg) {
      dims = parseJpegDimensions(bytes);
    } else if (isPng) {
      dims = parsePngDimensions(bytes);
      // For PNG we'd need to decode to raw RGB - not trivial in raw PDF
      // We'll only support JPEG for now; if PNG, skip
      // Actually let's try: we can re-encode as... no. Let's just support JPEG.
      // For PNG files, we won't embed them (too complex without a library).
      console.log("PNG logo detected - only JPEG logos are supported for PDF embedding");
      return undefined;
    }

    if (!dims) return undefined;

    return { bytes, width: dims.width, height: dims.height, isJpeg: true };
  } catch (e) {
    console.error("Error fetching logo:", e);
    return undefined;
  }
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

    // Fetch logo for all PDF generation
    const logo = await fetchLogo(supabase);

    // --- Test PDF mode ---
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
      const pdfBytes = buildPdf(blocks, logo);

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

    const todayISO = new Date().toISOString().slice(0, 10);
    const today = todayISO.split('-').reverse().join('-');
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
    const pdfBytes = buildPdf(blocks, logo);

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
