import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const SEXES = Constants.public.Enums.animal_sex;

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  sexo: string;
  onSexoChange: (v: string) => void;
  estado: string;
  onEstadoChange: (v: string) => void;
};

export function DogsFilters({ search, onSearchChange, sexo, onSexoChange, estado, onEstadoChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, microchip, raza..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>
      <Select value={sexo} onValueChange={onSexoChange}>
        <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Sexo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {SEXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={estado} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="vivo">Vivo</SelectItem>
          <SelectItem value="muerto">Muerto</SelectItem>
          <SelectItem value="cedido">Cedido</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
