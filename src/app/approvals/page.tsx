"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";

type Activity = Doc<"activities">;
type Approval = Doc<"approvals"> & {
  activity: Activity | null;
};

// Type icons mapping
const typeIcons: Record<string, string> = {
  email: "📧",
  lead: "🔍",
  meeting: "📅",
  task: "📋",
  approval_request: "⏳",
  commit: "💾",
  research: "🔬",
  notification: "🔔",
  other: "📄",
};

// Priority colors
const priorityColors: Record<string, string> = {
  high: "bg-red/20 text-red border-red/30",
  medium: "bg-yellow/20 text-yellow border-yellow/30",
  low: "bg-green/20 text-green border-green/30",
};

export default function ApprovalsPage() {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"approvals">>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Map<Id<"approvals">, "approved" | "rejected">>(new Map());
  
  const previewRef = useRef<HTMLTextAreaElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  
  const pendingApprovals = useQuery(api.approvals.listPending);
  const stats = useQuery(api.approvals.getStats);
  
  const approveMutation = useMutation(api.approvals.approve);
  const rejectMutation = useMutation(api.approvals.reject);
  const updateMutation = useMutation(api.approvals.update);
  const bulkApproveMutation = useMutation(api.approvals.bulkApprove);
  const bulkRejectMutation = useMutation(api.approvals.bulkReject);

  const items = pendingApprovals ?? [];
  const currentItem = items[currentIndex];

  // Update edited content when current item changes
  useEffect(() => {
    if (currentItem?.activity) {
      setEditedContent(currentItem.activity.description);
    }
  }, [currentItem]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if editing (except Escape)
      if (isEditing && e.key !== "Escape") return;
      
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") {
          setIsEditing(false);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "a":
          if (currentItem) handleApprove(currentItem._id);
          break;
        case "e":
          if (currentItem && !isEditing) {
            setIsEditing(true);
            setTimeout(() => previewRef.current?.focus(), 100);
          }
          break;
        case "r":
          if (currentItem) handleReject(currentItem._id);
          break;
        case "escape":
          if (isEditing) setIsEditing(false);
          break;
        case "arrowup":
          e.preventDefault();
          setCurrentIndex(i => Math.max(0, i - 1));
          break;
        case "arrowdown":
          e.preventDefault();
          setCurrentIndex(i => Math.min(items.length - 1, i + 1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentItem, isEditing, items.length]);

  // Scroll current item into view
  useEffect(() => {
    const el = queueRef.current?.querySelector(`[data-index="${currentIndex}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentIndex]);

  const handleApprove = async (id: Id<"approvals">) => {
    if (isEditing) await handleSaveEdit();
    
    setAnimatingIds(prev => new Map(prev).set(id, "approved"));
    
    setTimeout(async () => {
      await approveMutation({ id });
      setAnimatingIds(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      // Adjust current index if needed
      setCurrentIndex(i => Math.min(i, Math.max(0, items.length - 2)));
    }, 300);
  };

  const handleReject = async (id: Id<"approvals">) => {
    if (isEditing) await handleSaveEdit();
    
    setAnimatingIds(prev => new Map(prev).set(id, "rejected"));
    
    setTimeout(async () => {
      await rejectMutation({ id });
      setAnimatingIds(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setCurrentIndex(i => Math.min(i, Math.max(0, items.length - 2)));
    }, 300);
  };

  const handleSaveEdit = async () => {
    if (!currentItem) return;
    await updateMutation({ id: currentItem._id, content: editedContent });
    setIsEditing(false);
  };

  const handleSelect = (id: Id<"approvals">) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(a => a._id)));
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    ids.forEach((id, i) => {
      setTimeout(() => {
        setAnimatingIds(prev => new Map(prev).set(id, "approved"));
      }, i * 100);
    });
    
    setTimeout(async () => {
      await bulkApproveMutation({ ids });
      setSelectedIds(new Set());
      setAnimatingIds(new Map());
      setCurrentIndex(0);
    }, ids.length * 100 + 300);
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    ids.forEach((id, i) => {
      setTimeout(() => {
        setAnimatingIds(prev => new Map(prev).set(id, "rejected"));
      }, i * 100);
    });
    
    setTimeout(async () => {
      await bulkRejectMutation({ ids });
      setSelectedIds(new Set());
      setAnimatingIds(new Map());
      setCurrentIndex(0);
    }, ids.length * 100 + 300);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString("sv-SE");
  };

  const getApprovalType = (activity: Activity | null): string => {
    if (!activity) return "other";
    const meta = activity.metadata as Record<string, unknown> | undefined;
    return (meta?.approvalType as string) ?? activity.type ?? "other";
  };

  const getPriority = (activity: Activity | null): string => {
    if (!activity) return "medium";
    const meta = activity.metadata as Record<string, unknown> | undefined;
    return (meta?.priority as string) ?? "medium";
  };

  const getCreatedBy = (activity: Activity | null): string => {
    if (!activity) return "Agent";
    const meta = activity.metadata as Record<string, unknown> | undefined;
    return (meta?.createdBy as string) ?? "Agent";
  };

  const getRecipient = (activity: Activity | null): string => {
    if (!activity) return "-";
    const meta = activity.metadata as Record<string, unknown> | undefined;
    return (meta?.recipient as string) ?? (meta?.to as string) ?? "-";
  };

  const getSubject = (activity: Activity | null): string => {
    if (!activity) return "-";
    const meta = activity.metadata as Record<string, unknown> | undefined;
    return (meta?.subject as string) ?? "-";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            📋 Approval Queue
          </h1>
          <p className="text-text-muted mt-1">Sales actions waiting for your decision</p>
        </div>
        
        {/* Stats Bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-yellow">{stats?.pending ?? "-"}</span>
            <span className="text-xs text-text-muted uppercase tracking-wide">Pending</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-green">{stats?.approvedToday ?? "-"}</span>
            <span className="text-xs text-text-muted uppercase tracking-wide">Approved Today</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-red">{stats?.rejectionRate ?? 0}%</span>
            <span className="text-xs text-text-muted uppercase tracking-wide">Rejection Rate</span>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-surface border border-cyan/30 rounded-xl animate-fadeIn">
          <span className="text-cyan font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-green text-base font-medium rounded-lg hover:bg-green/80 transition-all hover:shadow-lg hover:shadow-green/20"
          >
            ✅ Approve All
          </button>
          <button
            onClick={handleBulkReject}
            className="px-4 py-2 bg-red text-white font-medium rounded-lg hover:bg-red/80 transition-all hover:shadow-lg hover:shadow-red/20"
          >
            ❌ Reject All
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-4 py-2 bg-surface-2 text-text-muted font-medium rounded-lg hover:text-text transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Keyboard Hints */}
      <div className="hidden md:flex items-center gap-6 text-text-muted text-sm">
        <span><kbd className="px-2 py-1 bg-surface-2 border border-border rounded text-xs">A</kbd> Approve</span>
        <span><kbd className="px-2 py-1 bg-surface-2 border border-border rounded text-xs">E</kbd> Edit</span>
        <span><kbd className="px-2 py-1 bg-surface-2 border border-border rounded text-xs">R</kbd> Reject</span>
        <span><kbd className="px-2 py-1 bg-surface-2 border border-border rounded text-xs">↑↓</kbd> Navigate</span>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden text-center text-text-muted text-sm py-2">
        👆 Tap to select, use buttons to approve/reject
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Panel */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold text-text flex items-center gap-2">
              📋 Pending Items
              {items.length > 0 && (
                <span className="text-xs bg-yellow/20 text-yellow px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-text-muted hover:text-cyan transition-colors"
              >
                {selectedIds.size === items.length ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
          
          <div ref={queueRef} className="max-h-[600px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-medium text-text mb-2">All caught up!</h3>
                <p className="text-text-muted">No pending items to review</p>
              </div>
            ) : (
              items.map((item, index) => {
                const type = getApprovalType(item.activity);
                const priority = getPriority(item.activity);
                const icon = typeIcons[type] || "📄";
                const animState = animatingIds.get(item._id);
                
                return (
                  <div
                    key={item._id}
                    data-index={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`
                      px-5 py-4 border-b border-border cursor-pointer transition-all
                      ${index === currentIndex ? "bg-purple/10 border-l-2 border-l-purple" : "hover:bg-surface-2"}
                      ${selectedIds.has(item._id) ? "bg-cyan/5" : ""}
                      ${animState === "approved" ? "animate-slideOutRight" : ""}
                      ${animState === "rejected" ? "animate-slideOutLeft" : ""}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelect(item._id);
                        }}
                        className="mt-1 w-4 h-4 rounded border-border bg-surface-2 text-cyan focus:ring-cyan cursor-pointer"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium text-text truncate">{item.activity?.title || "Untitled"}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${priorityColors[priority]}`}>
                            {priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-text-muted line-clamp-2 mb-2">
                          {item.activity?.description?.slice(0, 100)}...
                        </p>
                        
                        <div className="flex justify-between items-center text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple"></span>
                            {getCreatedBy(item.activity)}
                          </span>
                          <span>{formatTime(item.requestedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold text-text flex items-center gap-2">
              👁️ Preview
            </h2>
            {isEditing && (
              <div className="flex items-center gap-2 text-cyan text-sm">
                <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
                Editing mode
              </div>
            )}
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto">
            {!currentItem ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                <div className="text-4xl mb-4 opacity-50">📄</div>
                <p>Select an item to preview</p>
                <p className="text-xs mt-2 opacity-60">Use keyboard or click to navigate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Type Badge */}
                <div className="inline-flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-full text-sm">
                  {typeIcons[getApprovalType(currentItem.activity)] || "📄"}
                  <span className="capitalize">{getApprovalType(currentItem.activity)}</span>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold text-text">
                  {currentItem.activity?.title || "Untitled"}
                </h3>
                
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-muted">To:</span>
                    <span className="ml-2 text-text">{getRecipient(currentItem.activity)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Subject:</span>
                    <span className="ml-2 text-text">{getSubject(currentItem.activity)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Agent:</span>
                    <span className="ml-2 text-text">{getCreatedBy(currentItem.activity)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Created:</span>
                    <span className="ml-2 text-text">{formatTime(currentItem.requestedAt)}</span>
                  </div>
                </div>
                
                {/* Content */}
                {isEditing ? (
                  <textarea
                    ref={previewRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-64 bg-surface-2 border-2 border-cyan rounded-xl p-4 text-text resize-none focus:outline-none"
                    placeholder="Edit content..."
                  />
                ) : (
                  <div className="bg-surface-2 rounded-xl p-4 text-text whitespace-pre-wrap leading-relaxed">
                    {currentItem.activity?.description || "No content"}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          {currentItem && (
            <div className="px-5 py-4 border-t border-border flex gap-3 justify-end">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 bg-surface-2 text-text-muted font-medium rounded-xl hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-3 bg-cyan text-base font-medium rounded-xl hover:bg-cyan/80 transition-all hover:shadow-lg hover:shadow-cyan/20"
                  >
                    💾 Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-3 bg-surface-2 text-text font-medium rounded-xl hover:bg-surface-2/80 transition-colors border border-border"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleReject(currentItem._id)}
                    className="px-5 py-3 bg-red/10 text-red font-medium rounded-xl hover:bg-red/20 transition-all border border-red/30"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => handleApprove(currentItem._id)}
                    className="px-5 py-3 bg-green text-base font-medium rounded-xl hover:bg-green/80 transition-all hover:shadow-lg hover:shadow-green/20"
                  >
                    ✅ Approve
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
