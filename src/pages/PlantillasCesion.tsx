import { useState } from "react";
import { Bird, ChevronRight, FileText, Plus, Pencil } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useCessionTemplates, useUpsertCessionTemplate } from "@/hooks/useCessionTemplates";
import { useBirdSpeciesCatalog } from "@/hooks/useBirdSpeciesCatalog";
import { useBirdCommonNames } from "@/hooks/useBirdCommonNames";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { TemplateEditorDialog } from "@/components/plantillas/TemplateEditorDialog";

export default function PlantillasCesion() {
  const { data: templates = [] } = useCessionTemplates();
  const { data: speciesCatalog = [] } = useBirdSpeciesCatalog();
  const { data: commonNames = [] } = useBirdCommonNames();
  const upsert = useUpsertCessionTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<string>("");
  const [editingKey, setEditingKey] = useState<string>("");
  const [editingContent, setEditingContent] = useState<string>("");

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
        <h1 className="text-2xl font-bold text-foreground">Plantillas de Cesión</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Crea plantillas de documento de cesión por especie. 
        Usa variables como <code className="bg-muted px-1 rounded text-xs">{"{{nombre_comprador}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{dni_comprador}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{precio}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{fecha}}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{{identificador_animal}}"}</code> para autocompletar.
      </p>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
          <Bird className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Aves</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 mt-2 space-y-1">
          {commonNames.map((cn) => (
            <Collapsible key={cn.id}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                <span className="font-medium text-foreground">{getSpeciesDisplayName(cn.nombre)}</span>
                <span className="text-muted-foreground text-xs">({birdGroups[cn.nombre]?.length || 0} especies)</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                {(birdGroups[cn.nombre] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">Sin especies registradas</p>
                ) : (
                  birdGroups[cn.nombre].map((especie) => {
                    const key = `${cn.nombre}::${especie}`;
                    const has = !!getTemplate("bird", key);
                    return (
                      <div key={especie} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30">
                        <span className="text-sm text-foreground">{especie}</span>
                        <Button
                          size="sm"
                          variant={has ? "outline" : "default"}
                          className="h-7 text-xs gap-1"
                          onClick={() => openEditor("bird", key)}
                        >
                          {has ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {has ? "Editar" : "Añadir"}
                        </Button>
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
