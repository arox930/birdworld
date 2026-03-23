import { useState } from "react";
import { useBuyers, useCreateBuyer, type Buyer } from "@/hooks/useCessions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Pencil, Trash2, Search, Users, ChevronDown, ChevronRight, Bird, Dog } from "lucide-react";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { format } from "date-fns";

type AnimalInfo = {
  id: string;
  type: "bird" | "dog";
  label: string;
  fecha_cesion: string;
  precio: number;
  // Bird fields
  anilla?: string | null;
  microchip?: string | null;
  numero_cites?: string | null;
  id_miteco?: string | null;
  sexo?: string;
  especie_nombre?: string | null;
  // Dog fields
  nombre?: string | null;
  raza?: string | null;
  color?: string | null;
  pedigree?: string | null;
  comentarios?: string | null;
};

function useBuyerAnimals() {
  return useQuery({
    queryKey: ["buyer-animals"],
    queryFn: async () => {
      const { data: cessions, error } = await supabase
        .from("cessions")
        .select("buyer_id, animal_id, animal_type, precio, fecha_cesion");
      if (error) throw error;

      const birdIds = cessions.filter(c => c.animal_type === "bird").map(c => c.animal_id);
      const dogIds = cessions.filter(c => c.animal_type === "dog").map(c => c.animal_id);

      const [birdsRes, dogsRes] = await Promise.all([
        birdIds.length > 0
          ? supabase.from("birds").select("id, especie, anilla, microchip, numero_cites, id_miteco, sexo, comentarios, especie_id, species_catalog:especie_id(nombre_especie)").in("id", birdIds)
          : { data: [] },
        dogIds.length > 0
          ? supabase.from("dogs").select("id, nombre, raza, color, sexo, microchip, pedigree, comentarios").in("id", dogIds)
          : { data: [] },
      ]);

      const birdsMap = new Map((birdsRes.data ?? []).map(b => [b.id, b]));
      const dogsMap = new Map((dogsRes.data ?? []).map(d => [d.id, d]));

      const result: Record<string, AnimalInfo[]> = {};
      for (const c of cessions) {
        if (!result[c.buyer_id]) result[c.buyer_id] = [];
        if (c.animal_type === "bird") {
          const bird = birdsMap.get(c.animal_id);
          result[c.buyer_id].push({
            id: c.animal_id,
            type: "bird",
            label: bird ? getSpeciesDisplayName(bird.especie as any) : "Ave",
            fecha_cesion: c.fecha_cesion,
            precio: c.precio,
            anilla: bird?.anilla,
            microchip: bird?.microchip,
            numero_cites: bird?.numero_cites,
            id_miteco: bird?.id_miteco,
            sexo: bird?.sexo,
            especie_nombre: (bird as any)?.species_catalog?.nombre_especie,
            comentarios: bird?.comentarios,
          });
        } else {
          const dog = dogsMap.get(c.animal_id);
          result[c.buyer_id].push({
            id: c.animal_id,
            type: "dog",
            label: dog?.nombre || "Perro",
            fecha_cesion: c.fecha_cesion,
            precio: c.precio,
            nombre: dog?.nombre,
            raza: dog?.raza,
            color: dog?.color,
            sexo: dog?.sexo,
            microchip: dog?.microchip,
            pedigree: dog?.pedigree,
            comentarios: dog?.comentarios,
          });
        }
      }
      return result;
    },
  });
}

