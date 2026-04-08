import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useMapZones,
  useCreateMapZone,
  useUpdateMapZone,
  useDeleteMapZone,
  useUnmappedZones,
  useAnimalsForMap,
  useUpdateAnimalZone,
  usePairBirds,
  type MapZone,
} from "@/hooks/useMapZones";
import {
  useMapFolders,
  useCreateMapFolder,
  useUpdateMapFolder,
  useDeleteMapFolder,
  useAssignZoneToFolder,
  type MapFolder,
} from "@/hooks/useMapFolders";
import { MapSidebar } from "@/components/mapa/MapSidebar";
import { MapZoneRect } from "@/components/mapa/MapZoneRect";
import { MapFolderRect } from "@/components/mapa/MapFolderRect";

const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const FOLDER_COLORS = ["#6366f1", "#14b8a6", "#f97316", "#e11d48", "#a855f7", "#0ea5e9"];

export default function Mapa() {
  const { data: zones = [], isLoading: zonesLoading } = useMapZones();
  const { data: folders = [] } = useMapFolders();
  const { data: unmappedZones = [] } = useUnmappedZones(zones);
  const { data: animals = [] } = useAnimalsForMap();
  const createZone = useCreateMapZone();
  const updateZone = useUpdateMapZone();
  const deleteZone = useDeleteMapZone();
  const updateAnimalZone = useUpdateAnimalZone();
  const createFolder = useCreateMapFolder();
  const updateFolder = useUpdateMapFolder();
  const deleteFolder = useDeleteMapFolder();
  const assignZoneToFolder = useAssignZoneToFolder();
  const pairBirds = usePairBirds();

  const [dragging, setDragging] = useState<{ type: "zone" | "folder"; id: string } | null>(null);
  const [resizing, setResizing] = useState<{ type: "zone" | "folder"; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newZoneOpen, setNewZoneOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [zOrder, setZOrder] = useState<string[]>([]);
  const bringToFront = (id: string) => setZOrder((prev) => [...prev.filter((z) => z !== id), id]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const unassigned = animals.filter((a) => !a.zona);
  const animalsInZone = (zoneName: string) => animals.filter((a) => a.zona === zoneName);
  const standaloneZones = zones.filter((z) => !z.folder_id);
  const zonesInFolder = (folderId: string) => zones.filter((z) => z.folder_id === folderId);

  // --- Drag/Resize for zones and folders ---
  const handleZoneMouseDown = (e: React.MouseEvent, zone: MapZone) => {
    if (resizing) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ type: "zone", id: zone.id });
    setDragOffset({ x: e.clientX - rect.left - zone.x, y: e.clientY - rect.top - zone.y });
    bringToFront(zone.id);
  };

  const handleFolderMouseDown = (e: React.MouseEvent, folder: MapFolder) => {
    if (resizing) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ type: "folder", id: folder.id });
    setDragOffset({ x: e.clientX - rect.left - folder.x, y: e.clientY - rect.top - folder.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ type: "zone", id: zoneId });
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleFolderResizeMouseDown = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ type: "folder", id: folderId });
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (dragging) {
        const el = document.getElementById(`${dragging.type === "zone" ? "zone" : "folder"}-${dragging.id}`);
        if (el) {
          el.style.left = `${Math.max(0, e.clientX - rect.left - dragOffset.x)}px`;
          el.style.top = `${Math.max(0, e.clientY - rect.top - dragOffset.y)}px`;
        }
      }

      if (resizing) {
        const item = resizing.type === "zone"
          ? zones.find((z) => z.id === resizing.id)
          : folders.find((f) => f.id === resizing.id);
        if (!item) return;
        const el = document.getElementById(`${resizing.type === "zone" ? "zone" : "folder"}-${resizing.id}`);
        if (el) {
          const dx = e.clientX - dragOffset.x;
          const dy = e.clientY - dragOffset.y;
          el.style.width = `${Math.max(120, item.width + dx)}px`;
          el.style.height = `${Math.max(80, item.height + dy)}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (dragging && rect) {
        const newX = Math.max(0, Math.round(e.clientX - rect.left - dragOffset.x));
        const newY = Math.max(0, Math.round(e.clientY - rect.top - dragOffset.y));
        
        if (dragging.type === "zone") {
          const zone = zones.find((z) => z.id === dragging.id);
          const zoneWidth = zone?.width || 160;
          const zoneHeight = zone?.height || 100;
          
          // Only allow assigning to folder if zone is NOT already in a folder
          // Zones inside folders can only be repositioned, not moved to other folders
          if (!zone?.folder_id) {
            // Use zone center point for folder detection
            const zoneCenterX = newX + zoneWidth / 2;
            const zoneCenterY = newY + zoneHeight / 2;
            
            // Check if zone center is inside any folder (collapsed or expanded)
            const droppedOnFolder = folders.find((f) => {
              return zoneCenterX >= f.x && zoneCenterX <= f.x + f.width && 
                     zoneCenterY >= f.y && zoneCenterY <= f.y + f.height;
            });
            
            // Assign to folder if dropped on one
            if (droppedOnFolder) {
              assignZoneToFolder.mutate(
                { zoneId: zone!.id, folderId: droppedOnFolder.id },
                { onSuccess: () => toast.success(`Zona movida a carpeta "${droppedOnFolder.nombre}"`) }
              );
            }
          }
          // NOTE: Zones inside folders stay in their folder - only "Sacar de carpeta" button removes them
          
          updateZone.mutate({ id: dragging.id, x: newX, y: newY });
        } else {
          updateFolder.mutate({ id: dragging.id, x: newX, y: newY });
        }
        setDragging(null);
      }

      if (resizing) {
        const item = resizing.type === "zone"
          ? zones.find((z) => z.id === resizing.id)
          : folders.find((f) => f.id === resizing.id);
        if (item) {
          const dx = e.clientX - dragOffset.x;
          const dy = e.clientY - dragOffset.y;
          const newW = Math.max(120, Math.round(item.width + dx));
          const newH = Math.max(80, Math.round(item.height + dy));
          if (resizing.type === "zone") {
            updateZone.mutate({ id: resizing.id, width: newW, height: newH });
          } else {
            updateFolder.mutate({ id: resizing.id, width: newW, height: newH });
          }
        }
        setResizing(null);
      }
    };

    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, resizing, dragOffset, zones, folders, updateZone, updateFolder]);

  // --- Animal drag & drop ---
  const handleAnimalDragStart = (e: React.DragEvent, animal: { id: string; type: "bird" | "dog" }) => {
    e.dataTransfer.setData("application/json", JSON.stringify(animal));
  };

  const handleZoneDrop = (e: React.DragEvent, zoneName: string) => {
    e.preventDefault();
    try {
      const animal = JSON.parse(e.dataTransfer.getData("application/json"));
      updateAnimalZone.mutate(
        { id: animal.id, type: animal.type, zona: zoneName },
        {
          onSuccess: () => {
            toast.success(`Ejemplar movido a ${zoneName}`);
            // Auto-unpair birds when moved to a different zone than their partner
            if (animal.type === "bird") {
              const bird = animals.find(a => a.id === animal.id);
              if (bird?.pareja_id) {
                const partner = animals.find(a => a.id === bird.pareja_id);
                if (partner && partner.zona !== zoneName) {
                  pairBirds.mutate(
                    { bird1Id: bird.id, bird2Id: bird.pareja_id, unpair: true },
                    { onSuccess: () => toast.info("Pareja deshecha al separar zonas") }
                  );
                }
              }
            }
          },
        }
      );
    } catch {}
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if it's an unplaced zone being dropped onto the canvas
    const zonePlaceData = e.dataTransfer.getData("application/zone-place");
    if (zonePlaceData) {
      try {
        const { id } = JSON.parse(zonePlaceData);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = Math.max(0, Math.round(e.clientX - rect.left - 80));
          const y = Math.max(0, Math.round(e.clientY - rect.top - 50));
          updateZone.mutate({ id, x, y }, { onSuccess: () => toast.success("Zona colocada en el mapa") });
        }
      } catch {}
      return;
    }

    try {
      const animal = JSON.parse(e.dataTransfer.getData("application/json"));
      // Auto-unpair birds when removed from zone
      if (animal.type === "bird") {
        const bird = animals.find(a => a.id === animal.id);
        if (bird?.pareja_id) {
          pairBirds.mutate(
            { bird1Id: bird.id, bird2Id: bird.pareja_id, unpair: true },
            { onSuccess: () => toast.info("Pareja deshecha al quitar de zona") }
          );
        }
      }
      updateAnimalZone.mutate(
        { id: animal.id, type: animal.type, zona: null },
        { onSuccess: () => toast.success("Ejemplar quitado de su zona") }
      );
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleAddUnmappedZone = (nombre: string) => {
    const colorIdx = zones.length % ZONE_COLORS.length;
    createZone.mutate(
      { nombre, x: -1, y: -1, color: ZONE_COLORS[colorIdx] },
      { onSuccess: () => toast.success(`Zona "${nombre}" añadida al panel`) }
    );
  };

  // Zones not yet placed on canvas (x < 0)
  const unplacedZones = zones.filter((z) => z.x < 0 || z.y < 0);
  const placedStandaloneZones = standaloneZones.filter((z) => z.x >= 0 && z.y >= 0);

  const handleDeleteZone = (id: string) => {
    deleteZone.mutate(id, { onSuccess: () => toast.success("Zona eliminada del mapa") });
  };

  const handleColorChange = (id: string, color: string) => {
    updateZone.mutate({ id, color });
  };

  const handleToggleFolderCollapsed = (id: string, collapsed: boolean) => {
    updateFolder.mutate({ id, collapsed });
  };

  const handlePairBirds = (bird1Id: string, bird2Id: string) => {
    // Check if already paired to toggle
    const b1 = animals.find(a => a.id === bird1Id);
    const arePaired = b1?.pareja_id === bird2Id;
    pairBirds.mutate(
      { bird1Id, bird2Id, unpair: arePaired },
      { onSuccess: () => toast.success(arePaired ? "Pareja deshecha" : "¡Pareja creada exitosamente!") }
    );
  };

  const handleAssignZoneToFolder = (zoneId: string, folderId: string) => {
    assignZoneToFolder.mutate(
      { zoneId, folderId },
      { onSuccess: () => toast.success("Zona movida a la carpeta") }
    );
  };

  const handleRemoveZoneFromFolder = (zoneId: string) => {
    assignZoneToFolder.mutate(
      { zoneId, folderId: null },
      { onSuccess: () => toast.success("Zona sacada de la carpeta") }
    );
  };

  if (zonesLoading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Cargando mapa…</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      <MapSidebar
        zones={zones}
        folders={folders}
        unmappedZones={unmappedZones}
        unassigned={unassigned}
        unplacedZones={unplacedZones}
        onAddUnmappedZone={handleAddUnmappedZone}
        onAnimalDragStart={handleAnimalDragStart}
        onZoneDragStart={(e, zone) => {
          e.dataTransfer.setData("application/zone-place", JSON.stringify({ id: zone.id }));
          e.dataTransfer.effectAllowed = "move";
        }}
        onNewZoneOpen={() => setNewZoneOpen(true)}
        onNewFolderOpen={() => setNewFolderOpen(true)}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-muted/30"
        onDrop={handleCanvasDrop}
        onDragOver={handleDragOver}
        style={{ minWidth: 800, minHeight: 600 }}
      >
        {zones.length === 0 && unmappedZones.length === 0 && folders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <p className="text-center">
              No hay zonas definidas.<br />
              Crea zonas o carpetas desde el panel lateral.
            </p>
          </div>
        )}

        {/* Folders */}
        {folders.map((folder) => (
          <MapFolderRect
            key={folder.id}
            folder={folder}
            zones={zonesInFolder(folder.id)}
            animals={animals}
            onToggleCollapsed={handleToggleFolderCollapsed}
            onAnimalDragStart={handleAnimalDragStart}
            onZoneDrop={handleZoneDrop}
            onDragOver={handleDragOver}
            onZoneMouseDown={handleZoneMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onColorChange={handleColorChange}
            onDeleteZone={handleDeleteZone}
            onDeleteFolder={(id) => deleteFolder.mutate(id, { onSuccess: () => toast.success("Carpeta eliminada") })}
            onFolderMouseDown={handleFolderMouseDown}
            onFolderResizeMouseDown={handleFolderResizeMouseDown}
            onPairBirds={handlePairBirds}
            onZoneDropToFolder={handleAssignZoneToFolder}
            onRemoveFromFolder={handleRemoveZoneFromFolder}
            animalsInZone={animalsInZone}
          />
        ))}

        {/* Standalone zones (not in folders, placed on canvas) */}
        {placedStandaloneZones.map((zone) => (
          <MapZoneRect
            key={zone.id}
            zone={zone}
            animals={animalsInZone(zone.nombre)}
            onAnimalDragStart={handleAnimalDragStart}
            onZoneDrop={handleZoneDrop}
            onDragOver={handleDragOver}
            onZoneMouseDown={handleZoneMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onColorChange={handleColorChange}
            onDelete={handleDeleteZone}
            onPairBirds={handlePairBirds}
          />
        ))}
      </div>

      {/* New zone dialog */}
      <Dialog open={newZoneOpen} onOpenChange={setNewZoneOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear nueva zona</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = newZoneName.trim();
              if (!name) return;
              if (zones.some((z) => z.nombre.toLowerCase() === name.toLowerCase())) {
                toast.error("Ya existe una zona con ese nombre");
                return;
              }
              handleAddUnmappedZone(name);
              setNewZoneName("");
              setNewZoneOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <Input placeholder="Nombre de la zona" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} autoFocus />
            <Button type="submit" disabled={!newZoneName.trim()}>Crear zona</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear nueva carpeta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = newFolderName.trim();
              if (!name) return;
              const colorIdx = folders.length % FOLDER_COLORS.length;
              createFolder.mutate(
                { nombre: name, x: 40, y: 40, color: FOLDER_COLORS[colorIdx] },
                { onSuccess: () => toast.success(`Carpeta "${name}" creada`) }
              );
              setNewFolderName("");
              setNewFolderOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <Input placeholder="Nombre de la carpeta" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
            <Button type="submit" disabled={!newFolderName.trim()}>Crear carpeta</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
