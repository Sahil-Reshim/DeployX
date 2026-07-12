import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Bell, Shield, User, Code2, Server, Terminal, Key, Sliders, Palette, AlertTriangle, Eye, EyeOff, RefreshCw, XCircle } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

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

function SaveButton({ onClick, text = "Save Changes" }) {
  const [saved, setSaved] = useState(false);
  const handleClick = () => {
    if (onClick) onClick();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button className="settings-save-btn" onClick={handleClick}>
      {saved ? (
        <>
          <Save size={14} />
          Saved!
        </>
      ) : (
        <>
          <Save size={14} />
          {text}
        </>
      )}
    </button>
  );
}

function Settings() {
  const [settings, setSettings] = useState({
    theme: "dark",
    notifications: true,
    emailAlerts: true,
    slackAlerts: false,
    autoDeploy: true,
    healthChecks: true,
    autoRollback: false,
    githubIntegration: true,
    dockerPrune: false,
    jenkinsPolling: true,
    socketReconnect: true,
    logRetention: "30",
    securityScan: true,
    envEncryption: false,
    profileName: "Admin",
    profileEmail: "admin@deployx.io",
  });

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div className="settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="settings-header">
        <div>
          <div className="settings-eyebrow">CONFIGURATION</div>
          <h1 className="settings-title">Project Settings</h1>
          <p className="settings-subtitle">Manage your DeployX platform configuration and preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* General */}
        <SettingsSection title="General" icon={<Sliders size={18} />} delay={0}>
          <SettingsRow label="Theme" description="Choose your preferred theme">
            <select className="settings-select" value={settings.theme} onChange={(e) => update("theme", e.target.value)}>
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Language" description="Interface language">
            <select className="settings-select">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={<Bell size={18} />} delay={0.05}>
          <SettingsRow label="Push Notifications" description="Receive deployment notifications">
            <ToggleSwitch checked={settings.notifications} onChange={(v) => update("notifications", v)} id="notif-push" />
          </SettingsRow>
          <SettingsRow label="Email Alerts" description="Get email alerts for failed deployments">
            <ToggleSwitch checked={settings.emailAlerts} onChange={(v) => update("emailAlerts", v)} id="notif-email" />
          </SettingsRow>
          <SettingsRow label="Slack Integration" description="Send notifications to Slack">
            <ToggleSwitch checked={settings.slackAlerts} onChange={(v) => update("slackAlerts", v)} id="notif-slack" />
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Deployment Preferences */}
        <SettingsSection title="Deployment Preferences" icon={<Server size={18} />} delay={0.1}>
          <SettingsRow label="Auto Deploy" description="Automatically deploy on push to main branch">
            <ToggleSwitch checked={settings.autoDeploy} onChange={(v) => update("autoDeploy", v)} id="deploy-auto" />
          </SettingsRow>
          <SettingsRow label="Health Checks" description="Run health checks after deployment">
            <ToggleSwitch checked={settings.healthChecks} onChange={(v) => update("healthChecks", v)} id="deploy-health" />
          </SettingsRow>
          <SettingsRow label="Auto Rollback" description="Automatically rollback on health check failure">
            <ToggleSwitch checked={settings.autoRollback} onChange={(v) => update("autoRollback", v)} id="deploy-rollback" />
          </SettingsRow>
          <SettingsRow label="Log Retention" description="Number of days to retain deployment logs">
            <select className="settings-select" value={settings.logRetention} onChange={(e) => update("logRetention", e.target.value)}>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* GitHub Settings */}
        <SettingsSection title="GitHub Settings" icon={<Code2 size={18} />} delay={0.15}>
          <SettingsRow label="GitHub Integration" description="Enable GitHub webhook integration">
            <ToggleSwitch checked={settings.githubIntegration} onChange={(v) => update("githubIntegration", v)} id="github-int" />
          </SettingsRow>
          <SettingsRow label="Access Token" description="Personal access token for GitHub API">
            <div className="settings-input-group">
              <input type="password" className="settings-input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" defaultValue="••••••••••••••••" />
              <button className="settings-icon-btn" title="Toggle visibility"><Eye size={16} /></button>
            </div>
          </SettingsRow>
          <SettingsRow label="Default Branch" description="Branch to deploy from by default">
            <select className="settings-select">
              <option value="main">main</option>
              <option value="master">master</option>
              <option value="develop">develop</option>
            </select>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Docker Settings */}
        <SettingsSection title="Docker Settings" icon={<Server size={18} />} delay={0.2}>
          <SettingsRow label="Auto Prune" description="Automatically prune unused Docker images">
            <ToggleSwitch checked={settings.dockerPrune} onChange={(v) => update("dockerPrune", v)} id="docker-prune" />
          </SettingsRow>
          <SettingsRow label="Registry" description="Docker registry URL">
            <input type="text" className="settings-input" placeholder="docker.io" defaultValue="docker.io" />
          </SettingsRow>
          <SettingsRow label="Max Build Time" description="Maximum build timeout in minutes">
            <input type="number" className="settings-input settings-input-short" defaultValue="30" min="5" max="120" />
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Jenkins Settings */}
        <SettingsSection title="Jenkins Settings" icon={<Terminal size={18} />} delay={0.25}>
          <SettingsRow label="Jenkins URL" description="Jenkins server URL">
            <input type="text" className="settings-input" placeholder="http://jenkins:8080" defaultValue="http://jenkins:8080" />
          </SettingsRow>
          <SettingsRow label="Polling Interval" description="How often to poll Jenkins status">
            <select className="settings-select">
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Enable Polling" description="Poll Jenkins for build status updates">
            <ToggleSwitch checked={settings.jenkinsPolling} onChange={(v) => update("jenkinsPolling", v)} id="jenkins-poll" />
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Socket.IO */}
        <SettingsSection title="Socket.IO" icon={<RefreshCw size={18} />} delay={0.3}>
          <SettingsRow label="Auto Reconnect" description="Automatically reconnect on connection loss">
            <ToggleSwitch checked={settings.socketReconnect} onChange={(v) => update("socketReconnect", v)} id="socket-reconnect" />
          </SettingsRow>
          <SettingsRow label="Reconnect Delay" description="Delay between reconnection attempts">
            <select className="settings-select">
              <option value="1">1 second</option>
              <option value="2">2 seconds</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
            </select>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Logs */}
        <SettingsSection title="Logs" icon={<Terminal size={18} />} delay={0.35}>
          <SettingsRow label="Log Level" description="Minimum log level to display">
            <select className="settings-select">
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Max Log Lines" description="Maximum log lines to keep in memory">
            <select className="settings-select">
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="5000">5000</option>
            </select>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security" icon={<Shield size={18} />} delay={0.4}>
          <SettingsRow label="Security Scanning" description="Scan containers for vulnerabilities">
            <ToggleSwitch checked={settings.securityScan} onChange={(v) => update("securityScan", v)} id="sec-scan" />
          </SettingsRow>
          <SettingsRow label="Environment Encryption" description="Encrypt environment variables at rest">
            <ToggleSwitch checked={settings.envEncryption} onChange={(v) => update("envEncryption", v)} id="sec-encrypt" />
          </SettingsRow>
          <SettingsRow label="API Key" description="Your DeployX API key">
            <div className="settings-input-group">
              <input type="password" className="settings-input" defaultValue="dx_api_xxxxxxxxxxxxxxxx" />
              <button className="settings-icon-btn" title="Regenerate"><RefreshCw size={16} /></button>
            </div>
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Environment Variables */}
        <SettingsSection title="Environment Variables" icon={<Key size={18} />} delay={0.45}>
          <div className="env-vars-list">
            <div className="env-var-row">
              <input type="text" className="settings-input env-var-key" placeholder="KEY" defaultValue="NODE_ENV" />
              <input type="password" className="settings-input env-var-value" placeholder="VALUE" defaultValue="production" />
              <button className="settings-icon-btn settings-icon-btn-danger" title="Remove"><XCircle size={16} /></button>
            </div>
            <div className="env-var-row">
              <input type="text" className="settings-input env-var-key" placeholder="KEY" defaultValue="DATABASE_URL" />
              <input type="password" className="settings-input env-var-value" placeholder="VALUE" defaultValue="postgresql://..." />
              <button className="settings-icon-btn settings-icon-btn-danger" title="Remove"><XCircle size={16} /></button>
            </div>
            <div className="env-var-row">
              <input type="text" className="settings-input env-var-key" placeholder="KEY" defaultValue="REDIS_URL" />
              <input type="password" className="settings-input env-var-value" placeholder="VALUE" defaultValue="redis://..." />
              <button className="settings-icon-btn settings-icon-btn-danger" title="Remove"><XCircle size={16} /></button>
            </div>
          </div>
          <button className="settings-add-env-btn">+ Add Variable</button>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Profile */}
        <SettingsSection title="Profile" icon={<User size={18} />} delay={0.5}>
          <SettingsRow label="Display Name" description="Your display name">
            <input type="text" className="settings-input" value={settings.profileName} onChange={(e) => update("profileName", e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Email" description="Your email address">
            <input type="email" className="settings-input" value={settings.profileEmail} onChange={(e) => update("profileEmail", e.target.value)} />
          </SettingsRow>
          <div className="settings-actions">
            <SaveButton />
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" icon={<AlertTriangle size={18} />} delay={0.55}>
          <div className="danger-zone">
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Reset All Settings</span>
                <span className="danger-desc">Restore all settings to their default values</span>
              </div>
              <button className="danger-btn">Reset</button>
            </div>
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Clear All Logs</span>
                <span className="danger-desc">Permanently delete all deployment logs</span>
              </div>
              <button className="danger-btn">Clear</button>
            </div>
            <div className="danger-item">
              <div className="danger-info">
                <span className="danger-title">Delete All Deployments</span>
                <span className="danger-desc">Remove all deployments and containers</span>
              </div>
              <button className="danger-btn danger-btn-critical">Delete All</button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </motion.div>
  );
}

export default Settings;