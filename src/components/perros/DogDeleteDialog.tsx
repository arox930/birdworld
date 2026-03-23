import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Dog } from "@/hooks/useDogs";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog | null;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function DogDeleteDialog({ open, onOpenChange, dog, onConfirm, isLoading }: Props) {
  if (!dog) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este perro?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>Esta acción no se puede deshacer. Se eliminará definitivamente:</p>
              <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1">
                <p><span className="font-medium">Nombre:</span> {dog.nombre}</p>
                <p><span className="font-medium">Raza:</span> {dog.raza}</p>
                <p><span className="font-medium">Sexo:</span> {dog.sexo}</p>
                {dog.microchip && <p><span className="font-medium">Microchip:</span> {dog.microchip}</p>}
                <p><span className="font-medium">Nacimiento:</span> {format(new Date(dog.fecha_nacimiento), "dd-MM-yyyy")}</p>
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
