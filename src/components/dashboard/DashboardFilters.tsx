import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { Filter, X } from "lucide-react";
import type { DashboardFilters as Filters } from "@/hooks/useDashboardData";
import { useBirdCommonNames } from "@/hooks/useBirdCommonNames";
import { useTranslation } from "react-i18next";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function DashboardFiltersBar({ filters, onChange }: Props) {
  const { data: commonNames = [] } = useBirdCommonNames();
  const { t } = useTranslation();

  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  const hasFilters = filters.dateFrom || filters.dateTo || filters.birdSpecies;
  const clearFilters = () => onChange({ dateFrom: null, dateTo: null, birdSpecies: null });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("common.from")}</span>
        <Input type="date" value={filters.dateFrom ?? ""} onChange={(e) => update({ dateFrom: e.target.value || null })} className="h-8 w-36 text-xs" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("common.to")}</span>
        <Input type="date" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || null })} className="h-8 w-36 text-xs" />
      </div>

      <Select value={filters.birdSpecies ?? "all"} onValueChange={(v) => update({ birdSpecies: v === "all" ? null : v })}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder={t("dashboard.species")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("dashboard.allSpecies")}</SelectItem>
          {commonNames.map(s => (
            <SelectItem key={s.id} value={s.nombre}>{getSpeciesDisplayName(s.nombre)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
          <X className="h-3 w-3" /> {t("common.clear")}
        </Button>
      )}
    </div>
  );
}
