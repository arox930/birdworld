import { useState, useMemo } from "react";
import { Heart, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { usePairs } from "@/hooks/usePairs";
import { useBirdCommonNames } from "@/hooks/useBirdCommonNames";
import { SpeciesManager } from "@/components/aves/SpeciesManager";
import { PairDetailDialog } from "@/components/parejas/PairDetailDialog";
import { BirdViewDialog } from "@/components/aves/BirdViewDialog";
import { CessionDialog } from "@/components/shared/CessionDialog";
import { useDownloadCessionPdf } from "@/hooks/useCessions";
import { useDebounce } from "@/hooks/useDebounce";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { cn } from "@/lib/utils";
import type { Pair } from "@/hooks/usePairs";

export default function Parejas() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<Pair | null>(null);

  // Offspring action states
  const [viewingBird, setViewingBird] = useState<any>(null);
  const [cessionBird, setCessionBird] = useState<any>(null);
  const [cessionEditMode, setCessionEditMode] = useState(false);
  const { download: downloadCessionPdf } = useDownloadCessionPdf();

  const debouncedSearch = useDebounce(search, 300);
  const { data: commonNames = [] } = useBirdCommonNames();
  const commonNamesList = commonNames.map(cn => cn.nombre);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    commonName: category !== "all" ? category : undefined,
    speciesId: speciesFilter || undefined,
  }), [debouncedSearch, category, speciesFilter]);

  const { data: pairs = [], isLoading } = usePairs(filters);

  const getBirdLabel = (bird: { anilla: string | null; microchip: string | null; sexo: string }) => {
    const parts: string[] = [];
    if (bird.anilla) parts.push(bird.anilla);
    if (bird.microchip) parts.push(bird.microchip);
    return parts.length > 0 ? parts.join(" · ") : bird.sexo;
  };

  const handleViewOffspring = (chick: any) => setViewingBird(chick);
  const handleCessionOffspring = (chick: any) => { setCessionEditMode(false); setCessionBird(chick); };
  const handleEditCessionOffspring = (chick: any) => { setCessionEditMode(true); setCessionBird(chick); };
  const handleDownloadCessionOffspring = (chick: any) => downloadCessionPdf(chick.id, "bird");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          {t("pairs.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {pairs.length} {pairs.length !== 1 ? t("pairs.pairsPlural") : t("pairs.pair")} {pairs.length !== 1 ? t("birds.registeredPlural") : t("birds.registered")}
        </p>
      </div>

      {/* Common name filter */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            type="button"
            onClick={() => { setCategory("all"); setSpeciesFilter(null); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              category === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t("common.allFem")}
          </button>
          {commonNamesList.map(name => (
            <button
              key={name}
              type="button"
              onClick={() => { setCategory(name); setSpeciesFilter(null); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                category === name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {getSpeciesDisplayName(name)}
            </button>
          ))}
        </div>
      </div>


      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("pairs.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Pairs list */}
      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
          {t("common.loading")}
        </div>
      ) : pairs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          {t("pairs.noPairs")}
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map(pair => (
            <button
              key={pair.id}
              type="button"
              onClick={() => setSelectedPair(pair)}
              className="w-full rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors text-left flex items-center gap-4"
            >
              <Heart className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Male */}
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="shrink-0 text-xs">♂</Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{getBirdLabel(pair.bird1)}</p>
                    <p className="text-xs text-muted-foreground truncate">{getSpeciesDisplayName(pair.bird1.especie)}</p>
                  </div>
                </div>
                {/* Female */}
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="shrink-0 text-xs">♀</Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{getBirdLabel(pair.bird2)}</p>
                    <p className="text-xs text-muted-foreground truncate">{getSpeciesDisplayName(pair.bird2.especie)}</p>
                  </div>
                </div>
              </div>
              {pair.bird1.zona && (
                <Badge variant="secondary" className="shrink-0 text-xs hidden sm:inline-flex">
                  {pair.bird1.zona}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      <PairDetailDialog
        open={!!selectedPair}
        onOpenChange={(o) => !o && setSelectedPair(null)}
        pair={selectedPair}
        onViewOffspring={handleViewOffspring}
        onCessionOffspring={handleCessionOffspring}
        onEditCessionOffspring={handleEditCessionOffspring}
        onDownloadCessionOffspring={handleDownloadCessionOffspring}
      />

      <BirdViewDialog
        open={!!viewingBird}
        onOpenChange={(o) => !o && setViewingBird(null)}
        bird={viewingBird}
      />

      <CessionDialog
        open={!!cessionBird}
        onOpenChange={(o) => !o && setCessionBird(null)}
        animalId={cessionBird?.id ?? null}
        animalType="bird"
        animalLabel={cessionBird ? `${getSpeciesDisplayName(cessionBird.especie)} — ${cessionBird.anilla || cessionBird.microchip || "s/id"}` : ""}
        editMode={cessionEditMode}
      />
    </div>
  );
}
