import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Bird } from "@/hooks/useBirds";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bird: Bird | null;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function BirdDeleteDialog({ open, onOpenChange, bird, onConfirm, isLoading }: Props) {
  const { t } = useTranslation();
  if (!bird) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("birds.deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>{t("birds.deleteConfirmDesc")}</p>
              <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1">
                <p><span className="font-medium">{t("birds.speciesLabel")}:</span> {bird.especie}</p>
                <p><span className="font-medium">{t("birds.sex")}:</span> {bird.sexo}</p>
                {bird.anilla && <p><span className="font-medium">{t("birds.ring")}:</span> {bird.anilla}</p>}
                {bird.microchip && <p><span className="font-medium">{t("birds.microchip")}:</span> {bird.microchip}</p>}
                <p><span className="font-medium">{t("birds.birthDate")}:</span> {format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")}</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t("birds.deletePermanently")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
