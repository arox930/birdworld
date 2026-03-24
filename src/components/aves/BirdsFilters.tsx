import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";

const SEXES = Constants.public.Enums.animal_sex;

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  sexo: string;
  onSexoChange: (v: string) => void;
  estado: string;
  onEstadoChange: (v: string) => void;
};

export function BirdsFilters({
  search, onSearchChange,
  sexo, onSexoChange,
  estado, onEstadoChange,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("birds.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={sexo} onValueChange={onSexoChange}>
        <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder={t("birds.sex")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          {SEXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={estado} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder={t("birds.status")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="vivo">{t("birds.alive")}</SelectItem>
          <SelectItem value="muerto">{t("birds.dead")}</SelectItem>
          <SelectItem value="cedido">{t("birds.ceded")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
