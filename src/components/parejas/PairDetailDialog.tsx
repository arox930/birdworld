import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, Baby } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { usePairOffspring } from "@/hooks/usePairs";
import type { Pair } from "@/hooks/usePairs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pair: Pair | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function BirdCard({ bird, sexLabel, t }: { bird: Pair["bird1"]; sexLabel: string; t: any }) {
  const estado = bird.fecha_muerte ? t("birds.dead") : bird.fecha_cesion ? t("birds.ceded") : t("birds.alive");
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{sexLabel}</Badge>
        <span className="font-medium text-sm">{getSpeciesDisplayName(bird.especie)}</span>
        <Badge variant={bird.fecha_muerte ? "destructive" : bird.fecha_cesion ? "secondary" : "default"} className="text-xs ml-auto">
          {estado}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("birds.ring")} value={bird.anilla} />
        <Field label={t("birds.microchip")} value={bird.microchip} />
        <Field label={t("birds.citesNumber")} value={bird.numero_cites} />
        <Field label={t("birds.mitecoId")} value={bird.id_miteco} />
        <Field label={t("birds.speciesLabel")} value={bird.species_catalog?.nombre_especie} />
        <Field label={t("birds.zone")} value={bird.zona} />
        <Field label={t("birds.birthDate")} value={format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")} />
      </div>
    </div>
  );
}

export function PairDetailDialog({ open, onOpenChange, pair }: Props) {
  const { t } = useTranslation();
  const { data: offspring = [], isLoading: loadingOffspring } = usePairOffspring(
    pair?.bird1.id ?? null,
    pair?.bird2.id ?? null
  );

  if (!pair) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t("pairs.pairDetail")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <BirdCard bird={pair.bird1} sexLabel="♂" t={t} />
          <BirdCard bird={pair.bird2} sexLabel="♀" t={t} />
        </div>

        {/* Offspring */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Baby className="h-4 w-4 text-primary" />
            {t("pairs.offspring")} ({offspring.length})
          </h3>

          {loadingOffspring ? (
            <p className="text-sm text-muted-foreground animate-pulse">{t("common.loading")}</p>
          ) : offspring.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pairs.noOffspring")}</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left">{t("birds.ring")}</th>
                    <th className="px-3 py-2 text-left">{t("birds.microchip")}</th>
                    <th className="px-3 py-2 text-left">{t("birds.sex")}</th>
                    <th className="px-3 py-2 text-left">{t("birds.birthDate")}</th>
                    <th className="px-3 py-2 text-left">{t("birds.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {offspring.map((chick: any) => {
                    const estado = chick.fecha_muerte ? t("birds.dead") : chick.fecha_cesion ? t("birds.ceded") : t("birds.alive");
                    return (
                      <tr key={chick.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2">{chick.anilla || "—"}</td>
                        <td className="px-3 py-2">{chick.microchip || "—"}</td>
                        <td className="px-3 py-2">{chick.sexo}</td>
                        <td className="px-3 py-2">{format(new Date(chick.fecha_nacimiento), "dd-MM-yyyy")}</td>
                        <td className="px-3 py-2">
                          <Badge variant={chick.fecha_muerte ? "destructive" : chick.fecha_cesion ? "secondary" : "default"} className="text-xs">
                            {estado}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
