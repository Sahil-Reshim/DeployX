import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Clock, Activity, Server, CheckCircle, XCircle, BarChart3, Layers, Zap, Container, Image, GitBranch, Cpu, MemoryStick as Memory, Heart, Play, Square, AlertTriangle } from "lucide-react";
import API from "../services/api";
import socket from "../services/socket";

const containerMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};


const fadeSlide = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

function KPICard({ title, value, icon, color, subtitle }) {
  return (
    <motion.div className="analytics-kpi-card" variants={containerMotion} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon" style={{ background: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-trend"><span>{subtitle}</span></div>}
    </motion.div>
  );
}

function ChartCard({ title, children, className }) {
  return (
    <motion.div className={`analytics-chart-card ${className || ""}`} variants={fadeSlide}>
      <h3 className="chart-card-title">{title}</h3>
      <div className="chart-card-body">{children}</div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const FRAMEWORK_COLORS = {
  "Node.js": "#339933",
  "Python": "#3776AB",
  "React": "#61DAFB",
  "Next.js": "#000000",
  "Django": "#092E20",
  "FastAPI": "#009688",
  "Flask": "#000000",
  "Express": "#68A063",
  "Vue": "#4FC08D",
  "Angular": "#DD0031",
  "Svelte": "#FF3E00",
  "Gatsby": "#663399",
  "Nuxt": "#00DC82",
  "NestJS": "#E0234E",
  "Spring": "#6DB33F",
  "Go": "#00ADD8",
  "Rust": "#000000",
};

function getFrameworkColor(framework) {
  return FRAMEWORK_COLORS[framework] || "#8B5CF6";
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  // Handle SQLite format "YYYY-MM-DD HH:MM:SS" by converting to ISO
  let normalized = dateStr;
  if (typeof dateStr === "string" && dateStr.includes(" ") && !dateStr.includes("T")) {
    normalized = dateStr.replace(" ", "T");
  }
  const date = new Date(normalized + (normalized.includes("Z") || normalized.includes("+") ? "" : "Z"));
  if (isNaN(date.getTime())) return "—";
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [dockerStats, setDockerStats] = useState(null);
  const [allMetrics, setAllMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchIntervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, dockerRes, metricsRes] = await Promise.allSettled([
        API.get("/api/analytics"),
        API.get("/api/docker/stats"),
        API.get("/api/metrics/all"),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value.data?.success) {
        setAnalytics(analyticsRes.value.data.analytics);
      }
      if (dockerRes.status === "fulfilled" && dockerRes.value.data?.success) {
        setDockerStats(dockerRes.value.data.stats);
      }
      if (metricsRes.status === "fulfilled" && metricsRes.value.data?.success) {
        setAllMetrics(metricsRes.value.data.metrics || []);
      }
      setError(null);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchIntervalRef.current = setInterval(fetchData, 10000);
    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [fetchData]);

  // Listen for socket updates to refresh data
  useEffect(() => {
    const handleUpdate = () => {
      fetchData();
    };
    socket.on("deployment_update", handleUpdate);
    socket.on("deployment_started", handleUpdate);
    socket.on("deployment_stopped", handleUpdate);
    return () => {
      socket.off("deployment_update", handleUpdate);
      socket.off("deployment_started", handleUpdate);
      socket.off("deployment_stopped", handleUpdate);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: "60vh" }}>
        <div className="loader-ring">
          <div className="loader-ring-outer"></div>
          <div className="loader-ring-inner"></div>
        </div>
        <p className="loader-text" style={{ marginTop: "16px" }}>Loading Analytics...</p>
      </div>
    );
  }

  const a = analytics || {};
  const ds = dockerStats || {};
  const total = a.total || 0;
  const successful = a.successful || 0;
  const failed = a.failed || 0;
  const running = a.running || 0;
  const queued = a.queued || 0;
  const stopped = a.stopped || 0;
  const successRate = a.success_rate || 0;
  const avgDeployTime = a.avg_deployment_time || 0;
  const avgBuildTime = a.avg_build_time || 0;
  const healthCount = a.avg_health_check_count || 0;

  // Framework distribution for pie chart
  const frameworkData = (a.framework_distribution || []).map((fw) => ({
    name: fw.framework,
    value: fw.count,
    color: getFrameworkColor(fw.framework),
  }));

  // Deployments per day for trend chart
  const perDayData = (a.deployments_per_day || []).map((d) => ({
    day: d.day ? d.day.split("-").slice(1).join("/") : d.day,
    deployments: d.count,
  }));

  // Success vs failure for pie
  const successFailData = [
    { name: "Successful", value: successful || 1, color: "#22C55E" },
    { name: "Failed", value: failed || 0, color: "#DC2626" },
  ];

  // CPU/RAM trend from all metrics
  const cpuTrendData = allMetrics.slice(-30).map((m) => {
    let timeStr = "";
    if (m.created_at) {
      let normalized = m.created_at;
      if (typeof normalized === "string" && normalized.includes(" ") && !normalized.includes("T")) {
        normalized = normalized.replace(" ", "T");
      }
      const dt = new Date(normalized + (normalized.includes("Z") || normalized.includes("+") ? "" : "Z"));
      if (!isNaN(dt.getTime())) {
        timeStr = dt.toLocaleTimeString();
      }
    }
    return {
      time: timeStr,
      cpu: Number(m.cpu || 0).toFixed(1),
      ram: Number(m.ram || 0).toFixed(1),
    };
  });

  // Latest deployments for activity
  const latestDeployments = a.latest_deployments || [];

  // Deployment durations
  const durations = a.deployment_durations || [];

  // Container status distribution
  const containerStatusData = [
    { name: "Running", value: ds.running_containers || 0, color: "#22C55E" },
    { name: "Stopped", value: ds.stopped_containers || 0, color: "#EF4444" },
  ];

  return (
    <motion.div className="analytics-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="analytics-header">
        <div>
          <div className="analytics-eyebrow">DEPLOYX INSIGHTS</div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">Comprehensive metrics and insights across all deployments</p>
        </div>
        <div className="analytics-live-badge">
          <span className="live-badge-dot"></span>
          {error ? "ERROR" : "LIVE"}
        </div>
      </div>

       {/* KPI Cards */}
       <motion.div className="analytics-kpi-grid" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} initial="initial" animate="animate">
         <KPICard title="Total Deployments" value={total} icon={<Layers size={18} />} color="#DC2626" subtitle={`${queued} queued`} />
         <KPICard title="Successful" value={successful} icon={<CheckCircle size={18} />} color="#22C55E" subtitle={`${successRate}% success rate`} />
         <KPICard title="Failed" value={failed} icon={<XCircle size={18} />} color="#EF4444" subtitle={`${total > 0 ? ((failed / total) * 100).toFixed(1) : 0}% failure rate`} />
         <KPICard title="Running Deployments" value={running} icon={<Play size={18} />} color="#38BDF8" subtitle={`${stopped} stopped`} />
         <KPICard title="Avg Deployment Time" value={formatDuration(avgDeployTime)} icon={<Clock size={18} />} color="#8B5CF6" subtitle="From queue to live" />
         <KPICard title="Avg Build Time" value={formatDuration(avgBuildTime)} icon={<Zap size={18} />} color="#EAB308" subtitle="Jenkins pipeline" />
       </motion.div>

      {/* Charts Row 1 - Deployment Trend + Success vs Failure */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        <ChartCard title="Deployment Trend (Last 30 Days)">
          {perDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={perDayData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="deployments" stroke="#DC2626" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: "#DC2626", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#DC2626", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-state">
              <BarChart3 size={32} />
              <p>No deployment data yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Success vs Failure Rate">
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={successFailData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {successFailData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span style={{ color: "#A1A1AA", fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-center-stats">
                <span className="center-stat-value">{successRate}%</span>
                <span className="center-stat-label">Success Rate</span>
              </div>
            </>
          ) : (
            <div className="empty-chart-state">
              <BarChart3 size={32} />
              <p>No deployment data yet</p>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Charts Row 2 - Framework Distribution + Deployment Duration */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        <ChartCard title="Framework Distribution">
          {frameworkData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={frameworkData} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} strokeWidth={0}>
                  {frameworkData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-state">
              <GitBranch size={32} />
              <p>No framework data yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Most Used Framework">
          {a.most_used_framework ? (
            <div className="most-used-framework">
              <div className="framework-big-icon" style={{ color: getFrameworkColor(a.most_used_framework.framework) }}>
                <GitBranch size={48} />
              </div>
              <h2 className="framework-big-name">{a.most_used_framework.framework}</h2>
              <p className="framework-big-count">{a.most_used_framework.count} deployments</p>
              <div className="framework-big-bar">
                <div className="framework-big-fill" style={{ width: `${(a.most_used_framework.count / total) * 100}%`, background: getFrameworkColor(a.most_used_framework.framework) }}></div>
              </div>
              <p className="framework-big-percent">{total > 0 ? ((a.most_used_framework.count / total) * 100).toFixed(1) : 0}% of all deployments</p>
            </div>
          ) : (
            <div className="empty-chart-state">
              <GitBranch size={32} />
              <p>No framework data yet</p>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Charts Row 3 - CPU + RAM Trend */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        <ChartCard title="CPU Usage Trend">
          {cpuTrendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cpuTrendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: "#A1A1AA", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="cpu" stroke="#DC2626" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#DC2626" }} name="CPU %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-state">
              <Cpu size={32} />
              <p>Waiting for CPU metrics...</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="RAM Usage Trend">
          {cpuTrendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cpuTrendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: "#A1A1AA", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="ram" stroke="#38BDF8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#38BDF8" }} name="RAM %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-state">
              <Memory size={32} />
              <p>Waiting for RAM metrics...</p>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Charts Row 4 - Container Status + Docker Image Stats */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        <ChartCard title="Container Status Distribution">
          {(ds.running_containers || 0) + (ds.stopped_containers || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={containerStatusData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {containerStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: "#A1A1AA", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-state">
              <Container size={32} />
              <p>No container data available</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Docker Image Statistics">
          <div className="docker-stats-grid">
            <div className="docker-stat-item">
              <div className="docker-stat-value">{ds.total_images || 0}</div>
              <div className="docker-stat-label">Total Images</div>
            </div>
            <div className="docker-stat-item">
              <div className="docker-stat-value">{ds.total_containers || 0}</div>
              <div className="docker-stat-label">Total Containers</div>
            </div>
            <div className="docker-stat-item">
              <div className="docker-stat-value" style={{ color: "var(--green)" }}>{ds.running_containers || 0}</div>
              <div className="docker-stat-label">Running</div>
            </div>
            <div className="docker-stat-item">
              <div className="docker-stat-value" style={{ color: "var(--red-status)" }}>{ds.stopped_containers || 0}</div>
              <div className="docker-stat-label">Stopped</div>
            </div>
          </div>
          {(ds.containers || []).length > 0 && (
            <div className="docker-container-list">
              <div className="docker-container-header">
                <span>Name</span>
                <span>Status</span>
              </div>
              {(ds.containers || []).slice(0, 5).map((c, i) => (
                <div className="docker-container-row" key={i}>
                  <span className="docker-container-name">{c.name}</span>
                  <span className={`docker-container-status ${c.status === "running" ? "status-running" : "status-stopped"}`}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Latest Activity Timeline */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        <ChartCard title="Latest Deployment Timeline">
          {latestDeployments.length > 0 ? (
            <div className="timeline-list">
              {latestDeployments.map((item, i) => {
                const status = item.status || "queued";
                const statusClass = status === "running" || status === "live" ? "success" : status === "failed" ? "failed" : status === "stopped" ? "warning" : "info";
                return (
                  <div className={`timeline-item ${statusClass}`} key={i}>
                    <div className="timeline-dot-wrapper">
                      <div className="timeline-dot"></div>
                      {i < latestDeployments.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-event">{item.repo_name_display || item.repo_url || `Deployment #${item.id}`}</span>
                      <span className="timeline-time">
                        {item.framework && `${item.framework} · `}
                        {formatTimeAgo(item.created_at)}
                        {item.url && ` · Live`}
                      </span>
                    </div>
                    <div className={`status-pill ${status}`}>{item.state_label || status}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-chart-state">
              <Activity size={32} />
              <p>No deployment activity yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Recent Activity">
          {latestDeployments.length > 0 ? (
            <div className="recent-builds-list">
              <div className="builds-table-header analytics-recent">
                <span>Repository</span>
                <span>Framework</span>
                <span>Status</span>
                <span>Started</span>
                <span>Con.</span>
                <span>URL</span>
              </div>
              {latestDeployments.map((build, i) => (
                <div className="build-row analytics-recent" key={i}>
                  <span className="build-repo" title={build.repo_url}>{build.repo_name_display || `#${build.id}`}</span>
                  <span className="build-framework">{build.framework || "—"}</span>
                  <span className={`build-status ${build.status || "queued"}`}>{build.state_label || build.status || "Queued"}</span>
                  <span className="build-duration">{formatTimeAgo(build.created_at)}</span>
                  <span className="build-container">{build.container_id ? "✓" : "—"}</span>
                  <span className="build-url">{build.url ? "✓" : "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chart-state">
              <Activity size={32} />
              <p>No recent activity</p>
            </div>
          )}
        </ChartCard>
      </motion.div>
    </motion.div>
  );
}

export default Analytics;
