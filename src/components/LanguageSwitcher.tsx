import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={i18n.language?.substring(0, 2) || "es"} onValueChange={(v) => i18n.changeLanguage(v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-none bg-transparent shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
