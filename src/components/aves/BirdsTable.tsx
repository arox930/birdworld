import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FileText, Download, FileEdit, Paperclip, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Bird } from "@/hooks/useBirds";
import { Badge } from "@/components/ui/badge";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { useTranslation } from "react-i18next";

type Props = {
  birds: Bird[];
  onView: (bird: Bird) => void;
  onEdit: (bird: Bird) => void;
  onDelete: (bird: Bird) => void;
  onCession: (bird: Bird) => void;
  onEditCession: (bird: Bird) => void;
  onDownloadCession: (bird: Bird) => void;
  onAttachments: (bird: Bird) => void;
};

export function BirdsTable({ birds, onView, onEdit, onDelete, onCession, onEditCession, onDownloadCession, onAttachments }: Props) {
  const { t } = useTranslation();

  function getEstado(bird: Bird) {
    if (bird.fecha_muerte) return <Badge variant="destructive">{t("birds.dead")}</Badge>;
    if (bird.fecha_cesion) return <Badge variant="secondary">{t("birds.ceded")}</Badge>;
    return <Badge className="bg-accent text-accent-foreground">{t("birds.alive")}</Badge>;
  }

  if (birds.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        {t("birds.noSpecimensFound")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("birds.commonName")}</TableHead>
            <TableHead>{t("birds.speciesLabel")}</TableHead>
            <TableHead>{t("birds.sex")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("birds.ring")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("birds.microchip")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("birds.birthDate")}</TableHead>
            <TableHead>{t("birds.status")}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {birds.map((bird) => {
            const speciesCatalog = (bird as any).species_catalog;
            return (
              <TableRow key={bird.id}>
                <TableCell className="font-medium">{getSpeciesDisplayName(bird.especie)}</TableCell>
                <TableCell className="text-muted-foreground italic">
                  {speciesCatalog?.nombre_especie || "—"}
                </TableCell>
                <TableCell>{bird.sexo}</TableCell>
                <TableCell className="hidden sm:table-cell">{bird.anilla || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{bird.microchip || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(bird.fecha_nacimiento), "dd-MM-yyyy")}</TableCell>
                <TableCell>{getEstado(bird)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(bird)}>
                        <Eye className="mr-2 h-4 w-4" /> {t("common.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(bird)}>
                        <Pencil className="mr-2 h-4 w-4" /> {t("birds.modify")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAttachments(bird)}>
                        <Paperclip className="mr-2 h-4 w-4" /> {t("birds.attachments")}
                      </DropdownMenuItem>
                      {bird.fecha_muerte ? null : bird.fecha_cesion ? (
                        <>
                          <DropdownMenuItem onClick={() => onEditCession(bird)}>
                            <FileEdit className="mr-2 h-4 w-4" /> {t("birds.modifyCession")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownloadCession(bird)}>
                            <Download className="mr-2 h-4 w-4" /> {t("birds.downloadCession")}
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => onCession(bird)}>
                          <FileText className="mr-2 h-4 w-4" /> {t("birds.cessionDocument")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(bird)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
