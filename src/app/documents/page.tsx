"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type TypeFilter = "all" | "research" | "report" | "template";

const typeFilters: { value: TypeFilter; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📚" },
  { value: "research", label: "Research", icon: "🔬" },
  { value: "report", label: "Reports", icon: "📊" },
  { value: "template", label: "Templates", icon: "📝" },
];

const typeColors: Record<string, string> = {
  research: "bg-purple/20 text-purple border-purple/30",
  report: "bg-cyan/20 text-cyan border-cyan/30",
  template: "bg-green/20 text-green border-green/30",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsPage() {
  const [filter, setFilter] = useState<TypeFilter>("all");
  
  const documents = useQuery(api.documents.list, 
    filter === "all" ? {} : { type: filter as "research" | "report" | "template" }
  );
  
  const removeDocument = useMutation(api.documents.remove);

  const handleDelete = async (id: Id<"documents">) => {
    if (confirm("Är du säker på att du vill ta bort detta dokument?")) {
      await removeDocument({ id });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Documents</h1>
        <p className="text-text-muted mt-1">Research, rapporter och mallar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setFilter(tf.value)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              filter === tf.value
                ? "bg-cyan/10 text-cyan border border-cyan/30"
                : "bg-surface-2 text-text-muted hover:text-text"
            }`}
          >
            <span>{tf.icon}</span>
            <span>{tf.label}</span>
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documents === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-cyan animate-pulse text-xl">📄 Loading...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-text-muted bg-surface border border-border rounded-xl">
            <p className="text-4xl mb-2">📭</p>
            <p>Inga dokument ännu</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-surface border border-border rounded-xl p-4 hover:border-cyan/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs border ${typeColors[doc.type]}`}>
                      {doc.type}
                    </span>
                    <span className="text-text-muted text-sm">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-text text-lg mb-1">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan transition-colors"
                      >
                        {doc.title} ↗
                      </a>
                    ) : (
                      doc.title
                    )}
                  </h3>
                  
                  <p className="text-text-muted text-sm mb-2">
                    {doc.description}
                  </p>
                  
                  <p className="text-text-muted text-xs font-mono">
                    📁 {doc.filePath}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="text-text-muted hover:text-red transition-colors p-2"
                  title="Ta bort"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
