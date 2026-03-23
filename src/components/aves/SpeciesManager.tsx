import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { useBirdSpeciesCatalog, useCreateBirdSpecies, useDeleteBirdSpecies } from "@/hooks/useBirdSpeciesCatalog";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { cn } from "@/lib/utils";

type Props = {
  nombreComun: string;
  selectedSpeciesId?: string | null;
  onSelectSpecies?: (speciesId: string | null, nombreComun: string) => void;
};

export function SpeciesManager({ nombreComun, selectedSpeciesId, onSelectSpecies }: Props) {
  const { data: species, isLoading } = useBirdSpeciesCatalog(nombreComun);
  const createSpecies = useCreateBirdSpecies();
  const deleteSpecies = useDeleteBirdSpecies();
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createSpecies.mutate(
      { nombre_comun: nombreComun, nombre_especie: trimmed },
      { onSuccess: () => setNewName("") }
    );
  };

  const handleSelectSpecies = (speciesId: string) => {
    if (!onSelectSpecies) return;
    if (selectedSpeciesId === speciesId) {
      onSelectSpecies(null, nombreComun);
    } else {
      onSelectSpecies(speciesId, nombreComun);
    }
    setOpen(false);
  };

  const isActive = !!selectedSpeciesId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className={cn("h-7 px-2 text-xs gap-1", isActive && "shadow-sm")}
        >
          {getSpeciesDisplayName(nombreComun)}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Especies de {getSpeciesDisplayName(nombreComun)}</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Cargando...</p>
          ) : species && species.length > 0 ? (
            <ul className="space-y-1">
              {species.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between text-sm px-2 py-1.5 rounded cursor-pointer hover:bg-muted transition-colors",
                    selectedSpeciesId === s.id && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handleSelectSpecies(s.id)}
                >
                  <span className="flex items-center gap-2">
                    {selectedSpeciesId === s.id && <Check className="h-3 w-3 text-primary" />}
                    <span className="italic">{s.nombre_especie}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSpecies.mutate(s.id);
                      if (selectedSpeciesId === s.id) {
                        onSelectSpecies?.(null, nombreComun);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No hay especies registradas</p>
          )}
          <div className="flex gap-1 pt-1">
            <Input
              placeholder="Ej: Ara Macao"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            />
            <Button size="sm" className="h-8 px-2" onClick={handleAdd} disabled={createSpecies.isPending}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
