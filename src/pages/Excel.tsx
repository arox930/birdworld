import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const tables = [
  { key: "birds", label: "Aves" },
  { key: "dogs", label: "Perros" },
  { key: "buyers", label: "Compradores" },
  { key: "litters", label: "Camadas" },
  { key: "vaccines", label: "Vacunas" },
  { key: "vaccination_reminders", label: "Recordatorios vacunación" },
  { key: "expenses", label: "Gastos" },
  { key: "cessions", label: "Cesiones" },
  { key: "cession_templates", label: "Plantillas cesión" },
  { key: "bird_species_catalog", label: "Catálogo especies" },
  { key: "animal_attachments", label: "Archivos adjuntos" },
  { key: "map_folders", label: "Carpetas mapa" },
  { key: "map_zones", label: "Zonas mapa" },
] as const;

type TableKey = (typeof tables)[number]["key"];

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escape = (val: unknown) => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(","));
  return [headers.map(escape).join(","), ...rows].join("\n");
}

export default function Excel() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (tableKey: TableKey, label: string) => {
    setDownloading(tableKey);
    try {
      let allData: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase.from(tableKey) as any)
          .select("*")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        toast.info(`La tabla "${label}" está vacía`);
        setDownloading(null);
        return;
      }

      const csv = jsonToCsv(allData);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableKey}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${label}" descargado correctamente`);
    } catch (e: any) {
      toast.error(`Error al descargar: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exportar a CSV</h1>
        <p className="text-muted-foreground mt-1">Descarga cualquier tabla de la base de datos en formato CSV.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map(({ key, label }) => (
          <Card key={key} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3 font-mono">{key}</p>
              <Button
                size="sm"
                className="w-full"
                disabled={downloading === key}
                onClick={() => handleDownload(key, label)}
              >
                {downloading === key ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
