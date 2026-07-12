import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Clock, Activity, Server, CheckCircle, XCircle, BarChart3, GitBranch, Layers, Zap } from "lucide-react";

const dummyDeploymentTrend = [
  { month: "Jan", deployments: 8 }, { month: "Feb", deployments: 12 }, { month: "Mar", deployments: 15 },
  { month: "Apr", deployments: 10 }, { month: "May", deployments: 18 }, { month: "Jun", deployments: 22 },
  { month: "Jul", deployments: 14 }, { month: "Aug", deployments: 20 }, { month: "Sep", deployments: 25 },
  { month: "Oct", deployments: 19 }, { month: "Nov", deployments: 28 }, { month: "Dec", deployments: 32 },
];

const successFailData = [
  { name: "Successful", value: 187, color: "#22C55E" },
  { name: "Failed", value: 23, color: "#DC2626" },
];

const frameworkDistribution = [
  { name: "Node.js", value: 42, color: "#339933" },
  { name: "Python", value: 28, color: "#3776AB" },
  { name: "React", value: 18, color: "#61DAFB" },
  { name: "Next.js", value: 25, color: "#000000" },
  { name: "Django", value: 15, color: "#092E20" },
  { name: "FastAPI", value: 12, color: "#009688" },
];

const durationData = [
  { name: "Node.js", time: 45 }, { name: "Python", time: 62 }, { name: "React", time: 38 },
  { name: "Next.js", time: 52 }, { name: "Django", time: 78 }, { name: "FastAPI", time: 35 },
];

const topRepos = [
  { repo: "user/auth-service", count: 24, lang: "Node.js" },
  { repo: "org/api-gateway", count: 18, lang: "Python" },
  { repo: "team/frontend-app", count: 15, lang: "React" },
  { repo: "company/backend-core", count: 12, lang: "FastAPI" },
  { repo: "org/ml-service", count: 10, lang: "Python" },
];

const timelineData = [
  { time: "2 min ago", event: "Deployed user/auth-service", status: "success" },
  { time: "5 min ago", event: "Build completed for api-gateway", status: "success" },
  { time: "12 min ago", event: "Container restart on ml-service", status: "warning" },
  { time: "18 min ago", event: "Deployment failed: frontend-app", status: "failed" },
  { time: "25 min ago", event: "Auto-scaling triggered", status: "info" },
  { time: "32 min ago", event: "Deployed team/frontend-app", status: "success" },
];

const runtimeUsage = [
  { time: "00:00", cpu: 45, ram: 62 }, { time: "04:00", cpu: 38, ram: 55 },
  { time: "08:00", cpu: 72, ram: 78 }, { time: "12:00", cpu: 85, ram: 82 },
  { time: "16:00", cpu: 68, ram: 74 }, { time: "20:00", cpu: 52, ram: 65 },
  { time: "23:59", cpu: 48, ram: 60 },
];

const recentBuilds = [
  { id: "#284", repo: "auth-service", status: "success", time: "2m ago", duration: "45s" },
  { id: "#283", repo: "api-gateway", status: "success", time: "5m ago", duration: "1m 12s" },
  { id: "#282", repo: "frontend-app", status: "failed", time: "18m ago", duration: "2m 30s" },
  { id: "#281", repo: "backend-core", status: "success", time: "25m ago", duration: "52s" },
  { id: "#280", repo: "ml-service", status: "running", time: "32m ago", duration: "—" },
];

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

function KPICard({ title, value, icon, trend, color }) {
  return (
    <motion.div className="analytics-kpi-card" variants={containerMotion} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon" style={{ background: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {trend && (
        <div className={`kpi-trend ${trend.direction === "up" ? "trend-up" : "trend-down"}`}>
          {trend.direction === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.percentage}% vs last month</span>
        </div>
      )}
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

