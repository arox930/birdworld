import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Bird } from "@/hooks/useBirds";
import { format } from "date-fns";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bird: Bird | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function BirdViewDialog({ open, onOpenChange, bird }: Props) {
  const { t } = useTranslation();
  if (!bird) return null;

  const estado = bird.fecha_muerte ? t("birds.dead") : bird.fecha_cesion ? t("birds.ceded") : t("birds.alive");
  const speciesCatalog = (bird as any).species_catalog;
  const buyer = (bird as any).buyers;
  const pareja = (bird as any).pareja;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSpeciesDisplayName(bird.especie)}
            <Badge variant={bird.fecha_muerte ? "destructive" : bird.fecha_cesion ? "secondary" : "default"}>
              {estado}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label={t("birds.commonName")} value={getSpeciesDisplayName(bird.especie)} />
          <Field label={t("birds.speciesLabel")} value={speciesCatalog?.nombre_especie} />
          <Field label={t("birds.sex")} value={bird.sexo} />
          <Field label={t("birds.ring")} value={bird.anilla} />
          <Field label={t("birds.microchip")} value={bird.microchip} />
          <Field label={t("birds.citesNumber")} value={bird.numero_cites} />
          <Field label={t("birds.mitecoId")} value={bird.id_miteco} />
          <Field label={t("birds.zone")} value={bird.zona} />
          <Field label={t("birds.birthDate")} value={format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")} />
          {bird.fecha_cesion && <Field label={t("birds.cessionDate")} value={format(new Date(bird.fecha_cesion), "dd-MM-yyyy")} />}
          {bird.fecha_muerte && <Field label={t("birds.deathDate")} value={format(new Date(bird.fecha_muerte), "dd-MM-yyyy")} />}
          {buyer && <Field label={t("birds.buyer")} value={`${buyer.nombre} ${buyer.apellidos}`} />}
          {bird.comprador_texto && <Field label={t("birds.buyerText")} value={bird.comprador_texto} />}
          {bird.padre_externo && <Field label={t("birds.externalFather")} value={bird.padre_externo} />}
          {bird.madre_externa && <Field label={t("birds.externalMother")} value={bird.madre_externa} />}
          {pareja && <Field label={t("birds.partner")} value={`${getSpeciesDisplayName(pareja.especie)} — ${pareja.anilla || pareja.microchip || "s/id"}`} />}
        </div>
        {bird.comentarios && (
          <div>
            <span className="text-xs text-muted-foreground">{t("birds.comments")}</span>
            <p className="text-sm whitespace-pre-wrap">{bird.comentarios}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
