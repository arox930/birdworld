import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";

type PairResult = {
  pairKey: string;
  male: { id: string; anilla: string | null; microchip: string | null; numero_cites: string | null; id_miteco: string | null };
  female: { id: string; anilla: string | null; microchip: string | null; numero_cites: string | null; id_miteco: string | null };
};

type Props = {
  especie: string;
  onSelect: (male: PairResult["male"], female: PairResult["female"]) => void;
  onClear: () => void;
  selectedLabel: string | null;
};

export function ParentPairSearch({ especie, onSelect, onClear, selectedLabel }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pairs, setPairs] = useState<PairResult[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!open || !especie) return;

    const fetchPairs = async () => {
      let query = supabase
        .from("birds")
        .select("id, anilla, microchip, sexo, especie, pareja_id, numero_cites, id_miteco")
        .eq("especie", especie)
        .not("pareja_id", "is", null)
        .is("fecha_muerte", null)
        .is("fecha_cesion", null);

      if (debouncedSearch) {
        query = query.or(
          `anilla.ilike.%${debouncedSearch}%,microchip.ilike.%${debouncedSearch}%,numero_cites.ilike.%${debouncedSearch}%,id_miteco.ilike.%${debouncedSearch}%`
        );
      }

      const { data } = await query.order("created_at", { ascending: false }).limit(50);
      if (!data) { setPairs([]); return; }

      const pairMap = new Map<string, PairResult>();
      for (const bird of data) {
        if (!bird.pareja_id) continue;
        const key = [bird.id, bird.pareja_id].sort().join("-");
        if (pairMap.has(key)) continue;

        const partner = data.find(b => b.id === bird.pareja_id);
        if (!partner) continue;

        const [male, female] = bird.sexo === "Macho" ? [bird, partner] : [partner, bird];
        pairMap.set(key, {
          pairKey: key,
          male: { id: male.id, anilla: male.anilla, microchip: male.microchip, numero_cites: male.numero_cites, id_miteco: male.id_miteco },
          female: { id: female.id, anilla: female.anilla, microchip: female.microchip, numero_cites: female.numero_cites, id_miteco: female.id_miteco },
        });
      }
      setPairs(Array.from(pairMap.values()));
    };

    fetchPairs();
  }, [open, debouncedSearch, especie]);

  const getBirdLabel = (b: { anilla: string | null; microchip: string | null }) =>
    b.anilla || b.microchip || "s/id";

  return (
    <div className="flex gap-1 items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start text-left font-normal h-10">
            {selectedLabel ? (
              <span className="truncate">{selectedLabel}</span>
            ) : (
              <span className="text-muted-foreground">{t("birds.searchPair")}</span>
            )}
            <Search className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-2" align="start">
          <Input
            placeholder={t("birds.searchByAnyField")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {pairs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">{t("common.noResults")}</p>
            ) : (
              pairs.map((p) => (
                <button
                  key={p.pairKey}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    onSelect(p.male, p.female);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="font-medium">♂</span> {getBirdLabel(p.male)} — <span className="font-medium">♀</span> {getBirdLabel(p.female)}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedLabel && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
