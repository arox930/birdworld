import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextToolbar } from "@/components/plantillas/RichTextToolbar";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";

interface CessionPreviewEditorProps {
  renderedHtml: string;
  onBack: () => void;
  onGenerate: (finalHtml: string) => void;
  isGenerating: boolean;
}

export function CessionPreviewEditor({ renderedHtml, onBack, onGenerate, isGenerating }: CessionPreviewEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = renderedHtml;
        setIsEmpty(!editorRef.current.textContent?.trim());
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [renderedHtml]);

  const handleInput = useCallback(() => {
    setIsEmpty(!editorRef.current?.textContent?.trim());
  }, []);

  const handleGenerate = useCallback(() => {
    const html = editorRef.current?.innerHTML || "";
    onGenerate(html);
  }, [onGenerate]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isGenerating} className="h-7 px-2">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Atrás
        </Button>
        <span>Previsualiza y edita el documento antes de generar el PDF</span>
      </div>

      <div>
        <RichTextToolbar editorRef={editorRef} />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[350px] max-h-[500px] overflow-y-auto p-4 border border-t-0 border-border rounded-b-md bg-background text-foreground text-sm leading-snug focus:outline-none focus:ring-1 focus:ring-ring"
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Cancelar
        </Button>
        <Button onClick={handleGenerate} disabled={isEmpty || isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          {isGenerating ? "Generando PDF..." : "Generar PDF"}
        </Button>
      </div>
    </div>
  );
}
