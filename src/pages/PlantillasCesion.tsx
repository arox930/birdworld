import { useState, useEffect, useRef } from "react";
import { Bird, ChevronRight, FileText, Plus, Pencil, Download, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useCessionTemplates, useUpsertCessionTemplate } from "@/hooks/useCessionTemplates";
import { useBirdSpeciesCatalog } from "@/hooks/useBirdSpeciesCatalog";
import { useBirdCommonNames } from "@/hooks/useBirdCommonNames";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { TemplateEditorDialog } from "@/components/plantillas/TemplateEditorDialog";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LOGO_PATH = "cession-logo";

export default function PlantillasCesion() {
  const { t } = useTranslation();
  const { data: templates = [] } = useCessionTemplates();
  const { data: speciesCatalog = [] } = useBirdSpeciesCatalog();
  const { data: commonNames = [] } = useBirdCommonNames();
  const upsert = useUpsertCessionTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<string>("");
  const [editingKey, setEditingKey] = useState<string>("");
  const [editingContent, setEditingContent] = useState<string>("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing logo on mount
  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    // List files with the logo prefix to find any extension
    const { data: files } = await supabase.storage.from("uploads").list("", {
      search: LOGO_PATH,
    });
    const logoFile = files?.find((f) => f.name.startsWith(LOGO_PATH));
    if (logoFile) {
      const { data } = await supabase.storage.from("uploads").createSignedUrl(logoFile.name, 3600);
      if (data?.signedUrl) setLogoUrl(data.signedUrl);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("templates.logoInvalidType", "Solo se permiten imágenes"));
      return;
    }

    setLogoLoading(true);
    try {
      // Remove old logo files
      const { data: existing } = await supabase.storage.from("uploads").list("", { search: LOGO_PATH });
      if (existing?.length) {
        await supabase.storage.from("uploads").remove(existing.map((f) => f.name));
      }

      const ext = file.name.split(".").pop() || "png";
      const fileName = `${LOGO_PATH}.${ext}`;

      const { error } = await supabase.storage.from("uploads").upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;

      const { data } = await supabase.storage.from("uploads").createSignedUrl(fileName, 3600);
      if (data?.signedUrl) setLogoUrl(data.signedUrl);
      toast.success(t("templates.logoUploaded", "Logo subido correctamente"));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLogoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setLogoLoading(true);
    try {
      const { data: existing } = await supabase.storage.from("uploads").list("", { search: LOGO_PATH });
      if (existing?.length) {
        await supabase.storage.from("uploads").remove(existing.map((f) => f.name));
      }
      setLogoUrl(null);
      toast.success(t("templates.logoRemoved", "Logo eliminado"));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLogoLoading(false);
    }
  };

  const getTemplate = (type: string, key: string) =>
    templates.find((t) => t.animal_type === type && t.group_key === key);

  const openEditor = (type: string, key: string) => {
    const existing = getTemplate(type, key);
    setEditingType(type);
    setEditingKey(key);
    setEditingContent(existing?.template_content || "");
    setEditorOpen(true);
  };

  const handleSave = async (content: string) => {
    await upsert.mutateAsync({
      animal_type: editingType,
      group_key: editingKey,
      template_content: content,
    });
    setEditorOpen(false);
  };

  const handleTestDownload = async (type: string, key: string) => {
    const tpl = getTemplate(type, key);
    if (!tpl) return;
    setDownloadingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cession-pdf", {
        body: {
          test_pdf: true,
          template_content: tpl.template_content,
          template_animal_type: type,
        },
      });

      if (error) {
        try {
          const context = (error as any).context;
          if (context instanceof Response) {
            const body = await context.json();
            if (body?.error) throw new Error(body.error);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
        }
        throw error;
      }

      const blob = data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cesion_prueba.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(`Error al descargar prueba: ${e.message}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  const birdGroups: Record<string, string[]> = {};
  for (const cn of commonNames) {
    birdGroups[cn.nombre] = speciesCatalog
      .filter((s) => s.nombre_comun === cn.nombre)
      .map((s) => s.nombre_especie);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("templates.title")}</h1>
      </div>

      {/* Logo upload section */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">
            {t("templates.logoTitle", "Logo para documentos de cesión")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("templates.logoDescription", "Este logo aparecerá en la esquina superior derecha de todos los documentos de cesión generados.")}
        </p>

        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={logoUrl}
                alt="Logo cesión"
                className="h-16 w-auto max-w-[160px] object-contain rounded border border-border bg-background p-1"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoLoading}
                >
                  <Pencil className="h-3 w-3" />
                  {t("templates.logoChange", "Cambiar")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1"
                  onClick={handleLogoRemove}
                  disabled={logoLoading}
                >
                  {logoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  {t("templates.logoRemoveBtn", "Eliminar")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoLoading}
            >
              {logoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
              {t("templates.logoUpload", "Subir logo")}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
          <Bird className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{t("templates.birdsSection")}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 mt-2 space-y-1">
          {commonNames.map((cn) => (
            <Collapsible key={cn.id}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                <span className="font-medium text-foreground">{getSpeciesDisplayName(cn.nombre)}</span>
                <span className="text-muted-foreground text-xs">({birdGroups[cn.nombre]?.length || 0} {t("templates.speciesCount")})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                {(birdGroups[cn.nombre] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">{t("templates.noSpeciesRegistered")}</p>
                ) : (
                  birdGroups[cn.nombre].map((especie) => {
                    const key = `${cn.nombre}::${especie}`;
                    const has = !!getTemplate("bird", key);
                    return (
                      <div key={especie} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30">
                        <span className="text-sm text-foreground">{especie}</span>
                        <div className="flex items-center gap-1.5">
                          {has && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              disabled={downloadingKey === key}
                              onClick={() => handleTestDownload("bird", key)}
                            >
                              <Download className="h-3 w-3" />
                              {downloadingKey === key ? "..." : t("templates.testDownload")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={has ? "outline" : "default"}
                            className="h-7 text-xs gap-1"
                            onClick={() => openEditor("bird", key)}
                          >
                            {has ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            {has ? t("common.edit") : t("common.add")}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        groupKey={editingKey}
        animalType={editingType}
        initialContent={editingContent}
        onSave={handleSave}
        saving={upsert.isPending}
      />
    </div>
  );
}
