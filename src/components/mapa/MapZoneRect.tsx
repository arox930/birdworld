import { Bird, Heart, GripVertical, Trash2, FolderOutput } from "lucide-react";
import type { MapZone } from "@/hooks/useMapZones";

interface AnimalOnMap {
  id: string;
  type: "bird" | "dog";
  label: string;
  zona: string | null;
  pareja_id?: string | null;
}

interface Props {
  zone: MapZone;
  animals: AnimalOnMap[];
  onAnimalDragStart: (e: React.DragEvent, animal: { id: string; type: "bird" | "dog" }) => void;
  onZoneDrop: (e: React.DragEvent, zoneName: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onZoneMouseDown: (e: React.MouseEvent, zone: MapZone) => void;
  onResizeMouseDown: (e: React.MouseEvent, zoneId: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onPairBirds?: (bird1Id: string, bird2Id: string) => void;
  draggableToFolder?: boolean;
  onRemoveFromFolder?: (zoneId: string) => void;
  style?: React.CSSProperties;
}

export function MapZoneRect({
  zone,
  animals,
  onAnimalDragStart,
  onZoneDrop,
  onDragOver,
  onZoneMouseDown,
  onResizeMouseDown,
  onColorChange,
  onDelete,
  onPairBirds,
  draggableToFolder = false,
  onRemoveFromFolder,
  style,
}: Props) {
  const birdsInZone = animals.filter((a) => a.type === "bird");
  const showPairButton = birdsInZone.length === 2;
  const arePaired = showPairButton && birdsInZone[0].pareja_id === birdsInZone[1].id;

  return (
    <div
      id={`zone-${zone.id}`}
      draggable={draggableToFolder}
      onDragStart={draggableToFolder ? (e) => {
        e.dataTransfer.setData("application/zone-id", zone.id);
        e.dataTransfer.effectAllowed = "move";
      } : undefined}
      className="absolute rounded-lg border-2 select-none flex flex-col"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        borderColor: zone.color,
        backgroundColor: `${zone.color}15`,
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onZoneDrop(e, zone.nombre);
      }}
      onDragOver={onDragOver}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-grab active:cursor-grabbing shrink-0"
        style={{ backgroundColor: `${zone.color}30` }}
        onMouseDown={(e) => onZoneMouseDown(e, zone)}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold truncate flex-1 text-foreground">{zone.nombre}</span>
        {showPairButton && onPairBirds && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPairBirds(birdsInZone[0].id, birdsInZone[1].id);
            }}
            className="p-0.5 rounded hover:bg-pink-500/20 transition-colors shrink-0"
            title={arePaired ? "Deshacer pareja" : "Hacer pareja"}
          >
            <Heart className={`h-3 w-3 ${arePaired ? "text-pink-500 fill-pink-500" : "text-pink-500"}`} />
          </button>
        )}
        {zone.folder_id && onRemoveFromFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromFolder(zone.id);
            }}
            className="p-0.5 rounded hover:bg-blue-500/20 transition-colors shrink-0"
            title="Sacar de la carpeta"
          >
            <FolderOutput className="h-3 w-3 text-blue-500" />
          </button>
        )}
        <input
          type="color"
          value={zone.color}
          onChange={(e) => onColorChange(zone.id, e.target.value)}
          className="w-4 h-4 p-0 border-0 rounded cursor-pointer shrink-0"
          title="Cambiar color"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(zone.id);
          }}
          className="p-0.5 rounded hover:bg-destructive/20 transition-colors shrink-0"
          title="Quitar del mapa"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      </div>

      {/* Animals */}
      <div className="flex-1 overflow-auto p-1.5 gap-1 flex flex-wrap content-start">
        {animals.map((a) => (
          <div
            key={`${a.type}-${a.id}`}
            draggable
            onDragStart={(e) => onAnimalDragStart(e, a)}
            className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-background/80 border border-border cursor-grab active:cursor-grabbing shadow-sm"
          >
            <Bird className="h-3 w-3 text-primary" />
            <span className="truncate max-w-[80px]">{a.label}</span>
            {a.pareja_id && <Heart className="h-2.5 w-2.5 text-pink-500 fill-pink-500" />}
          </div>
        ))}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        onMouseDown={(e) => onResizeMouseDown(e, zone.id)}
        style={{
          borderRight: `2px solid ${zone.color}`,
          borderBottom: `2px solid ${zone.color}`,
        }}
      />
    </div>
  );
}
