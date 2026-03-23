import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Constants } from "@/integrations/supabase/types";
import type { Dog, DogInsert } from "@/hooks/useDogs";
import { useEffect } from "react";
import { ZonaCombobox } from "@/components/shared/ZonaCombobox";

const SEXES = Constants.public.Enums.animal_sex;

const dogSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido").max(100),
  raza: z.string().trim().min(1, "Requerido").max(100),
  color: z.string().trim().min(1, "Requerido").max(100),
  sexo: z.enum(SEXES as unknown as [string, ...string[]]),
  fecha_nacimiento: z.string().min(1, "Requerido"),
  microchip: z.string().max(100).optional().or(z.literal("")),
  pedigree: z.string().max(200).optional().or(z.literal("")),
  zona: z.string().max(200).optional().or(z.literal("")),
  madre_externa: z.string().max(200).optional().or(z.literal("")),
  comentarios: z.string().max(2000).optional().or(z.literal("")),
  fecha_muerte: z.string().optional().or(z.literal("")),
});

type DogFormValues = z.infer<typeof dogSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog?: Dog | null;
  onSubmit: (data: DogInsert) => void;
  isLoading?: boolean;
  prefillData?: Record<string, string> | null;
};

export function DogFormDialog({ open, onOpenChange, dog, onSubmit, isLoading, prefillData }: Props) {
  const form = useForm<DogFormValues>({
    resolver: zodResolver(dogSchema),
    defaultValues: getDefaults(dog),
  });

  useEffect(() => {
    if (open) {
      const pf = prefillData ?? {};
      form.reset(getDefaults(dog, pf));
    }
  }, [open, dog, prefillData]);

  const handleSubmit = (values: DogFormValues) => {
    const cleaned: DogInsert = {
      nombre: values.nombre,
      raza: values.raza,
      color: values.color,
      sexo: values.sexo as DogInsert["sexo"],
      fecha_nacimiento: values.fecha_nacimiento,
      microchip: values.microchip || null,
      pedigree: values.pedigree || null,
      zona: values.zona || null,
      madre_externa: values.madre_externa || null,
      comentarios: values.comentarios || null,
      fecha_muerte: values.fecha_muerte || null,
    };
    onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dog ? "Editar perro" : "Añadir perro"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem><FormLabel>Nombre *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="raza" render={({ field }) => (
                <FormItem><FormLabel>Raza *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="sexo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{SEXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
                <FormItem><FormLabel>Fecha Nacimiento *</FormLabel><FormControl><Input type="date" min="2000-01-01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="fecha_muerte" render={({ field }) => (
                <FormItem><FormLabel>Fecha Muerte</FormLabel><FormControl><Input type="date" min="2000-01-01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="microchip" render={({ field }) => (
                <FormItem><FormLabel>Microchip</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pedigree" render={({ field }) => (
                <FormItem><FormLabel>Pedigree</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="zona" render={({ field }) => (
                <FormItem><FormLabel>Zona</FormLabel><ZonaCombobox value={field.value ?? ""} onChange={field.onChange} /><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="madre_externa" render={({ field }) => (
                <FormItem><FormLabel>Madre (externa)</FormLabel><FormControl><Input placeholder="Texto libre si es externa" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="comentarios" render={({ field }) => (
              <FormItem><FormLabel>Comentarios</FormLabel><FormControl><Textarea placeholder="Observaciones..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{dog ? "Guardar cambios" : "Añadir perro"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaults(dog?: Dog | null, pf: Record<string, string> = {}): DogFormValues {
  return {
    nombre: pf.nombre ?? dog?.nombre ?? "",
    raza: pf.raza ?? dog?.raza ?? "",
    color: pf.color ?? dog?.color ?? "",
    sexo: (pf.sexo as any) ?? dog?.sexo ?? "Desconocido",
    fecha_nacimiento: pf.fecha_nacimiento ?? dog?.fecha_nacimiento ?? "",
    microchip: pf.microchip ?? dog?.microchip ?? "",
    pedigree: pf.pedigree ?? dog?.pedigree ?? "",
    zona: pf.zona ?? dog?.zona ?? "",
    madre_externa: pf.madre_externa ?? dog?.madre_externa ?? "",
    comentarios: dog?.comentarios ?? "",
    fecha_muerte: dog?.fecha_muerte ?? "",
  };
}
