"use client";

import { Save, Link as LinkIcon, Edit3, Trash2, Shield, Settings2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in relative pb-20">
      
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">System Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure Meta integrations, AI behavior, and organization details.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        
        {/* Settings Navigation (left side) */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-active)] text-[var(--text-primary)] rounded-lg font-medium border border-[var(--border)] transition-colors">
            <LinkIcon size={18} className="text-[var(--accent)]" /> 
            Meta Integration
          </button>
          <button className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg font-medium border border-transparent hover:border-[var(--border)] transition-colors">
            <Settings2 size={18} /> 
            AI Configuration
          </button>
          <button className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg font-medium border border-transparent hover:border-[var(--border)] transition-colors">
            <Shield size={18} /> 
            Organization Profile
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Meta Integration Config */}
          <div className="card p-6" id="meta-integration">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">Meta (Facebook) Integration</h2>
              <p className="text-sm text-[var(--text-muted)] mt-3">
                Connect your Facebook Page to receive messages via Webhook and send replies. For a live environment, your Meta App needs <code>pages_messaging</code> permission.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="input-group">
                <label>Page ID</label>
                <input type="text" className="input" defaultValue="10394819482751" disabled />
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 px-1">Connected on: Jan 10, 2024</span>
              </div>
              
              <div className="input-group">
                <label>Page Access Token</label>
                <div className="relative">
                  <input type="password" className="input pr-12 font-mono text-xs" defaultValue="EAAJv..." placeholder="EAA..." disabled />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-active)] rounded-md transition-colors" data-tooltip="Edit">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Webhook Callback URL</label>
                <div className="flex bg-[var(--surface-active)] p-3 rounded-md border border-[var(--border-light)] items-center justify-between">
                  <code className="text-xs text-[var(--text-primary)] text-ellipsis overflow-hidden whitespace-nowrap mr-3">
                    https://megauto.com/api/webhook/messenger
                  </code>
                  <button className="text-xs font-semibold text-[var(--accent)] hover:underline shrink-0">Copy</button>
                </div>
              </div>
              
              <div className="input-group">
                <label>Webhook Verify Token</label>
                <div className="flex bg-[var(--surface-active)] p-3 rounded-md border border-[var(--border-light)] items-center justify-between">
                  <code className="text-xs text-[var(--text-primary)]">messenger-ai-agent-verify</code>
                  <button className="text-xs font-semibold text-[var(--accent)] hover:underline shrink-0">Copy</button>
                </div>
              </div>

              <div className="mt-4 flex gap-3 pt-4 border-t border-[var(--border)] justify-end">
                 <button className="btn btn-danger btn-sm bg-transparent border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-all">
                  Disconnect Meta
                </button>
                <button className="btn btn-secondary btn-sm">
                  Refresh Token
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--sidebar-width)] p-4 bg-[var(--background)]/80 backdrop-blur-md border-t border-[var(--border)] z-20 flex justify-end gap-3 transition-all duration-300">
        <button className="btn btn-ghost disabled:opacity-50" disabled>Discard Changes</button>
        <button className="btn btn-primary shadow-lg shadow-[var(--accent-glow)] disabled:opacity-50" disabled>
          <Save size={16} /> Save Setup
        </button>
      </div>

    </div>
  );
}
