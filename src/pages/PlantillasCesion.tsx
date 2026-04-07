import { useState } from "react";
import { Bird, ChevronRight, FileText, Plus, Pencil, Download } from "lucide-react";
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
        // Try to extract error message from context
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

      // data is a Blob when the response is not JSON
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
      <p className="text-sm text-muted-foreground">
        {t("templates.description")}{" "}
        {t("templates.useVariables")} <code className="bg-muted px-1 rounded text-xs">{"{{nombre_comprador}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{dni_comprador}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{precio}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{fecha}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{identificador_animal}}"}</code> {t("templates.toAutofill")}
      </p>

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
