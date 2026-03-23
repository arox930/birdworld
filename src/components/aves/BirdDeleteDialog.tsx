import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Bird } from "@/hooks/useBirds";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bird: Bird | null;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function BirdDeleteDialog({ open, onOpenChange, bird, onConfirm, isLoading }: Props) {
  if (!bird) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este ejemplar?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>Esta acción no se puede deshacer. Se eliminará definitivamente:</p>
              <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1">
                <p><span className="font-medium">Especie:</span> {bird.especie}</p>
                <p><span className="font-medium">Sexo:</span> {bird.sexo}</p>
                {bird.anilla && <p><span className="font-medium">Anilla:</span> {bird.anilla}</p>}
                {bird.microchip && <p><span className="font-medium">Microchip:</span> {bird.microchip}</p>}
                <p><span className="font-medium">Nacimiento:</span> {format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")}</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Eliminar definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
