"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ApprovalCard } from "@/components/ApprovalCard";
import { Id } from "../../../convex/_generated/dataModel";

export default function ApprovalsPage() {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"approvals">>>(new Set());
  
  const pendingApprovals = useQuery(api.approvals.listPending);
  const bulkResolve = useMutation(api.approvals.bulkResolve);

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
    if (!pendingApprovals) return;
    if (selectedIds.size === pendingApprovals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingApprovals.map(a => a._id)));
    }
  };

  const handleBulkResolve = async (resolution: "approved" | "rejected") => {
    if (selectedIds.size === 0) return;
    await bulkResolve({ ids: Array.from(selectedIds), resolution });
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Approval Queue</h1>
          <p className="text-text-muted mt-1">Actions waiting for your decision</p>
        </div>
        {pendingApprovals && pendingApprovals.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-orange font-medium">
              {pendingApprovals.length} pending
            </span>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-surface border border-cyan/30 rounded-xl animate-fadeIn">
          <span className="text-cyan font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => handleBulkResolve("approved")}
            className="px-4 py-2 bg-green text-base font-medium rounded-lg hover:bg-green/80 transition-colors"
          >
            Approve All
          </button>
          <button
            onClick={() => handleBulkResolve("rejected")}
            className="px-4 py-2 bg-red text-white font-medium rounded-lg hover:bg-red/80 transition-colors"
          >
            Reject All
          </button>
        </div>
      )}

      {/* Select All */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-sm text-text-muted hover:text-cyan transition-colors"
          >
            {selectedIds.size === pendingApprovals.length ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      {/* Approval List */}
      <div className="space-y-4">
        {pendingApprovals === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-cyan animate-pulse text-xl">◈ Loading...</div>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-16 text-text-muted bg-surface border border-border rounded-xl">
            <p className="text-5xl mb-4">✓</p>
            <p className="text-xl font-medium text-text mb-2">All caught up!</p>
            <p>No pending approvals. Your agent is autonomous.</p>
          </div>
        ) : (
          pendingApprovals.map((approval) => (
            <ApprovalCard
              key={approval._id}
              approval={approval}
              selected={selectedIds.has(approval._id)}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
