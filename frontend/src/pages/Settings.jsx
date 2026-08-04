import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Moon,
  Sun,
  Container,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RotateCcw,
  Settings as SettingsIcon,
} from "lucide-react";
import API from "../services/api";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

// localStorage keys  
const STORAGE_PREFIX = "deployx_settings_";

const DEFAULT_SETTINGS = {
  darkTheme: true,
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
          <p className="settings-subtitle">Appearance &amp; deployment management</p>
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
        {/* Appearance */}
        <SettingsSection title="Appearance" icon={settings.darkTheme ? <Moon size={18} /> : <Sun size={18} />} delay={0}>
          <SettingsRow label="Theme" description="Switch between dark and light theme">
            <div className="theme-switch-group">
              <button
                className={`theme-option ${settings.darkTheme ? "theme-option-active" : ""}`}
                onClick={() => update("darkTheme", true)}
              >
                <Moon size={15} />
                Dark
              </button>
              <button
                className={`theme-option ${!settings.darkTheme ? "theme-option-active" : ""}`}
                onClick={() => update("darkTheme", false)}
              >
                <Sun size={15} />
                Light
              </button>
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* Manage Deployments */}
        <SettingsSection title="Manage Deployments" icon={<Container size={18} />} delay={0.1}>
          <SettingsRow
            label="Start / Stop / Restart"
            description="Manage individual deployments from the Deployments tab"
          >
            <span className="settings-manage-hint">
              <SettingsIcon size={14} />
              Deployments tab
            </span>
          </SettingsRow>
          <SettingsRow
            label="Delete Single Deployment"
            description="Remove an individual deployment from the Deployments tab"
          >
            <span className="settings-manage-hint">
              <Trash2 size={14} />
              Deployments tab
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" icon={<AlertTriangle size={18} />} delay={0.2}>
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
                <RotateCcw size={12} style={{ marginRight: 6 }} />
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
