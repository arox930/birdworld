import { useState } from "react";
import { Bird, Plus, MapPin, FolderPlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MapZone } from "@/hooks/useMapZones";
import type { MapFolder } from "@/hooks/useMapFolders";

interface AnimalOnMap {
  id: string;
  type: "bird" | "dog";
  label: string;
  zona: string | null;
}

interface Props {
  zones: MapZone[];
  folders: MapFolder[];
  unmappedZones: string[];
  unassigned: AnimalOnMap[];
  onAddUnmappedZone: (name: string) => void;
  onAnimalDragStart: (e: React.DragEvent, animal: { id: string; type: "bird" | "dog" }) => void;
  onNewZoneOpen: () => void;
  onNewFolderOpen: () => void;
}

export function MapSidebar({
  zones,
  folders,
  unmappedZones,
  unassigned,
  onAddUnmappedZone,
  onAnimalDragStart,
  onNewZoneOpen,
  onNewFolderOpen,
}: Props) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div className="flex flex-col items-center py-3 px-1 border-r border-border bg-card shrink-0">
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)} className="h-8 w-8">
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Panel de zonas
        </h2>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onNewFolderOpen}>
            <FolderPlus className="h-3 w-3 mr-1" /> Carpeta
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onNewZoneOpen}>
            <Plus className="h-3 w-3 mr-1" /> Zona
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}>
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {unmappedZones.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Zonas sin dibujar</h3>
            <div className="space-y-1">
              {unmappedZones.map((z) => (
                <div key={z} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{z}</span>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onAddUnmappedZone(z)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Sin zona asignada ({unassigned.length})
          </h3>
          <div className="space-y-1">
            {unassigned.map((a) => (
              <div
                key={`${a.type}-${a.id}`}
                draggable
                onDragStart={(e) => onAnimalDragStart(e, a)}
                className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
              >
                <Bird className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground">{a.label}</span>
              </div>
            ))}
            {unassigned.length === 0 && (
              <p className="text-xs text-muted-foreground">Todos los ejemplares tienen zona</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
