import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { RichTextToolbar } from "./RichTextToolbar";

const DEFAULT_HEADER = "<p><b>DOCUMENTO DE CESIÓN</b></p><p><br></p>";

const BIRD_VARIABLES = [
  { key: "{{nombre_comun}}", label: "Nombre común" },
  { key: "{{especie}}", label: "Especie" },
  { key: "{{sexo}}", label: "Sexo" },
  { key: "{{fecha_nacimiento}}", label: "Fecha de nacimiento" },
  { key: "{{cites}}", label: "CITES" },
  { key: "{{anilla}}", label: "Anilla" },
  { key: "{{microchip}}", label: "Microchip" },
  { key: "{{miteco}}", label: "MITECO" },
  { key: "{{padre}}", label: "Padre" },
  { key: "{{madre}}", label: "Madre" },
  { key: "{{nombre_comprador}}", label: "Nombre comprador" },
  { key: "{{apellidos_comprador}}", label: "Apellidos comprador" },
  { key: "{{dni_comprador}}", label: "DNI comprador" },
  { key: "{{domicilio_comprador}}", label: "Domicilio comprador" },
  { key: "{{fecha_documento}}", label: "Fecha de creación" },
  { key: "{{precio}}", label: "Precio" },
];

const DOG_VARIABLES = [
  { key: "{{nombre}}", label: "Nombre" },
  { key: "{{raza}}", label: "Raza" },
  { key: "{{color}}", label: "Color" },
  { key: "{{sexo}}", label: "Sexo" },
  { key: "{{fecha_nacimiento}}", label: "Fecha nacimiento" },
  { key: "{{microchip}}", label: "Microchip" },
  { key: "{{pedigree}}", label: "Pedigree" },
  { key: "{{nombre_comprador}}", label: "Nombre comprador" },
  { key: "{{apellidos_comprador}}", label: "Apellidos comprador" },
  { key: "{{dni_comprador}}", label: "DNI comprador" },
  { key: "{{domicilio_comprador}}", label: "Domicilio comprador" },
  { key: "{{fecha_documento}}", label: "Fecha de creación" },
  { key: "{{precio}}", label: "Precio" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupKey: string;
  animalType: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  saving: boolean;
}

export function TemplateEditorDialog({ open, onOpenChange, groupKey, animalType, initialContent, onSave, saving }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Detect if content is legacy plain text (no HTML tags)
  const isLegacyPlainText = (content: string) => {
    return content.length > 0 && !/<[a-z][\s\S]*>/i.test(content);
  };

  const convertPlainToHtml = (text: string) => {
    return text
      .split("\n")
      .map((line) => {
        const trimmed = line;
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return `<p><b>${trimmed.slice(2, -2)}</b></p>`;
        }
        return `<p>${trimmed || "<br>"}</p>`;
      })
      .join("");
  };

  useEffect(() => {
    if (open) {
      let html = initialContent || DEFAULT_HEADER;
      if (isLegacyPlainText(html)) {
        html = convertPlainToHtml(html);
      }
      // Delay to ensure contentEditable div is mounted
      const timer = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          setIsEmpty(!editorRef.current.textContent?.trim());
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, initialContent]);

  const displayLabel = animalType === "bird"
    ? groupKey.replace("::", " — ")
    : groupKey;

  const variables = animalType === "bird" ? BIRD_VARIABLES : DOG_VARIABLES;

  // Save selection before clicking badges (which steals focus)
  const savedSelection = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const insertVariable = useCallback((variable: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    // Restore saved selection
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }

    document.execCommand("insertText", false, variable);
    savedSelection.current = null;
  }, []);

  const handleInput = useCallback(() => {
    setIsEmpty(!editorRef.current?.textContent?.trim());
  }, []);

  const handleSave = useCallback(() => {
    const html = editorRef.current?.innerHTML || "";
    onSave(html);
  }, [onSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Plantilla: {displayLabel}
          </DialogTitle>
          <DialogDescription>
            Edita el contenido del documento de cesión con formato enriquecido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Haz clic en una variable para insertarla en el documento:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <Badge
                  key={v.key}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                  onClick={() => insertVariable(v.key)}
                >
                  {v.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <RichTextToolbar editorRef={editorRef} />
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              className="min-h-[350px] max-h-[500px] overflow-y-auto p-4 border border-t-0 border-border rounded-b-md bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || isEmpty}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Guardar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
