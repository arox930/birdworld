import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FileText, Syringe, Baby, Download, FileEdit, Paperclip, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Dog } from "@/hooks/useDogs";
import { Badge } from "@/components/ui/badge";

type Props = {
  dogs: Dog[];
  onView: (dog: Dog) => void;
  onEdit: (dog: Dog) => void;
  onDelete: (dog: Dog) => void;
  onCession: (dog: Dog) => void;
  onEditCession: (dog: Dog) => void;
  onDownloadCession: (dog: Dog) => void;
  onVaccines: (dog: Dog) => void;
  onLitters: (dog: Dog) => void;
  onAttachments: (dog: Dog) => void;
  onAddToLitter?: (dog: Dog) => void;
};

function getEstado(dog: Dog) {
  if (dog.fecha_muerte) return <Badge variant="destructive">Muerto</Badge>;
  if (dog.fecha_cesion) return <Badge variant="secondary">Cedido</Badge>;
  return <Badge className="bg-accent text-accent-foreground">Vivo</Badge>;
}

export function DogsTable({ dogs, onView, onEdit, onDelete, onCession, onEditCession, onDownloadCession, onVaccines, onLitters, onAttachments, onAddToLitter }: Props) {
  if (dogs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No se encontraron perros
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Raza</TableHead>
            <TableHead className="hidden sm:table-cell">Sexo</TableHead>
            <TableHead className="hidden md:table-cell">Color</TableHead>
            <TableHead className="hidden lg:table-cell">Nacimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dogs.map((dog) => (
            <TableRow key={dog.id}>
              <TableCell className="font-medium">{dog.nombre}</TableCell>
              <TableCell>{dog.raza}</TableCell>
              <TableCell className="hidden sm:table-cell">{dog.sexo}</TableCell>
              <TableCell className="hidden md:table-cell">{dog.color}</TableCell>
              <TableCell className="hidden lg:table-cell">{format(new Date(dog.fecha_nacimiento), "dd-MM-yyyy")}</TableCell>
              <TableCell>{getEstado(dog)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(dog)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(dog)}>
                      <Pencil className="mr-2 h-4 w-4" /> Modificar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAttachments(dog)}>
                      <Paperclip className="mr-2 h-4 w-4" /> Adjuntos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onVaccines(dog)}>
                      <Syringe className="mr-2 h-4 w-4" /> Vacunación
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLitters(dog)}>
                      <Baby className="mr-2 h-4 w-4" /> Camadas
                    </DropdownMenuItem>
                    {dog.nombre.toLowerCase().includes("cachorro") && onAddToLitter && (
                      <DropdownMenuItem onClick={() => onAddToLitter(dog)}>
                        <Baby className="mr-2 h-4 w-4" /> Añadir a camada
                      </DropdownMenuItem>
                    )}
                    {dog.fecha_muerte ? null : dog.fecha_cesion ? (
                      <>
                        <DropdownMenuItem onClick={() => onEditCession(dog)}>
                          <FileEdit className="mr-2 h-4 w-4" /> Modificar Cesión
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadCession(dog)}>
                          <Download className="mr-2 h-4 w-4" /> Descargar Cesión
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => onCession(dog)}>
                        <FileText className="mr-2 h-4 w-4" /> Documento de Cesión
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(dog)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
