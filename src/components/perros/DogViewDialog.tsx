import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Dog } from "@/hooks/useDogs";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function DogViewDialog({ open, onOpenChange, dog }: Props) {
  if (!dog) return null;

  const estado = dog.fecha_muerte ? "Muerto" : dog.fecha_cesion ? "Cedido" : "Vivo";
  const buyer = (dog as any).buyers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dog.nombre}
            <Badge variant={dog.fecha_muerte ? "destructive" : dog.fecha_cesion ? "secondary" : "default"}>
              {estado}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Nombre" value={dog.nombre} />
          <Field label="Raza" value={dog.raza} />
          <Field label="Color" value={dog.color} />
          <Field label="Sexo" value={dog.sexo} />
          <Field label="Microchip" value={dog.microchip} />
          <Field label="Pedigree" value={dog.pedigree} />
          <Field label="Zona" value={dog.zona} />
          <Field label="Nacimiento" value={format(new Date(dog.fecha_nacimiento), "dd-MM-yyyy")} />
          {dog.fecha_cesion && <Field label="Cesión" value={format(new Date(dog.fecha_cesion), "dd-MM-yyyy")} />}
          {dog.fecha_muerte && <Field label="Fallecimiento" value={format(new Date(dog.fecha_muerte), "dd-MM-yyyy")} />}
          {dog.ultima_vacunacion && <Field label="Última vacunación" value={format(new Date(dog.ultima_vacunacion), "dd-MM-yyyy")} />}
          {buyer && <Field label="Comprador" value={`${buyer.nombre} ${buyer.apellidos}`} />}
          {dog.comprador_texto && <Field label="Comprador (texto)" value={dog.comprador_texto} />}
          {dog.madre_externa && <Field label="Madre externa" value={dog.madre_externa} />}
        </div>
        {dog.comentarios && (
          <div>
            <span className="text-xs text-muted-foreground">Comentarios</span>
            <p className="text-sm whitespace-pre-wrap">{dog.comentarios}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
