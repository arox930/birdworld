import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, ChevronLeft, ChevronRight, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useVaccinationReminders,
  useCreateReminder,
  useCompleteReminder,
  useDeleteReminder,
} from "@/hooks/useVaccinationReminders";
import { useDogs } from "@/hooks/useDogs";

export default function CalendarioVacunacion() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDogId, setFormDogId] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [dogSearchOpen, setDogSearchOpen] = useState(false);
  const [dogSearch, setDogSearch] = useState("");

  const { data: reminders = [], isLoading } = useVaccinationReminders(year, month);
  const { data: dogsData } = useDogs({ pageSize: 500 });
  const dogs = dogsData?.data ?? [];
  const aliveDogs = dogs.filter((d) => !d.fecha_muerte && !d.fecha_cesion);

  const createReminder = useCreateReminder();
  const completeReminder = useCompleteReminder();
  const deleteReminder = useDeleteReminder();

  const pending = reminders.filter((r) => !r.completado);
  const completed = reminders.filter((r) => r.completado);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy", { locale: es });

  const handleAdd = () => {
    if (!formDogId || !formFecha || !formDesc) return;
    createReminder.mutate(
      { dog_id: formDogId, fecha: formFecha, descripcion: formDesc },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormDogId("");
          setFormFecha("");
          setFormDesc("");
        },
      }
    );
  };

  const openDialog = () => {
    const defaultDate = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(now.getDate(), 28)).padStart(2, "0")}`;
    setFormFecha(defaultDate);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendario de vacunación</h1>
        </div>
        <Button onClick={openDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir recordatorio
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold capitalize w-48 text-center text-foreground">{monthLabel}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Pending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Pendientes
            {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!isLoading && pending.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay vacunaciones pendientes este mes.</p>
          )}
          {pending.map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded-lg p-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{r.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                   {r.dogs?.nombre} ({r.dogs?.raza}) — {format(new Date(r.fecha + "T00:00:00"), "dd-MM-yyyy")}
                 </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => completeReminder.mutate({ id: r.id, dog_id: r.dog_id, fecha: new Date().toISOString().split("T")[0], descripcion: r.descripcion })}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => deleteReminder.mutate(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Completed */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Completadas
              <Badge variant="secondary">{completed.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((r) => (
              <div key={r.id} className="flex items-center border rounded-lg p-3 gap-3 opacity-60">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground line-through truncate">{r.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.dogs?.nombre} ({r.dogs?.raza}) — {format(new Date(r.fecha + "T00:00:00"), "dd-MM-yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo recordatorio de vacunación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Perro</Label>
              <Popover open={dogSearchOpen} onOpenChange={setDogSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {formDogId
                      ? (() => { const d = aliveDogs.find(x => x.id === formDogId); return d ? `${d.nombre} — ${d.raza} ${d.microchip ? `(${d.microchip})` : ""}` : "Selecciona un perro"; })()
                      : "Buscar perro…"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Buscar por nombre, microchip, raza…" value={dogSearch} onValueChange={setDogSearch} />
                    <CommandList>
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {aliveDogs
                          .filter(d => {
                            if (!dogSearch) return true;
                            const q = dogSearch.toLowerCase();
                            return (d.nombre?.toLowerCase().includes(q) || d.raza?.toLowerCase().includes(q) || d.microchip?.toLowerCase().includes(q) || d.color?.toLowerCase().includes(q));
                          })
                          .slice(0, 20)
                          .map(d => (
                            <CommandItem key={d.id} value={d.id} onSelect={() => { setFormDogId(d.id); setDogSearchOpen(false); setDogSearch(""); }}>
                              <span className="font-medium">{d.nombre}</span>
                              <span className="text-muted-foreground ml-2 text-xs">{d.raza} {d.microchip ? `· ${d.microchip}` : ""}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Ej: Rabia, Moquillo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!formDogId || !formFecha || !formDesc || createReminder.isPending}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
