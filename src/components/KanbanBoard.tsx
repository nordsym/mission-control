"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

type Status = "notified" | "pending_approval" | "auto_done" | "approved" | "rejected";

const columns: { id: Status | "done"; title: string; icon: string; color: string; statuses: Status[] }[] = [
  { id: "notified", title: "In Progress", icon: "🔄", color: "text-cyan", statuses: ["notified"] },
  { id: "pending_approval", title: "Needs Approval", icon: "⏳", color: "text-orange", statuses: ["pending_approval"] },
  { id: "done", title: "Done", icon: "✅", color: "text-green", statuses: ["auto_done", "approved"] },
  { id: "rejected", title: "Rejected", icon: "❌", color: "text-red", statuses: ["rejected"] },
];

export function KanbanBoard() {
  const activities = useQuery(api.activities.list, {});
  const updateStatus = useMutation(api.activities.updateStatus);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!activities) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-cyan animate-pulse text-xl">◈ Loading board...</div>
      </div>
    );
  }

  const getActivitiesForColumn = (statuses: Status[]) => {
    return activities.filter((a) => statuses.includes(a.status as Status));
  };

  const activeActivity = activeId ? activities.find((a) => a._id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activityId = active.id as Id<"activities">;
    const targetColumnId = over.id as string;

    // Find which column was dropped on
    const targetColumn = columns.find((col) => col.id === targetColumnId);
    if (!targetColumn) return;

    // Get the primary status for this column
    const newStatus = targetColumn.statuses[0];

    // Find current activity status
    const currentActivity = activities.find((a) => a._id === activityId);
    if (!currentActivity || targetColumn.statuses.includes(currentActivity.status as Status)) {
      return; // Already in this column
    }

    // Update status in Convex
    updateStatus({ id: activityId, status: newStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            icon={column.icon}
            color={column.color}
            activities={getActivitiesForColumn(column.statuses)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeActivity ? <KanbanCard activity={activeActivity} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
