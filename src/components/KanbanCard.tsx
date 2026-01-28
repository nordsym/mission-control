"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Doc } from "../../convex/_generated/dataModel";

type Activity = Doc<"activities">;

const typeIcons: Record<Activity["type"], string> = {
  task: "✓",
  commit: "⟠",
  research: "◎",
  notification: "◆",
  approval_request: "⚠",
};

const typeColors: Record<Activity["type"], string> = {
  task: "text-green",
  commit: "text-purple",
  research: "text-cyan",
  notification: "text-yellow",
  approval_request: "text-orange",
};

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function KanbanCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-surface border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-cyan/30 transition-all ${
        isDragging ? "shadow-lg shadow-cyan/20" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setExpanded(!expanded);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-sm ${typeColors[activity.type]}`}>
          {typeIcons[activity.type]}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text text-sm truncate">{activity.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded bg-surface-2 ${typeColors[activity.type]}`}>
              {activity.type}
            </span>
            <span className="text-xs text-text-muted">{getTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border animate-fadeIn">
          <p className="text-sm text-text-muted">{activity.description}</p>
          {activity.metadata && (
            <pre className="mt-2 p-2 bg-surface-2 rounded text-xs text-text-muted overflow-x-auto">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
