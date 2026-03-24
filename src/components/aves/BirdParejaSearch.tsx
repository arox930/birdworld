import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type BirdOption = {
  id: string;
  anilla: string | null;
  microchip: string | null;
  sexo: string;
  especie_id: string | null;
};

type Props = {
  nombreComun: string;
  value: string | null;
  onChange: (id: string | null) => void;
  excludeId?: string;
};

export function BirdParejaSearch({ nombreComun, value, onChange, excludeId }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BirdOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!value) { setSelectedLabel(null); return; }
    supabase.from("birds").select("anilla, microchip, sexo").eq("id", value).single()
      .then(({ data }) => {
        if (data) setSelectedLabel(data.anilla || data.microchip || data.sexo);
      });
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const fetchBirds = async () => {
      let query = supabase
        .from("birds")
        .select("id, anilla, microchip, sexo, especie_id")
        .eq("especie", nombreComun)
        .is("fecha_muerte", null)
        .is("fecha_cesion", null)
        .limit(20);

      if (excludeId) query = query.neq("id", excludeId);

      if (debouncedSearch) {
        query = query.or(`anilla.ilike.%${debouncedSearch}%,microchip.ilike.%${debouncedSearch}%`);
      }

      const { data } = await query.order("created_at", { ascending: false });
      setResults(data ?? []);
    };
    fetchBirds();
  }, [open, debouncedSearch, nombreComun, excludeId]);

  const getBirdLabel = (b: BirdOption) => {
    const parts: string[] = [];
    if (b.anilla) parts.push(`Anilla: ${b.anilla}`);
    if (b.microchip) parts.push(`Chip: ${b.microchip}`);
    parts.push(b.sexo);
    return parts.join(" · ");
  };

  return (
    <div className="flex gap-1 items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start text-left font-normal h-10">
            {value && selectedLabel ? (
              <span className="truncate">{selectedLabel}</span>
            ) : (
              <span className="text-muted-foreground">Buscar pareja...</span>
            )}
            <Search className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <Input
            placeholder="Buscar por anilla o microchip..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Sin resultados</p>
            ) : (
              results.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => { onChange(b.id); setSelectedLabel(getBirdLabel(b)); setOpen(false); setSearch(""); }}
                >
                  {getBirdLabel(b)}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
