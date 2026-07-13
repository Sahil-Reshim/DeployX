import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Save, Bell, Shield, User, Code2, Server, Terminal, Key, Sliders, Palette, AlertTriangle, Eye, EyeOff, RefreshCw, XCircle, Monitor, CheckCircle, Container as DockerIcon, GitBranch, Settings as SettingsIcon } from "lucide-react";
import API from "../services/api";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

// localStorage keys
const STORAGE_PREFIX = "deployx_settings_";

const DEFAULT_SETTINGS = {
  // General
  darkTheme: true,
  compactMode: false,
  animations: true,

  // Notifications
  notifications: true,
  emailAlerts: false,
  slackAlerts: false,
  soundNotifications: false,
  showDeploymentNotifications: true,

  // Realtime
  realtimeUpdates: true,
  autoRefresh: true,
  autoScrollLogs: true,
  refreshInterval: "10",

  // Deployment
  autoOpenProductionUrl: true,
  rememberLastRepository: true,
  defaultBranch: "main",

  // Docker
  defaultContainerName: "deployx-app",
  defaultPort: "3000",

  // Jenkins
  defaultJob: "DeployX-Pipeline",
  autoRetry: true,

  // GitHub
  defaultRepository: "",

  // Monitoring
  monitorRefreshInterval: "5",

  // Logs
  maxLogLines: "1000",
  logAutoScroll: true,

  // Security
  confirmBeforeDelete: true,

  // Appearance
  theme: "dark",
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + "preferences");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_PREFIX + "preferences", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

function SettingsSection({ title, icon, children, delay = 0 }) {
  return (
    <motion.div className="settings-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <div className="settings-section-header">
        <div className="settings-section-icon">{icon}</div>
        <h2 className="settings-section-title">{title}</h2>
      </div>
      <div className="settings-section-body">{children}</div>
    </motion.div>
  );
}

