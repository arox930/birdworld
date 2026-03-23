import { useState, useMemo } from "react";
import { Bird, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BirdsTable } from "@/components/aves/BirdsTable";
import { BirdsFilters } from "@/components/aves/BirdsFilters";
import { BirdFormDialog } from "@/components/aves/BirdFormDialog";
import { BirdDeleteDialog } from "@/components/aves/BirdDeleteDialog";
import { CessionDialog } from "@/components/shared/CessionDialog";
import { AttachmentsDialog } from "@/components/shared/AttachmentsDialog";
import { BirdViewDialog } from "@/components/aves/BirdViewDialog";
import { SpeciesManager } from "@/components/aves/SpeciesManager";
import { useBirds, useCreateBird, useUpdateBird, useDeleteBird } from "@/hooks/useBirds";
import type { Bird as BirdType, BirdInsert } from "@/hooks/useBirds";
import { useDownloadCessionPdf } from "@/hooks/useCessions";
import { Constants } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { getSpeciesDisplayName } from "@/lib/speciesNames";

const COMMON_NAMES = Constants.public.Enums.bird_species;
const PAGE_SIZE = 20;

export default function Aves() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sexo, setSexo] = useState("all");
  const [estado, setEstado] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    especie: category !== "all" ? category : undefined,
    especieId: speciesFilter || undefined,
    sexo: sexo !== "all" ? sexo : undefined,
    estado: estado !== "all" ? estado : undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, category, speciesFilter, sexo, estado, page]);

  const { data, isLoading } = useBirds(filters);
  const birds = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const createBird = useCreateBird();
  const updateBird = useUpdateBird();
  const deleteBird = useDeleteBird();
  const { download: downloadCessionPdf } = useDownloadCessionPdf();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<BirdType | null>(null);
  const [deletingBird, setDeletingBird] = useState<BirdType | null>(null);
  const [cessionBird, setCessionBird] = useState<BirdType | null>(null);
  const [cessionEditMode, setCessionEditMode] = useState(false);
  const [attachmentsBird, setAttachmentsBird] = useState<BirdType | null>(null);
  const [viewingBird, setViewingBird] = useState<BirdType | null>(null);

  const handleAdd = () => { setEditingBird(null); setFormOpen(true); };
  const handleEdit = (bird: BirdType) => { setEditingBird(bird); setFormOpen(true); };
  const handleDelete = (bird: BirdType) => setDeletingBird(bird);
  const handleCession = (bird: BirdType) => { setCessionEditMode(false); setCessionBird(bird); };
  const handleEditCession = (bird: BirdType) => { setCessionEditMode(true); setCessionBird(bird); };
  const handleDownloadCession = (bird: BirdType) => downloadCessionPdf(bird.id, "bird");

  const handleFormSubmit = (data: BirdInsert) => {
    if (editingBird) {
      updateBird.mutate({ id: editingBird.id, ...data }, { onSuccess: () => setFormOpen(false) });
    } else {
      createBird.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingBird) {
      deleteBird.mutate(deletingBird.id, { onSuccess: () => setDeletingBird(null) });
    }
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bird className="h-6 w-6 text-primary" />
            Aves
          </h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} ejemplar{totalCount !== 1 ? "es" : ""} registrado{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Añadir
        </Button>
      </div>

      <Tabs value={category} onValueChange={handleFilterChange(setCategory)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          {COMMON_NAMES.map(s => (
            <TabsTrigger key={s} value={s} className="text-xs">{getSpeciesDisplayName(s)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Species management + filtering */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-xs text-muted-foreground mr-1">Especies:</span>
        {COMMON_NAMES.map(cn => (
          <SpeciesManager
            key={cn}
            nombreComun={cn}
            selectedSpeciesId={speciesFilter}
            onSelectSpecies={(id, nombre) => {
              setSpeciesFilter(id);
              if (id) {
                setCategory(nombre);
              }
              setPage(0);
            }}
          />
        ))}
      </div>

      <BirdsFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        sexo={sexo}
        onSexoChange={handleFilterChange(setSexo)}
        estado={estado}
        onEstadoChange={handleFilterChange(setEstado)}
      />

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
          Cargando...
        </div>
      ) : (
        <BirdsTable
          birds={birds}
          onView={setViewingBird}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCession={handleCession}
          onEditCession={handleEditCession}
          onDownloadCession={handleDownloadCession}
          onAttachments={setAttachmentsBird}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Pág. {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <BirdFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bird={editingBird}
        onSubmit={handleFormSubmit}
        isLoading={createBird.isPending || updateBird.isPending}
      />
      <BirdDeleteDialog
        open={!!deletingBird}
        onOpenChange={(open) => !open && setDeletingBird(null)}
        bird={deletingBird}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteBird.isPending}
      />
      <CessionDialog
        open={!!cessionBird}
        onOpenChange={(o) => !o && setCessionBird(null)}
        animalId={cessionBird?.id ?? null}
        animalType="bird"
        animalLabel={cessionBird ? `${getSpeciesDisplayName(cessionBird.especie)} — ${cessionBird.anilla || cessionBird.microchip || "s/id"}` : ""}
        editMode={cessionEditMode}
      />
      <AttachmentsDialog
        open={!!attachmentsBird}
        onOpenChange={(o) => !o && setAttachmentsBird(null)}
        animalId={attachmentsBird?.id ?? null}
        animalType="bird"
        animalLabel={attachmentsBird ? `${getSpeciesDisplayName(attachmentsBird.especie)} — ${attachmentsBird.anilla || attachmentsBird.microchip || "s/id"}` : ""}
      />
      <BirdViewDialog open={!!viewingBird} onOpenChange={(o) => !o && setViewingBird(null)} bird={viewingBird} />
    </div>
  );
}
