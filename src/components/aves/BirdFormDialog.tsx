import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Constants } from "@/integrations/supabase/types";
import type { Bird, BirdInsert } from "@/hooks/useBirds";
import { useEffect, useState } from "react";
import { useBirdSpeciesCatalog } from "@/hooks/useBirdSpeciesCatalog";
import { ZonaCombobox } from "@/components/shared/ZonaCombobox";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { BirdParejaSearch } from "./BirdParejaSearch";
import { ParentPairSearch } from "./ParentPairSearch";
import { useTranslation } from "react-i18next";

const SEXES = Constants.public.Enums.animal_sex;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bird?: Bird | null;
  onSubmit: (data: BirdInsert) => void;
  isLoading?: boolean;
  prefillData?: Record<string, string> | null;
  commonNames?: string[];
};

export function BirdFormDialog({ open, onOpenChange, bird, onSubmit, isLoading, prefillData, commonNames = [] }: Props) {
  const { t } = useTranslation();
  const [internalParents, setInternalParents] = useState(false);
  const [parentPairLabel, setParentPairLabel] = useState<string | null>(null);

  const birdSchema = z.object({
    especie: z.string().min(1, t("birds.selectCommonName")),
    especie_id: z.string().min(1, t("birds.selectSpecies")),
    sexo: z.enum(SEXES as unknown as [string, ...string[]]),
    fecha_nacimiento: z.string().min(1),
    id_miteco: z.string().max(100).optional().or(z.literal("")),
    microchip: z.string().max(100).optional().or(z.literal("")),
    anilla: z.string().max(100).optional().or(z.literal("")),
    numero_cites: z.string().max(100).optional().or(z.literal("")),
    zona: z.string().max(200).optional().or(z.literal("")),
    padre_externo: z.string().max(200).optional().or(z.literal("")),
    madre_externa: z.string().max(200).optional().or(z.literal("")),
    padre_id: z.string().optional().or(z.literal("")),
    madre_id: z.string().optional().or(z.literal("")),
    comentarios: z.string().max(2000).optional().or(z.literal("")),
    fecha_muerte: z.string().optional().or(z.literal("")),
    pareja_id: z.string().optional().or(z.literal("")),
  });

  type BirdFormValues = z.infer<typeof birdSchema>;

  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdSchema),
    defaultValues: {
      especie: bird?.especie ?? (commonNames[0] || ""),
      especie_id: (bird as any)?.especie_id ?? "",
      sexo: bird?.sexo ?? "Desconocido",
      fecha_nacimiento: bird?.fecha_nacimiento ?? "",
      id_miteco: bird?.id_miteco ?? "",
      microchip: bird?.microchip ?? "",
      anilla: bird?.anilla ?? "",
      numero_cites: bird?.numero_cites ?? "",
      zona: bird?.zona ?? "",
      padre_externo: bird?.padre_externo ?? "",
      madre_externa: bird?.madre_externa ?? "",
      padre_id: bird?.padre_id ?? "",
      madre_id: bird?.madre_id ?? "",
      comentarios: bird?.comentarios ?? "",
      fecha_muerte: bird?.fecha_muerte ?? "",
      pareja_id: bird?.pareja_id ?? "",
    },
  });

  const selectedCommonName = form.watch("especie");
  const { data: speciesList } = useBirdSpeciesCatalog(selectedCommonName);
  const [pendingSpeciesMatch, setPendingSpeciesMatch] = useState<string | null>(null);

  useEffect(() => {
    if (pendingSpeciesMatch && speciesList && speciesList.length > 0) {
      const normalise = (s: string) => s.toLowerCase().trim();
      const match = speciesList.find(s => normalise(s.nombre_especie) === normalise(pendingSpeciesMatch));
      if (match) {
        form.setValue("especie_id", match.id);
      }
      setPendingSpeciesMatch(null);
    }
  }, [pendingSpeciesMatch, speciesList]);

  useEffect(() => {
    if (open) {
      const pf = prefillData ?? {};
      const commonName = (pf.nombre_comun as any) ?? (pf.especie as any) ?? bird?.especie ?? (commonNames[0] || "");
      const hasPadreId = bird?.padre_id;
      const hasMadreId = bird?.madre_id;
      setInternalParents(!!(hasPadreId || hasMadreId));
      setParentPairLabel(null);

      form.reset({
        especie: commonName,
        especie_id: (pf.especie_id as any) ?? (bird as any)?.especie_id ?? "",
        sexo: (pf.sexo as any) ?? bird?.sexo ?? "Desconocido",
        fecha_nacimiento: pf.fecha_nacimiento ?? bird?.fecha_nacimiento ?? "",
        id_miteco: pf.id_miteco ?? bird?.id_miteco ?? "",
        microchip: pf.microchip ?? bird?.microchip ?? "",
        anilla: pf.anilla ?? bird?.anilla ?? "",
        numero_cites: pf.numero_cites ?? bird?.numero_cites ?? "",
        zona: bird?.zona ?? "",
        padre_externo: pf.padre_externo ?? bird?.padre_externo ?? "",
        madre_externa: pf.madre_externa ?? bird?.madre_externa ?? "",
        padre_id: bird?.padre_id ?? "",
        madre_id: bird?.madre_id ?? "",
        comentarios: bird?.comentarios ?? "",
        fecha_muerte: bird?.fecha_muerte ?? "",
        pareja_id: bird?.pareja_id ?? "",
      });
      if (pf.especie && !pf.especie_id) {
        setPendingSpeciesMatch(pf.especie);
      } else {
        setPendingSpeciesMatch(null);
      }
    }
  }, [open, bird, prefillData]);

  useEffect(() => {
    const currentSpeciesId = form.getValues("especie_id");
    if (speciesList && currentSpeciesId) {
      const stillValid = speciesList.some(s => s.id === currentSpeciesId);
      if (!stillValid) {
        form.setValue("especie_id", "");
      }
    }
  }, [selectedCommonName, speciesList]);

  const handleSubmit = (values: BirdFormValues) => {
    const cleaned: BirdInsert = {
      especie: values.especie as BirdInsert["especie"],
      especie_id: values.especie_id,
      sexo: values.sexo as BirdInsert["sexo"],
      fecha_nacimiento: values.fecha_nacimiento,
      id_miteco: values.id_miteco || null,
      microchip: values.microchip || null,
      anilla: values.anilla || null,
      numero_cites: values.numero_cites || null,
      zona: values.zona || null,
      padre_externo: internalParents ? null : (values.padre_externo || null),
      madre_externa: internalParents ? null : (values.madre_externa || null),
      padre_id: internalParents ? (values.padre_id || null) : null,
      madre_id: internalParents ? (values.madre_id || null) : null,
      comentarios: values.comentarios || null,
      fecha_muerte: values.fecha_muerte || null,
      pareja_id: values.pareja_id || null,
    };
    onSubmit(cleaned);
  };

  const handlePairSelect = (
    male: { id: string; anilla: string | null; microchip: string | null },
    female: { id: string; anilla: string | null; microchip: string | null }
  ) => {
    form.setValue("padre_id", male.id);
    form.setValue("madre_id", female.id);
    const mLabel = male.anilla || male.microchip || "s/id";
    const fLabel = female.anilla || female.microchip || "s/id";
    setParentPairLabel(`♂ ${mLabel} — ♀ ${fLabel}`);
  };

  const handlePairClear = () => {
    form.setValue("padre_id", "");
    form.setValue("madre_id", "");
    setParentPairLabel(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bird ? t("birds.editSpecimen") : t("birds.addSpecimen")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="especie" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.commonName")} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("birds.selectCommonName")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {commonNames.map(s => <SelectItem key={s} value={s}>{getSpeciesDisplayName(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="especie_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.speciesLabel")} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("birds.selectSpecies")} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {speciesList && speciesList.length > 0 ? (
                        speciesList.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre_especie}</SelectItem>)
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          {t("birds.noSpeciesForName")}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sexo" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.sex")} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SEXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.birthDate")} *</FormLabel>
                  <FormControl><Input type="date" min="2000-01-01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fecha_muerte" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.deathDate")}</FormLabel>
                  <FormControl><Input type="date" min="2000-01-01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="id_miteco" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.mitecoId")}</FormLabel>
                  <FormControl><Input placeholder={t("common.optional")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="microchip" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.microchip")}</FormLabel>
                  <FormControl><Input placeholder={t("common.optional")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="anilla" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.ring")}</FormLabel>
                  <FormControl><Input placeholder={t("common.optional")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numero_cites" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.citesNumber")}</FormLabel>
                  <FormControl><Input placeholder={t("common.optional")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="zona" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("birds.zone")}</FormLabel>
                  <ZonaCombobox value={field.value ?? ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Parents section with toggle */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("birds.parents")}</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="parent-toggle" className="text-xs text-muted-foreground">
                    {internalParents ? t("birds.internalParents") : t("birds.externalParents")}
                  </Label>
                  <Switch
                    id="parent-toggle"
                    checked={internalParents}
                    onCheckedChange={(checked) => {
                      setInternalParents(checked);
                      if (checked) {
                        form.setValue("padre_externo", "");
                        form.setValue("madre_externa", "");
                      } else {
                        form.setValue("padre_id", "");
                        form.setValue("madre_id", "");
                        setParentPairLabel(null);
                      }
                    }}
                  />
                </div>
              </div>

              {internalParents ? (
                <div className="space-y-2">
                  <ParentPairSearch
                    especie={selectedCommonName}
                    onSelect={handlePairSelect}
                    onClear={handlePairClear}
                    selectedLabel={parentPairLabel}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="padre_externo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("birds.externalFather")}</FormLabel>
                      <FormControl><Input placeholder={t("birds.freeTextExternal")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="madre_externa" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("birds.externalMother")}</FormLabel>
                      <FormControl><Input placeholder={t("birds.freeTextExternalFem")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            <FormField control={form.control} name="pareja_id" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("birds.partner")}</FormLabel>
                <FormControl>
                  <BirdParejaSearch
                    nombreComun={selectedCommonName}
                    value={field.value || null}
                    onChange={(id) => field.onChange(id ?? "")}
                    excludeId={bird?.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="comentarios" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("birds.comments")}</FormLabel>
                <FormControl><Textarea placeholder={t("birds.observations")} rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{bird ? t("birds.saveChanges") : t("birds.addSpecimen")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
