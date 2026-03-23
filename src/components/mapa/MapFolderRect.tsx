import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, Folder, GripVertical, Trash2 } from "lucide-react";
import type { MapZone } from "@/hooks/useMapZones";
import type { MapFolder } from "@/hooks/useMapFolders";
import { MapZoneRect } from "./MapZoneRect";

interface AnimalOnMap {
  id: string;
  type: "bird" | "dog";
  label: string;
  zona: string | null;
  pareja_id?: string | null;
}

interface Props {
  folder: MapFolder;
  zones: MapZone[];
  animals: AnimalOnMap[];
  onToggleCollapsed: (id: string, collapsed: boolean) => void;
  onAnimalDragStart: (e: React.DragEvent, animal: { id: string; type: "bird" | "dog" }) => void;
  onZoneDrop: (e: React.DragEvent, zoneName: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onZoneMouseDown: (e: React.MouseEvent, zone: MapZone) => void;
  onResizeMouseDown: (e: React.MouseEvent, zoneId: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDeleteZone: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onFolderMouseDown: (e: React.MouseEvent, folder: MapFolder) => void;
  onFolderResizeMouseDown: (e: React.MouseEvent, folderId: string) => void;
  onPairBirds: (bird1Id: string, bird2Id: string) => void;
  onZoneDropToFolder: (zoneId: string, folderId: string) => void;
  onRemoveFromFolder: (zoneId: string) => void;
  animalsInZone: (zoneName: string) => AnimalOnMap[];
}

export function MapFolderRect({
  folder,
  zones,
  animals,
  onToggleCollapsed,
  onAnimalDragStart,
  onZoneDrop,
  onDragOver,
  onZoneMouseDown,
  onResizeMouseDown,
  onColorChange,
  onDeleteZone,
  onDeleteFolder,
  onFolderMouseDown,
  onFolderResizeMouseDown,
  onPairBirds,
  onZoneDropToFolder,
  onRemoveFromFolder,
  animalsInZone,
}: Props) {
  const collapsed = folder.collapsed;
  const totalAnimals = zones.reduce((sum, z) => sum + animalsInZone(z.nombre).length, 0);

  // Calculate auto-size when expanded
  let displayWidth = folder.width;
  let displayHeight = folder.height;
  
  if (!collapsed && zones.length > 0) {
    // Find the bounding box of all zones
    let maxRight = 0;
    let maxBottom = 0;
    
    zones.forEach((zone) => {
      const right = zone.x + zone.width;
      const bottom = zone.y + zone.height;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    
    // Add padding and ensure minimum size
    const calculatedWidth = Math.max(300, maxRight + 16);
    const calculatedHeight = Math.max(150, maxBottom + 16);
    
    // Use the larger of stored size or calculated size
    displayWidth = Math.max(folder.width, calculatedWidth);
    displayHeight = Math.max(folder.height, calculatedHeight);
  }

  return (
    <div
      id={`folder-${folder.id}`}
      className={`absolute rounded-xl border-2 border-dashed select-none flex flex-col ${
        !collapsed ? "bg-background/95 backdrop-blur-md shadow-lg" : ""
      }`}
      style={{
        left: folder.x,
        top: folder.y,
        width: displayWidth,
        height: displayHeight,
        borderColor: folder.color,
        backgroundColor: collapsed ? `${folder.color}15` : undefined,
        zIndex: collapsed ? 1 : 5,
        transition: "width 0.15s, height 0.15s, background-color 0.2s",
      }}
      onDragOver={(e) => {
        const hasZone = e.dataTransfer.types.includes("application/zone-id");
        if (hasZone || e.dataTransfer.types.includes("application/json")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        const zoneId = e.dataTransfer.getData("application/zone-id");
        if (zoneId) {
          e.preventDefault();
          e.stopPropagation();
          onZoneDropToFolder(zoneId, folder.id);
          return;
        }
        // Also accept animal drops if expanded
        if (!collapsed) {
          // Let zone children handle it
        }
      }}
    >
      {/* Folder header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-grab active:cursor-grabbing shrink-0 rounded-t-xl"
        style={{ backgroundColor: `${folder.color}20` }}
        onMouseDown={(e) => onFolderMouseDown(e, folder)}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapsed(folder.id, !collapsed);
          }}
          className="p-0 shrink-0 hover:opacity-70 transition-opacity"
          title={collapsed ? "Expandir carpeta" : "Colapsar carpeta"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" style={{ color: folder.color }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: folder.color }} />
          )}
        </button>
        <span className="text-xs font-semibold truncate flex-1 text-foreground">
          {folder.nombre}
          {collapsed && (
            <span className="ml-1 text-muted-foreground font-normal">
              ({zones.length} zonas, {totalAnimals} ej.)
            </span>
          )}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFolder(folder.id);
          }}
          className="p-0.5 rounded hover:bg-destructive/20 transition-colors shrink-0"
          title="Eliminar carpeta"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      </div>

      {/* Expanded content: zones rendered inside */}
      {!collapsed && (
        <div className="flex-1 relative overflow-auto p-2">
          {zones.map((zone) => (
            <MapZoneRect
              key={zone.id}
              zone={{ ...zone, x: zone.x, y: zone.y }}
              animals={animalsInZone(zone.nombre)}
              onAnimalDragStart={onAnimalDragStart}
              onZoneDrop={onZoneDrop}
              onDragOver={onDragOver}
              onZoneMouseDown={onZoneMouseDown}
              onResizeMouseDown={onResizeMouseDown}
              onColorChange={onColorChange}
              onDelete={onDeleteZone}
              onPairBirds={onPairBirds}
              onRemoveFromFolder={onRemoveFromFolder}
            />
          ))}
          {zones.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Arrastra zonas desde el panel a esta carpeta
            </p>
          )}
        </div>
      )}

      {/* Resize handle - visible in collapsed state */}
      {collapsed && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => onFolderResizeMouseDown(e, folder.id)}
          style={{
            borderRight: `2px solid ${folder.color}`,
            borderBottom: `2px solid ${folder.color}`,
          }}
        />
      )}
    </div>
  );
}
