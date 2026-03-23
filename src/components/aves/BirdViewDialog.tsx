import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Bird } from "@/hooks/useBirds";
import { format } from "date-fns";
import { getSpeciesDisplayName } from "@/lib/speciesNames";

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
  if (!bird) return null;

  const estado = bird.fecha_muerte ? "Muerto" : bird.fecha_cesion ? "Cedido" : "Vivo";
  const speciesCatalog = (bird as any).species_catalog;
  const buyer = (bird as any).buyers;

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
          <Field label="Nombre común" value={getSpeciesDisplayName(bird.especie)} />
          <Field label="Especie" value={speciesCatalog?.nombre_especie} />
          <Field label="Sexo" value={bird.sexo} />
          <Field label="Anilla" value={bird.anilla} />
          <Field label="Microchip" value={bird.microchip} />
          <Field label="Nº CITES" value={bird.numero_cites} />
          <Field label="ID MITECO" value={bird.id_miteco} />
          <Field label="Zona" value={bird.zona} />
          <Field label="Nacimiento" value={format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")} />
          {bird.fecha_cesion && <Field label="Cesión" value={format(new Date(bird.fecha_cesion), "dd-MM-yyyy")} />}
          {bird.fecha_muerte && <Field label="Fallecimiento" value={format(new Date(bird.fecha_muerte), "dd-MM-yyyy")} />}
          {buyer && <Field label="Comprador" value={`${buyer.nombre} ${buyer.apellidos}`} />}
          {bird.comprador_texto && <Field label="Comprador (texto)" value={bird.comprador_texto} />}
          {bird.padre_externo && <Field label="Padre externo" value={bird.padre_externo} />}
          {bird.madre_externa && <Field label="Madre externa" value={bird.madre_externa} />}
        </div>
        {bird.comentarios && (
          <div>
            <span className="text-xs text-muted-foreground">Comentarios</span>
            <p className="text-sm whitespace-pre-wrap">{bird.comentarios}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
