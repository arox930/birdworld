import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useExistingZones } from "@/hooks/useExistingZones";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ZonaCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: zones = [] } = useExistingZones();

  const showNewOption = search.trim() !== "" && !zones.some((z) => z.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || <span className="text-muted-foreground">Seleccionar zona…</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar o crear zona…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No se encontraron zonas</CommandEmpty>
            <CommandGroup>
              {/* Option to clear */}
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="text-muted-foreground italic">Sin zona</span>
                </CommandItem>
              )}
              {zones.map((z) => (
                <CommandItem
                  key={z}
                  value={z}
                  onSelect={() => {
                    onChange(z);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === z ? "opacity-100" : "opacity-0")} />
                  {z}
                </CommandItem>
              ))}
              {showNewOption && (
                <CommandItem
                  value={`__new__${search.trim()}`}
                  onSelect={() => {
                    onChange(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="text-primary font-medium">+ Crear "{search.trim()}"</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