export default function Compradores() {
  const { data: buyers = [], isLoading } = useBuyers();
  const { data: buyerAnimals = {} } = useBuyerAnimals();
  const createBuyer = useCreateBuyer();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleRecurrente = async (b: Buyer) => {
    try {
      const { error } = await supabase
        .from("buyers")
        .update({ recurrente: !b.recurrente } as any)
        .eq("id", b.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["buyers"] });
      toast.success(b.recurrente ? "Comprador desmarcado como recurrente" : "Comprador marcado como recurrente");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const filtered = buyers.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.nombre.toLowerCase().includes(q) ||
      b.apellidos.toLowerCase().includes(q) ||
      b.dni.toLowerCase().includes(q) ||
      b.domicilio.toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setEditingBuyer(null);
    setNombre("");
    setApellidos("");
    setDni("");
    setDomicilio("");
    setDialogOpen(true);
  };

  const openEdit = (b: Buyer) => {
    setEditingBuyer(b);
    setNombre(b.nombre);
    setApellidos(b.apellidos);
    setDni(b.dni);
    setDomicilio(b.domicilio);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nombre || !apellidos || !dni || !domicilio) return;
    setSaving(true);
    try {
      if (editingBuyer) {
        const { error } = await supabase
          .from("buyers")
          .update({ nombre, apellidos, dni, domicilio })
          .eq("id", editingBuyer.id);
        if (error) throw error;
        toast.success("Comprador actualizado");
      } else {
        await createBuyer.mutateAsync({ nombre, apellidos, dni, domicilio });
        toast.success("Comprador creado");
      }
      qc.invalidateQueries({ queryKey: ["buyers"] });
      setDialogOpen(false);
    } catch {
      toast.error("Error al guardar comprador");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("buyers").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Comprador eliminado");
      qc.invalidateQueries({ queryKey: ["buyers"] });
    } catch {
      toast.error("No se pudo eliminar. Puede tener cesiones asociadas.");
    }
    setDeleteId(null);
  };

  const canSave = !!nombre && !!apellidos && !!dni && !!domicilio;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Compradores
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {buyers.length} comprador{buyers.length !== 1 ? "es" : ""} registrado{buyers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo comprador
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellidos</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead className="hidden md:table-cell">Domicilio</TableHead>
              <TableHead className="text-center">Ejemplares</TableHead>
              <TableHead className="w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? "Sin resultados" : "No hay compradores registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => {
                const animals = buyerAnimals[b.id] ?? [];
                const isExpanded = expandedBuyer === b.id;
                return (
                  <>
                    <TableRow key={b.id} className={animals.length > 0 ? "cursor-pointer" : ""} onClick={() => animals.length > 0 && setExpandedBuyer(isExpanded ? null : b.id)}>
                      <TableCell className="px-2">
                        {animals.length > 0 && (
                          isExpanded
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {b.nombre}
                        {b.recurrente && <Badge variant="secondary" className="ml-2 text-[10px]">Recurrente</Badge>}
                      </TableCell>
                      <TableCell>{b.apellidos}</TableCell>
                      <TableCell className="font-mono text-sm">{b.dni}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{b.domicilio}</TableCell>
                      <TableCell className="text-center">
                        {animals.length > 0 ? (
                          <Badge variant="outline">{animals.length}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant={b.recurrente ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8 text-xs font-bold"
                            title={b.recurrente ? "Quitar recurrente" : "Marcar como recurrente"}
                            onClick={() => toggleRecurrente(b)}
                          >
                            R
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(b.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && animals.length > 0 && (
                      <TableRow key={`${b.id}-animals`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-0">
                          <div className="px-6 py-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Ejemplares adquiridos:</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {animals.map((a) => (
                                <div key={a.id} className="rounded-md border border-border bg-card p-3 text-sm space-y-2">
                                  <div className="flex items-center gap-2">
                                    {a.type === "bird" ? (
                                      <Bird className="h-4 w-4 text-primary shrink-0" />
                                    ) : (
                                      <Dog className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                    <span className="font-medium">{a.label}</span>
                                    <Badge variant="outline" className="ml-auto text-[10px]">{a.precio.toFixed(2)} €</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    {a.type === "bird" ? (
                                      <>
                                        {a.especie_nombre && <div><span className="text-muted-foreground">Especie:</span> <span className="italic">{a.especie_nombre}</span></div>}
                                        <div><span className="text-muted-foreground">Sexo:</span> {a.sexo || "—"}</div>
                                        {a.anilla && <div><span className="text-muted-foreground">Anilla:</span> {a.anilla}</div>}
                                        {a.microchip && <div><span className="text-muted-foreground">Microchip:</span> {a.microchip}</div>}
                                        {a.numero_cites && <div><span className="text-muted-foreground">CITES:</span> {a.numero_cites}</div>}
                                        {a.id_miteco && <div><span className="text-muted-foreground">MITECO:</span> {a.id_miteco}</div>}
                                      </>
                                    ) : (
                                      <>
                                        {a.raza && <div><span className="text-muted-foreground">Raza:</span> {a.raza}</div>}
                                        <div><span className="text-muted-foreground">Sexo:</span> {a.sexo || "—"}</div>
                                        {a.color && <div><span className="text-muted-foreground">Color:</span> {a.color}</div>}
                                        {a.microchip && <div><span className="text-muted-foreground">Microchip:</span> {a.microchip}</div>}
                                        {a.pedigree && <div><span className="text-muted-foreground">Pedigree:</span> {a.pedigree}</div>}
                                      </>
                                    )}
                                    <div><span className="text-muted-foreground">Cesión:</span> {format(new Date(a.fecha_cesion + "T00:00:00"), "dd-MM-yyyy")}</div>
                                  </div>
                                  {a.comentarios && (
                                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                      <span className="font-medium">Comentarios:</span> {a.comentarios}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBuyer ? "Editar comprador" : "Nuevo comprador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan" />
              </div>
              <div>
                <Label>Apellidos</Label>
                <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="García López" />
              </div>
            </div>
            <div>
              <Label>DNI</Label>
              <Input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678A" />
            </div>
            <div>
              <Label>Domicilio</Label>
              <Input value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="C/ Ejemplo 1, Madrid" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? "Guardando..." : editingBuyer ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar comprador?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer. Si tiene cesiones asociadas, no se podrá eliminar.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
