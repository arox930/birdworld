import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, FileIcon, Eye, X } from "lucide-react";
import { useAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment } from "@/hooks/useAttachments";
import type { Attachment } from "@/hooks/useAttachments";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string | null;
  animalType: "bird" | "dog";
  animalLabel: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const PDF_EXT = "pdf";

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(name: string) {
  return IMAGE_EXTS.includes(getFileExt(name));
}

function isPdf(name: string) {
  return getFileExt(name) === PDF_EXT;
}

function isPreviewable(name: string) {
  return isImage(name) || isPdf(name);
}

export function AttachmentsDialog({ open, onOpenChange, animalId, animalType, animalLabel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: attachments = [], isLoading } = useAttachments(animalId, animalType);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();
  const downloadFn = useDownloadAttachment();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !animalId) return;
    uploadMutation.mutate({ animalId, animalType, file });
    e.target.value = "";
  };

  const handlePreview = async (att: Attachment) => {
    setPreviewLoading(true);
    setPreviewName(att.file_name);
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(att.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  };

  const canUpload = attachments.length < 5;

  // Preview overlay
  if (previewUrl) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { closePreview(); onOpenChange(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base truncate pr-2">{previewName}</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={closePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center min-h-0">
            {isImage(previewName) ? (
              <img src={previewUrl} alt={previewName} className="max-w-full max-h-[70vh] object-contain rounded-md" />
            ) : isPdf(previewName) ? (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-md border border-border" title={previewName} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Archivos adjuntos</DialogTitle>
          <p className="text-sm text-muted-foreground">{animalLabel}</p>
        </DialogHeader>

        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin archivos adjuntos</p>
          ) : (
            attachments.map((att: Attachment) => (
              <div key={att.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(att.file_size)} · {format(new Date(att.created_at), "dd-MM-yyyy")}
                  </p>
                </div>
                {isPreviewable(att.file_name) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePreview(att)}
                    disabled={previewLoading}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadFn(att)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(att)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{attachments.length}/5 archivos</span>
          <Button
            size="sm"
            disabled={!canUpload || uploadMutation.isPending}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploadMutation.isPending ? "Subiendo..." : "Subir archivo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
