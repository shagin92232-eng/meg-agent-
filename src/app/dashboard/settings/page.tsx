"use client";

import { useEffect, useState } from "react";
import { Save, Link as LinkIcon, Edit3, Shield, Settings2 } from "lucide-react";

type TabKey = "meta" | "ai" | "profile";
type SettingsMap = Record<string, any>;

type OrgPayload = {
  organization?: { id?: string; name?: string; plan?: string };
  profile?: { id?: string; full_name?: string; email?: string; role?: string };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [org, setOrg] = useState<OrgPayload>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("meta");

  useEffect(() => {
    void Promise.all([
      fetch("/api/settings").then((r) => r.ok ? r.json() : Promise.reject(r)).then((payload) => setSettings(payload?.data ?? {})),
      fetch("/api/organizations").then((r) => r.ok ? r.json() : Promise.reject(r)).then((payload) => setOrg(payload?.data ?? {})),
    ]).catch(() => setMessage("Unable to load settings."));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: org.organization?.name,
          full_name: org.profile?.full_name,
          email: org.profile?.email,
        }),
      });
      setMessage("Settings saved.");
    } catch {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in relative pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">System Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure Meta integrations, AI behavior, and organization details.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <button className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border transition-colors ${activeTab === "meta" ? "bg-[var(--surface-active)] text-[var(--text-primary)] border-[var(--border)]" : "hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border)]"}`} onClick={() => setActiveTab("meta")}>
            <LinkIcon size={18} className="text-[var(--accent)]" />
            Meta Integration
          </button>
          <button className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border transition-colors ${activeTab === "ai" ? "bg-[var(--surface-active)] text-[var(--text-primary)] border-[var(--border)]" : "hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border)]"}`} onClick={() => setActiveTab("ai")}>
            <Settings2 size={18} />
            AI Configuration
          </button>
          <button className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border transition-colors ${activeTab === "profile" ? "bg-[var(--surface-active)] text-[var(--text-primary)] border-[var(--border)]" : "hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border)]"}`} onClick={() => setActiveTab("profile")}>
            <Shield size={18} />
            Organization Profile
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          {activeTab === "meta" && (
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
          )}

          {activeTab === "ai" && (
            <div className="card p-6" id="ai-configuration">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">AI Configuration</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="input-group">
                  <label>System prompt</label>
                  <textarea className="input min-h-[120px]" value={settings.system_prompt ?? ""} onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>AI enabled</label>
                    <select className="input" value={String(settings.ai_enabled ?? true)} onChange={(e) => setSettings({ ...settings, ai_enabled: e.target.value === "true" })}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>AI language</label>
                    <select className="input" value={settings.ai_language ?? "auto"} onChange={(e) => setSettings({ ...settings, ai_language: e.target.value })}>
                      <option value="auto">Auto</option>
                      <option value="en">English</option>
                      <option value="bn">Bangla</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>AI greeting</label>
                    <input type="text" className="input" value={settings.ai_greeting ?? ""} onChange={(e) => setSettings({ ...settings, ai_greeting: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Temperature</label>
                    <input type="number" className="input" value={settings.ai_temperature ?? 0.4} min="0" max="1" step="0.1" onChange={(e) => setSettings({ ...settings, ai_temperature: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="card p-6" id="organization-profile">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">Organization Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Organization name</label>
                  <input type="text" className="input" value={org.organization?.name ?? ""} onChange={(e) => setOrg({ ...org, organization: { ...(org.organization ?? {}), name: e.target.value } })} />
                </div>
                <div className="input-group">
                  <label>Plan</label>
                  <select className="input" value={org.organization?.plan ?? "free"} onChange={(e) => setOrg({ ...org, organization: { ...(org.organization ?? {}), plan: e.target.value } })}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Owner full name</label>
                  <input type="text" className="input" value={org.profile?.full_name ?? ""} onChange={(e) => setOrg({ ...org, profile: { ...(org.profile ?? {}), full_name: e.target.value } })} />
                </div>
                <div className="input-group">
                  <label>Owner email</label>
                  <input type="email" className="input" value={org.profile?.email ?? ""} onChange={(e) => setOrg({ ...org, profile: { ...(org.profile ?? {}), email: e.target.value } })} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--sidebar-width)] p-4 bg-[var(--background)]/80 backdrop-blur-md border-t border-[var(--border)] z-20 flex justify-end gap-3 transition-all duration-300">
        <button className="btn btn-ghost disabled:opacity-50" disabled>Discard Changes</button>
        <button className="btn btn-primary shadow-lg shadow-[var(--accent-glow)] disabled:opacity-50" onClick={handleSave}>
          <Save size={16} /> {saving ? "Saving..." : "Save Setup"}
        </button>
      </div>
      {message && <div className="text-xs text-[var(--text-secondary)]">{message}</div>}
    </div>
  );
}
