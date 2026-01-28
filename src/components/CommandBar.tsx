"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const sendCommand = useMutation(api.commands.send);
  const recentCommands = useQuery(api.commands.list, { limit: 5 });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen(true);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setInput("");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendCommand({ text: input.trim() });
    setInput("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center gap-3 text-text-muted hover:text-text hover:border-cyan/50 transition-all shadow-lg z-50"
      >
        <span className="text-cyan">⌘</span>
        <span className="hidden sm:inline">Command</span>
        <kbd className="hidden sm:inline bg-surface px-2 py-0.5 rounded text-xs">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-base/80 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50 animate-fadeIn">
        <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <span className="text-cyan text-xl">⚡</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a command to your agent..."
                className="flex-1 bg-transparent text-text placeholder:text-text-muted focus:outline-none text-lg"
              />
              <kbd className="bg-surface-2 px-2 py-1 rounded text-xs text-text-muted">ESC</kbd>
            </div>
          </form>
          
          {recentCommands && recentCommands.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-text-muted uppercase tracking-wide">Recent</p>
              {recentCommands.map((cmd) => (
                <button
                  key={cmd._id}
                  onClick={() => {
                    setInput(cmd.text);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text transition-colors flex items-center gap-3"
                >
                  <span className="text-purple">↻</span>
                  <span className="truncate">{cmd.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