function Analytics() {
  const totalDeployments = 210;
  const successfulDeployments = 187;
  const failedDeployments = 23;
  const successRate = "89.0%";
  const avgDeploymentTime = "52s";
  const activeContainers = 14;

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
          LIVE
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div className="analytics-kpi-grid" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} initial="initial" animate="animate">
        <KPICard title="Total Deployments" value={totalDeployments} icon={<Layers size={18} />} color="#DC2626" trend={{ direction: "up", percentage: 12 }} />
        <KPICard title="Successful" value={successfulDeployments} icon={<CheckCircle size={18} />} color="#22C55E" trend={{ direction: "up", percentage: 8 }} />
        <KPICard title="Failed" value={failedDeployments} icon={<XCircle size={18} />} color="#EF4444" trend={{ direction: "down", percentage: 5 }} />
        <KPICard title="Success Rate" value={successRate} icon={<BarChart3 size={18} />} color="#38BDF8" trend={{ direction: "up", percentage: 3 }} />
        <KPICard title="Avg. Deployment Time" value={avgDeploymentTime} icon={<Clock size={18} />} color="#8B5CF6" trend={{ direction: "down", percentage: 7 }} />
        <KPICard title="Active Containers" value={activeContainers} icon={<Server size={18} />} color="#22C55E" trend={{ direction: "up", percentage: 15 }} />
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        {/* Deployment Trend */}
        <ChartCard title="Deployment Trend (Monthly)">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dummyDeploymentTrend}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="deployments" stroke="#DC2626" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: "#DC2626", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#DC2626", strokeWidth: 2, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Success vs Failure */}
        <ChartCard title="Success vs Failure Rate">
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
            <span className="center-stat-value">89%</span>
            <span className="center-stat-label">Success Rate</span>
          </div>
        </ChartCard>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        {/* Framework Distribution */}
        <ChartCard title="Framework Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={frameworkDistribution} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} strokeWidth={0}>
                {frameworkDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Deployment Duration */}
        <ChartCard title="Avg Deployment Duration by Framework">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={durationData} barSize={30}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#A1A1AA", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="time" radius={[6, 6, 0, 0]} strokeWidth={0}>
                {durationData.map((entry, index) => (
                  <Cell key={index} fill={entry.time > 60 ? "#DC2626" : entry.time > 45 ? "#EAB308" : "#22C55E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Charts Row 3 */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        {/* Top Repositories */}
        <ChartCard title="Most Deployed Repositories">
          <div className="top-repos-list">
            {topRepos.map((item, i) => (
              <div className="top-repo-item" key={i}>
                <div className="top-repo-rank">#{i + 1}</div>
                <div className="top-repo-info">
                  <span className="top-repo-name">{item.repo}</span>
                  <span className="top-repo-lang">{item.lang}</span>
                </div>
                <div className="top-repo-count">{item.count} deploys</div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Latest Activity Timeline */}
        <ChartCard title="Latest Activity Timeline">
          <div className="timeline-list">
            {timelineData.map((item, i) => (
              <div className={`timeline-item ${item.status}`} key={i}>
                <div className="timeline-dot-wrapper">
                  <div className="timeline-dot"></div>
                  {i < timelineData.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-content">
                  <span className="timeline-event">{item.event}</span>
                  <span className="timeline-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </motion.div>

      {/* Charts Row 4 */}
      <motion.div className="analytics-charts-row" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} initial="initial" animate="animate">
        {/* Runtime Usage */}
        <ChartCard title="Runtime Resource Usage (24h)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={runtimeUsage}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="cpu" stroke="#DC2626" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#DC2626" }} name="CPU %" />
              <Line type="monotone" dataKey="ram" stroke="#38BDF8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#38BDF8" }} name="RAM %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Builds */}
        <ChartCard title="Recent Builds">
          <div className="recent-builds-list">
            <div className="builds-table-header">
              <span>Build</span>
              <span>Repository</span>
              <span>Status</span>
              <span>Duration</span>
            </div>
            {recentBuilds.map((build, i) => (
              <div className="build-row" key={i}>
                <span className="build-id">{build.id}</span>
                <span className="build-repo">{build.repo}</span>
                <span className={`build-status ${build.status}`}>{build.status}</span>
                <span className="build-duration">{build.duration}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </motion.div>
    </motion.div>
  );
}

export default Analytics;