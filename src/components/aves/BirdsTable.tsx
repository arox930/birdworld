import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FileText, Download, FileEdit, Paperclip, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Bird } from "@/hooks/useBirds";
import { Badge } from "@/components/ui/badge";
import { getSpeciesDisplayName } from "@/lib/speciesNames";

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

function getEstado(bird: Bird) {
  if (bird.fecha_muerte) return <Badge variant="destructive">Muerto</Badge>;
  if (bird.fecha_cesion) return <Badge variant="secondary">Cedido</Badge>;
  return <Badge className="bg-accent text-accent-foreground">Vivo</Badge>;
}

export function BirdsTable({ birds, onView, onEdit, onDelete, onCession, onEditCession, onDownloadCession, onAttachments }: Props) {
  if (birds.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No se encontraron ejemplares
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre común</TableHead>
            <TableHead>Especie</TableHead>
            <TableHead>Sexo</TableHead>
            <TableHead className="hidden sm:table-cell">Anilla</TableHead>
            <TableHead className="hidden md:table-cell">Microchip</TableHead>
            <TableHead className="hidden lg:table-cell">Nacimiento</TableHead>
            <TableHead>Estado</TableHead>
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
                        <Eye className="mr-2 h-4 w-4" /> Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(bird)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAttachments(bird)}>
                        <Paperclip className="mr-2 h-4 w-4" /> Adjuntos
                      </DropdownMenuItem>
                      {bird.fecha_muerte ? null : bird.fecha_cesion ? (
                        <>
                          <DropdownMenuItem onClick={() => onEditCession(bird)}>
                            <FileEdit className="mr-2 h-4 w-4" /> Modificar Cesión
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownloadCession(bird)}>
                            <Download className="mr-2 h-4 w-4" /> Descargar Cesión
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => onCession(bird)}>
                          <FileText className="mr-2 h-4 w-4" /> Documento de Cesión
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(bird)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
