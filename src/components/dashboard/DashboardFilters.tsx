import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { Filter, X } from "lucide-react";
import type { DashboardFilters as Filters } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

const BIRD_SPECIES = Constants.public.Enums.bird_species;

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function DashboardFiltersBar({ filters, onChange }: Props) {
  const [dogBreeds, setDogBreeds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("dogs").select("raza").then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(d => d.raza))].sort();
        setDogBreeds(unique);
      }
    });
  }, []);

  const update = (partial: Partial<Filters>) => {
    const next = { ...filters, ...partial };
    // Auto-select animal type when species/breed is chosen
    if (partial.birdSpecies && partial.birdSpecies !== null) {
      next.animalType = "bird";
      next.dogBreed = null;
    }
    if (partial.dogBreed && partial.dogBreed !== null) {
      next.animalType = "dog";
      next.birdSpecies = null;
    }
    // Clear species/breed when switching animal type
    if (partial.animalType === "dog") next.birdSpecies = null;
    if (partial.animalType === "bird") next.dogBreed = null;
    if (partial.animalType === "all") {
      // keep them, no auto-clear
    }
    onChange(next);
  };

  const hasFilters = filters.dateFrom || filters.dateTo || filters.animalType !== "all" || filters.birdSpecies || filters.dogBreed;

  const clearFilters = () => onChange({ dateFrom: null, dateTo: null, animalType: "all", birdSpecies: null, dogBreed: null });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Desde</span>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || null })}
          className="h-8 w-36 text-xs"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Hasta</span>
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || null })}
          className="h-8 w-36 text-xs"
        />
      </div>

      <Select value={filters.animalType} onValueChange={(v) => update({ animalType: v as Filters["animalType"], birdSpecies: v !== "bird" ? null : filters.birdSpecies, dogBreed: v !== "dog" ? null : filters.dogBreed })}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="bird">Aves</SelectItem>
          <SelectItem value="dog">Perros</SelectItem>
        </SelectContent>
      </Select>

      {filters.animalType !== "dog" && (
        <Select value={filters.birdSpecies ?? "all"} onValueChange={(v) => update({ birdSpecies: v === "all" ? null : v })}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Especie ave" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especies</SelectItem>
            {BIRD_SPECIES.map(s => (
              <SelectItem key={s} value={s}>{getSpeciesDisplayName(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filters.animalType !== "bird" && dogBreeds.length > 0 && (
        <Select value={filters.dogBreed ?? "all"} onValueChange={(v) => update({ dogBreed: v === "all" ? null : v })}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Raza perro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las razas</SelectItem>
            {dogBreeds.map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  );
}
