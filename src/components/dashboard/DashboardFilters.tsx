import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { Filter, X } from "lucide-react";
import type { DashboardFilters as Filters } from "@/hooks/useDashboardData";

const BIRD_SPECIES = Constants.public.Enums.bird_species;

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function DashboardFiltersBar({ filters, onChange }: Props) {
  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  const hasFilters = filters.dateFrom || filters.dateTo || filters.birdSpecies;
  const clearFilters = () => onChange({ dateFrom: null, dateTo: null, birdSpecies: null });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Desde</span>
        <Input type="date" value={filters.dateFrom ?? ""} onChange={(e) => update({ dateFrom: e.target.value || null })} className="h-8 w-36 text-xs" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Hasta</span>
        <Input type="date" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || null })} className="h-8 w-36 text-xs" />
      </div>

      <Select value={filters.birdSpecies ?? "all"} onValueChange={(v) => update({ birdSpecies: v === "all" ? null : v })}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Especie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las especies</SelectItem>
          {BIRD_SPECIES.map(s => (
            <SelectItem key={s} value={s}>{getSpeciesDisplayName(s)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  );
}