function SettingsRow({ label, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <span className="settings-row-label">{label}</span>
        {description && <span className="settings-row-desc">{description}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className="toggle-switch" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  );
}

function applyTheme(darkTheme) {
  const root = document.documentElement;
  if (!darkTheme) {
    root.style.setProperty("--bg-primary", "#ffffff");
    root.style.setProperty("--bg-secondary", "#f5f5f5");
    root.style.setProperty("--text-primary", "#050505");
    root.style.setProperty("--text-secondary", "rgba(0,0,0,0.75)");
    root.style.setProperty("--text-muted", "rgba(0,0,0,0.45)");
    root.style.setProperty("--bg-card", "rgba(0,0,0,0.035)");
    root.style.setProperty("--glass-bg", "rgba(0,0,0,0.04)");
    root.style.setProperty("--glass-border", "rgba(0,0,0,0.07)");
    root.style.setProperty("--border-primary", "rgba(0,0,0,0.07)");
    root.style.setProperty("--border-secondary", "rgba(0,0,0,0.04)");
  } else {
    root.style.setProperty("--bg-primary", "#050505");
    root.style.setProperty("--bg-secondary", "#0a0a0a");
    root.style.setProperty("--text-primary", "#ffffff");
    root.style.setProperty("--text-secondary", "rgba(255,255,255,0.75)");
    root.style.setProperty("--text-muted", "rgba(255,255,255,0.45)");
    root.style.setProperty("--bg-card", "rgba(255,255,255,0.035)");
    root.style.setProperty("--glass-bg", "rgba(255,255,255,0.04)");
    root.style.setProperty("--glass-border", "rgba(255,255,255,0.07)");
    root.style.setProperty("--border-primary", "rgba(255,255,255,0.07)");
    root.style.setProperty("--border-secondary", "rgba(255,255,255,0.04)");
  }
}

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const update = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      // Apply theme immediately
      if (key === "darkTheme") {
        applyTheme(value);
      }
      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent("deployx-settings-change", { detail: { key, value, settings: next } }));
      return next;
    });
  };

  // Apply theme on mount
  useEffect(() => {
    applyTheme(settings.darkTheme);
  }, []);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleClearDeployments = async () => {
    if (!window.confirm("Are you sure you want to clear ALL deployment history? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await API.get("/deployments");
      const deployments = res.data?.deployments || [];
      for (const d of deployments) {
        try {
          await API.delete(`/deployments/${d.id}`);
        } catch (e) {
          console.error(`Failed to delete deployment ${d.id}:`, e);
        }
      }
      alert("All deployments cleared successfully.");
    } catch (e) {
      console.error("Failed to clear deployments:", e);
      alert("Failed to clear deployments. See console for details.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all logs? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await API.get("/deployments");
      const deployments = res.data?.deployments || [];
      for (const d of deployments) {
        try {
          await API.delete(`/deployments/${d.id}/logs`);
        } catch (e) {
          // endpoint may not exist, try container-logs
          try {
            await API.delete(`/deployments/${d.id}/container-logs`);
          } catch (e2) {
            // ignore
          }
        }
      }
      alert("All logs cleared successfully.");
    } catch (e) {
      console.error("Failed to clear logs:", e);
      alert("Failed to clear logs. See console for details.");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPreferences = () => {
    if (!window.confirm("Reset all preferences to default values?")) return;
    localStorage.removeItem(STORAGE_PREFIX + "preferences");
    const defaults = { ...DEFAULT_SETTINGS };
    setSettings(defaults);
    saveSettings(defaults);
    applyTheme(defaults.darkTheme);
    window.dispatchEvent(new CustomEvent("deployx-settings-change", { detail: { key: "reset", settings: defaults } }));
    alert("Preferences reset to defaults.");
  };

  return (
    <motion.div className="settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="settings-header">
        <div>
          <div className="settings-eyebrow">CONFIGURATION</div>
          <h1 className="settings-title">Project Settings</h1>
          <p className="settings-subtitle">Manage your DeployX platform configuration and preferences</p>
        </div>
        <button className="settings-save-btn" onClick={handleSave}>
          {saved ? (
            <>
              <CheckCircle size={14} />
              Saved!
            </>
          ) : (
            <>
              <Save size={14} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="settings-grid">
        {/* General */}
        <SettingsSection title="General" icon={<Sliders size={18} />} delay={0}>
          <SettingsRow label="Dark Theme" description="Toggle between dark and light theme">
            <ToggleSwitch checked={settings.darkTheme} onChange={(v) => update("darkTheme", v)} id="gen-theme" />
          </SettingsRow>
          <SettingsRow label="Compact Mode" description="Reduce spacing for a denser layout">
            <ToggleSwitch checked={settings.compactMode} onChange={(v) => update("compactMode", v)} id="gen-compact" />
          </SettingsRow>
          <SettingsRow label="Animations" description="Enable smooth UI animations">
            <ToggleSwitch checked={settings.animations} onChange={(v) => update("animations", v)} id="gen-animations" />
          </SettingsRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={<Bell size={18} />} delay={0.05}>
          <SettingsRow label="Push Notifications" description="Receive deployment notifications">
            <ToggleSwitch checked={settings.notifications} onChange={(v) => update("notifications", v)} id="notif-push" />
          </SettingsRow>
          <SettingsRow label="Sound Notifications" description="Play sound on deployment events">
            <ToggleSwitch checked={settings.soundNotifications} onChange={(v) => update("soundNotifications", v)} id="notif-sound" />
          </SettingsRow>
          <SettingsRow label="Show Deployment Notifications" description="Show toast notifications for deployments">
            <ToggleSwitch checked={settings.showDeploymentNotifications} onChange={(v) => update("showDeploymentNotifications", v)} id="notif-deploy" />
          </SettingsRow>
        </SettingsSection>

        {/* Realtime */}
        <SettingsSection title="Realtime Updates" icon={<RefreshCw size={18} />} delay={0.1}>
          <SettingsRow label="Realtime Updates" description="Enable realtime socket updates">
            <ToggleSwitch checked={settings.realtimeUpdates} onChange={(v) => update("realtimeUpdates", v)} id="realtime-enable" />
          </SettingsRow>
          <SettingsRow label="Auto Refresh" description="Automatically refresh data">
            <ToggleSwitch checked={settings.autoRefresh} onChange={(v) => update("autoRefresh", v)} id="realtime-refresh" />
          </SettingsRow>
          <SettingsRow label="Auto Scroll Logs" description="Auto-scroll to latest log entries">
            <ToggleSwitch checked={settings.autoScrollLogs} onChange={(v) => update("autoScrollLogs", v)} id="realtime-scroll" />
          </SettingsRow>
          <SettingsRow label="Refresh Interval" description="How often to refresh data (seconds)">
            <select className="settings-select" value={settings.refreshInterval} onChange={(e) => update("refreshInterval", e.target.value)}>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        {/* Deployment Preferences */}
        <SettingsSection title="Deployment Preferences" icon={<Server size={18} />} delay={0.15}>
          <SettingsRow label="Auto Open Production URL" description="Automatically open URL when deployment completes">
            <ToggleSwitch checked={settings.autoOpenProductionUrl} onChange={(v) => update("autoOpenProductionUrl", v)} id="deploy-auto-url" />
          </SettingsRow>
          <SettingsRow label="Remember Last Repository" description="Remember the last deployed repository">
            <ToggleSwitch checked={settings.rememberLastRepository} onChange={(v) => update("rememberLastRepository", v)} id="deploy-remember" />
          </SettingsRow>
          <SettingsRow label="Default Branch" description="Default branch to deploy from">
            <select className="settings-select" value={settings.defaultBranch} onChange={(e) => update("defaultBranch", e.target.value)}>
              <option value="main">main</option>
              <option value="master">master</option>
              <option value="develop">develop</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        {/* Docker Settings */}
        <SettingsSection title="Docker" icon={<DockerIcon size={18} />} delay={0.2}>
          <SettingsRow label="Default Container Name" description="Default name for new containers">
            <input type="text" className="settings-input" value={settings.defaultContainerName} onChange={(e) => update("defaultContainerName", e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Default Port" description="Default internal port for applications">
            <input type="number" className="settings-input settings-input-short" value={settings.defaultPort} onChange={(e) => update("defaultPort", e.target.value)} min="1" max="65535" />
          </SettingsRow>
        </SettingsSection>

        {/* Jenkins Settings */}
        <SettingsSection title="Jenkins" icon={<Terminal size={18} />} delay={0.25}>
          <SettingsRow label="Default Job" description="Default Jenkins job name">
            <input type="text" className="settings-input" value={settings.defaultJob} onChange={(e) => update("defaultJob", e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Auto Retry" description="Automatically retry failed Jenkins jobs">
            <ToggleSwitch checked={settings.autoRetry} onChange={(v) => update("autoRetry", v)} id="jenkins-retry" />
          </SettingsRow>
        </SettingsSection>

        {/* GitHub */}
        <SettingsSection title="GitHub" icon={<GitBranch size={18} />} delay={0.3}>
          <SettingsRow label="Default Repository" description="Default GitHub repository URL">
            <input type="text" className="settings-input" placeholder="https://github.com/user/repo" value={settings.defaultRepository} onChange={(e) => update("defaultRepository", e.target.value)} />
          </SettingsRow>
        </SettingsSection>

        {/* Monitoring */}
        <SettingsSection title="Monitoring" icon={<Monitor size={18} />} delay={0.35}>
          <SettingsRow label="Refresh Interval" description="How often to poll monitoring metrics (seconds)">
            <select className="settings-select" value={settings.monitorRefreshInterval} onChange={(e) => update("monitorRefreshInterval", e.target.value)}>
              <option value="2">2 seconds</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        {/* Logs */}
        <SettingsSection title="Logs" icon={<Terminal size={18} />} delay={0.4}>
          <SettingsRow label="Maximum Log Lines" description="Maximum log lines to display">
            <select className="settings-select" value={settings.maxLogLines} onChange={(e) => update("maxLogLines", e.target.value)}>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="5000">5000</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Auto Scroll" description="Auto-scroll to new log entries">
            <ToggleSwitch checked={settings.logAutoScroll} onChange={(v) => update("logAutoScroll", v)} id="logs-scroll" />
          </SettingsRow>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security" icon={<Shield size={18} />} delay={0.45}>
          <SettingsRow label="Confirm Before Delete" description="Show confirmation dialog before deleting">
            <ToggleSwitch checked={settings.confirmBeforeDelete} onChange={(v) => update("confirmBeforeDelete", v)} id="sec-confirm" />
          </SettingsRow>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" icon={<AlertTriangle size={18} />} delay={0.5}>
          <div className="danger-zone">
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Clear Deployment History</span>
                <span className="danger-desc">Permanently delete all deployment records and containers</span>
              </div>
              <button className="danger-btn" onClick={handleClearDeployments} disabled={deleting}>
                {deleting ? "Clearing..." : "Clear"}
              </button>
            </div>
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Clear Logs</span>
                <span className="danger-desc">Permanently delete all deployment logs</span>
              </div>
              <button className="danger-btn" onClick={handleClearLogs} disabled={deleting}>
                {deleting ? "Clearing..." : "Clear"}
              </button>
            </div>
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Reset Local Preferences</span>
                <span className="danger-desc">Restore all settings to their default values</span>
              </div>
              <button className="danger-btn danger-btn-critical" onClick={handleResetPreferences}>
                Reset
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </motion.div>
  );
}

export default Settings;