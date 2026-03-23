import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bold, Underline, AlignLeft, AlignCenter, AlignRight,
  Type, Palette, Highlighter,
} from "lucide-react";
import { useCallback } from "react";

const FONT_SIZES = ["8", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"];

const TEXT_COLORS = [
  "#000000", "#333333", "#666666", "#999999",
  "#dc2626", "#ea580c", "#d97706", "#65a30d",
  "#059669", "#0891b2", "#2563eb", "#7c3aed",
  "#c026d3", "#e11d48",
];

const BG_COLORS = [
  "transparent", "#fef9c3", "#fde68a", "#fed7aa",
  "#fecaca", "#fce7f3", "#e9d5ff", "#dbeafe",
  "#ccfbf1", "#d1fae5", "#dcfce7", "#f1f5f9",
];

interface Props {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export function RichTextToolbar({ editorRef }: Props) {
  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }, [editorRef]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-border rounded-t-md bg-muted/30">
      {/* Bold */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => exec("bold")}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Underline */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => exec("underline")}
        title="Subrayado"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("justifyLeft")} title="Alinear izquierda">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("justifyCenter")} title="Centrar">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("justifyRight")} title="Alinear derecha">
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Font size */}
      <div className="flex items-center gap-1">
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        <Select onValueChange={(v) => {
          editorRef.current?.focus();
          // execCommand fontSize only supports 1-7, use CSS approach
          document.execCommand("fontSize", false, "7");
          // Find the font element just created and replace with span
          const fonts = editorRef.current?.querySelectorAll('font[size="7"]');
          fonts?.forEach((el) => {
            const span = document.createElement("span");
            span.style.fontSize = `${v}px`;
            span.innerHTML = el.innerHTML;
            el.replaceWith(span);
          });
        }}>
          <SelectTrigger className="h-8 w-[70px] text-xs">
            <SelectValue placeholder="Tamaño" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Color de letra">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <p className="text-xs text-muted-foreground mb-2">Color de letra</p>
          <div className="grid grid-cols-7 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => exec("foreColor", color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Background color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Color de fondo">
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <p className="text-xs text-muted-foreground mb-2">Color de fondo</p>
          <div className="grid grid-cols-6 gap-1">
            {BG_COLORS.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color === "transparent" ? "#fff" : color }}
                onClick={() => exec("hiliteColor", color)}
              >
                {color === "transparent" && <span className="text-xs text-muted-foreground">✕</span>}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
