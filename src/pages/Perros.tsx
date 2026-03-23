import { useState, useMemo } from "react";
import { Dog as DogIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DogsTable } from "@/components/perros/DogsTable";
import { DogsFilters } from "@/components/perros/DogsFilters";
import { DogFormDialog } from "@/components/perros/DogFormDialog";
import { DogDeleteDialog } from "@/components/perros/DogDeleteDialog";
import { DogViewDialog } from "@/components/perros/DogViewDialog";
import { VaccinesDialog } from "@/components/perros/VaccinesDialog";
import { LittersDialog } from "@/components/perros/LittersDialog";
import { AddToLitterDialog } from "@/components/perros/AddToLitterDialog";
import { CessionDialog } from "@/components/shared/CessionDialog";
import { AttachmentsDialog } from "@/components/shared/AttachmentsDialog";
import { useDogs, useCreateDog, useUpdateDog, useDeleteDog } from "@/hooks/useDogs";
import type { Dog, DogInsert } from "@/hooks/useDogs";
import { useDownloadCessionPdf } from "@/hooks/useCessions";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 20;

export default function Perros() {
  const [search, setSearch] = useState("");
  const [sexo, setSexo] = useState("all");
  const [estado, setEstado] = useState("all");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    sexo: sexo !== "all" ? sexo : undefined,
    estado: estado !== "all" ? estado : undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, sexo, estado, page]);

  const { data, isLoading } = useDogs(filters);
  const dogs = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const createDog = useCreateDog();
  const updateDog = useUpdateDog();
  const deleteDog = useDeleteDog();
  const { download: downloadCessionPdf } = useDownloadCessionPdf();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [deletingDog, setDeletingDog] = useState<Dog | null>(null);
  const [vaccinesDog, setVaccinesDog] = useState<Dog | null>(null);
  const [littersDog, setLittersDog] = useState<Dog | null>(null);
  const [cessionDog, setCessionDog] = useState<Dog | null>(null);
  const [cessionEditMode, setCessionEditMode] = useState(false);
  const [attachmentsDog, setAttachmentsDog] = useState<Dog | null>(null);
  const [viewingDog, setViewingDog] = useState<Dog | null>(null);
  const [addToLitterDog, setAddToLitterDog] = useState<Dog | null>(null);

  const handleAdd = () => { setEditingDog(null); setFormOpen(true); };
  const handleEdit = (dog: Dog) => { setEditingDog(dog); setFormOpen(true); };
  const handleDelete = (dog: Dog) => setDeletingDog(dog);
  const handleCession = (dog: Dog) => { setCessionEditMode(false); setCessionDog(dog); };
  const handleEditCession = (dog: Dog) => { setCessionEditMode(true); setCessionDog(dog); };
  const handleDownloadCession = (dog: Dog) => downloadCessionPdf(dog.id, "dog");

  const handleFormSubmit = (data: DogInsert) => {
    if (editingDog) {
      updateDog.mutate({ id: editingDog.id, ...data }, { onSuccess: () => setFormOpen(false) });
    } else {
      createDog.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingDog) deleteDog.mutate(deletingDog.id, { onSuccess: () => setDeletingDog(null) });
  };

  const resetPage = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(0); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DogIcon className="h-6 w-6 text-primary" /> Perros
          </h1>
          <p className="text-muted-foreground text-sm">{totalCount} perro{totalCount !== 1 ? "s" : ""} registrado{totalCount !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
      </div>

      <DogsFilters
        search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }}
        sexo={sexo} onSexoChange={resetPage(setSexo)}
        estado={estado} onEstadoChange={resetPage(setEstado)}
      />

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">Cargando...</div>
      ) : (
        <DogsTable
          dogs={dogs}
          onView={setViewingDog}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCession={handleCession}
          onEditCession={handleEditCession}
          onDownloadCession={handleDownloadCession}
          onVaccines={setVaccinesDog}
          onLitters={setLittersDog}
          onAttachments={setAttachmentsDog}
          onAddToLitter={setAddToLitterDog}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pág. {page + 1} de {totalPages}</span>
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

      <DogFormDialog open={formOpen} onOpenChange={setFormOpen} dog={editingDog} onSubmit={handleFormSubmit} isLoading={createDog.isPending || updateDog.isPending} />
      <DogDeleteDialog open={!!deletingDog} onOpenChange={(o) => !o && setDeletingDog(null)} dog={deletingDog} onConfirm={handleDeleteConfirm} isLoading={deleteDog.isPending} />
      <VaccinesDialog open={!!vaccinesDog} onOpenChange={(o) => !o && setVaccinesDog(null)} dog={vaccinesDog} />
      <LittersDialog open={!!littersDog} onOpenChange={(o) => !o && setLittersDog(null)} dog={littersDog} />
      
      <CessionDialog
        open={!!cessionDog}
        onOpenChange={(o) => !o && setCessionDog(null)}
        animalId={cessionDog?.id ?? null}
        animalType="dog"
        animalLabel={cessionDog ? `${cessionDog.nombre} (${cessionDog.raza})` : ""}
        editMode={cessionEditMode}
      />
      <AttachmentsDialog
        open={!!attachmentsDog}
        onOpenChange={(o) => !o && setAttachmentsDog(null)}
        animalId={attachmentsDog?.id ?? null}
        animalType="dog"
        animalLabel={attachmentsDog ? `${attachmentsDog.nombre} (${attachmentsDog.raza})` : ""}
      />
      <DogViewDialog open={!!viewingDog} onOpenChange={(o) => !o && setViewingDog(null)} dog={viewingDog} />
      <AddToLitterDialog open={!!addToLitterDog} onOpenChange={(o) => !o && setAddToLitterDog(null)} dog={addToLitterDog} />
    </div>
  );
}
