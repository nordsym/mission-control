"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SettingsPage() {
  const settings = useQuery(api.settings.getAll);

  const agentName = settings?.agentName ?? "Symbot";
  const webhookUrl = settings?.webhookUrl ?? "Not configured";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text font-headlines">Settings</h1>
        <p className="text-text-muted mt-1">Configure your Mission Control</p>
      </div>

      {/* Agent Config */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 font-headlines">
            <span className="text-cyan">◆</span> Agent Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Agent Name</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center font-bold text-lg">
                  {agentName[0]}
                </div>
                <input
                  type="text"
                  value={agentName}
                  readOnly
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-cyan"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 font-headlines">
            <span className="text-purple">⚡</span> Integration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Webhook URL</label>
              <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 font-mono text-sm text-text-muted break-all">
                {webhookUrl}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Use this URL to send events from Clawdbot to Mission Control
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 font-headlines">
          <span className="text-green">◉</span> Status
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-2 rounded-lg p-4">
            <p className="text-sm text-text-muted">Agent Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
              <span className="text-text font-medium">Online</span>
            </div>
          </div>
          <div className="bg-surface-2 rounded-lg p-4">
            <p className="text-sm text-text-muted">Last Sync</p>
            <p className="text-text font-medium mt-1">Just now</p>
          </div>
          <div className="bg-surface-2 rounded-lg p-4">
            <p className="text-sm text-text-muted">Database</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green"></span>
              <span className="text-text font-medium">Convex</span>
            </div>
          </div>
          <div className="bg-surface-2 rounded-lg p-4">
            <p className="text-sm text-text-muted">Hosting</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green"></span>
              <span className="text-text font-medium">Vercel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-sm text-text-muted">
        <p>Symbot Mission Control v0.1.0</p>
        <p className="mt-1">Built with Next.js + Convex</p>
      </div>
    </div>
  );
}
