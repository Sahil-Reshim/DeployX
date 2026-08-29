import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useDeploymentSocketContext } from "../context/DeploymentSocketContext";

function LogsViewer({ deploymentId: deploymentIdProp }) {
  const socketContext = useDeploymentSocketContext();
  const deploymentId = deploymentIdProp ?? socketContext?.statusData?.deployment_id;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const logsBoxRef = useRef(null);
  const liveLogs = socketContext?.logs || [];

  const getLogType = (log) => {
    if (!log) return "info";
    if (typeof log === "string") {
      const text = log.toLowerCase();
      if (text.includes("error") || text.includes("failed") || text.includes("exception")) return "error";
      if (text.includes("success") || text.includes("live") || text.includes("running") || text.includes("completed")) return "success";
      if (text.includes("warning") || text.includes("warn")) return "warn";
      return "info";
    }
    return log.level || "info";
  };

  useEffect(() => {
    async function loadLogs() {
      if (!deploymentId) {
        setLogs([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await API.get(`/deployments/${deploymentId}/logs`);
        const buildLogs = response.data?.build_logs || [];
        const containerLogs = response.data?.container_logs || [];
        const normalize = (entry) => {
          if (!entry) return null;
          if (typeof entry === "string") {
            return { message: entry, level: getLogType(entry), timestamp: null };
          }
          return {
            message: entry.message ?? entry.msg ?? String(entry),
            level: entry.level ?? getLogType(entry),
            timestamp: entry.timestamp ?? null,
          };
        };
        const merged = [...buildLogs.map(normalize).filter(Boolean), ...containerLogs.map(normalize).filter(Boolean)];
        setLogs(merged);
      } catch (loadError) {
        console.error("Failed loading logs:", loadError);
        setError("Failed to load deployment logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [deploymentId]);

  useEffect(() => {
    if (!liveLogs?.length) return;
    setLogs((prev) => {
      const next = [...prev];
      liveLogs.forEach((logLine) => {
        let entry = null;
        if (!logLine) return;
        if (typeof logLine === "string") {
          entry = { message: logLine, level: getLogType(logLine), timestamp: null };
        } else {
          entry = {
            message: logLine.message ?? logLine.msg ?? String(logLine),
            level: logLine.level ?? getLogType(logLine),
            timestamp: logLine.timestamp ?? null,
          };
        }
        const exists = next.some((l) => l.message === entry.message && l.timestamp === entry.timestamp);
        if (!exists) next.push(entry);
      });
      return next;
    });
  }, [liveLogs]);

  useEffect(() => {
    if (logsBoxRef.current) {
      logsBoxRef.current.scrollTop = logsBoxRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const copyLogs = async () => {
    try {
      const text = logs
        .map((l, i) => {
          const time = l.timestamp ? ` [${new Date(l.timestamp).toLocaleString()}]` : "";
          return `${String(i + 1).padStart(3, "0")} ${l.level.toUpperCase()}${time} - ${l.message}`;
        })
        .join("\n");
      await navigator.clipboard.writeText(text);
    } catch (copyError) {
      console.error("Failed to copy logs", copyError);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (!l) return false;
    if (levelFilter !== "all" && (l.level || "info") !== levelFilter) return false;
    if (search) {
      const txt = `${l.message} ${l.level} ${l.timestamp || ""}`.toLowerCase();
      return txt.includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="logs-container">
      <div className="logs-header">
        <div className="logs-header-left">
          <div className="logs-dots">
            <span className="logs-dot red"></span>
            <span className="logs-dot yellow"></span>
            <span className="logs-dot green"></span>
          </div>
          <div className="logs-title">deployx-runtime.logs</div>
        </div>
        <div className="logs-status">
          <span className="logs-status-dot"></span>
          LIVE STREAM
        </div>
      </div>

      <div className="logs-toolbar">
        <div className="logs-toolbar-left">
          <button className="logs-tool-btn" onClick={copyLogs} type="button">Copy</button>
          <button className="logs-tool-btn" onClick={clearLogs} type="button">Clear</button>
        </div>
        <div className="logs-toolbar-center">
          <input className="logs-search" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="logs-filter" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="logs-count">{filteredLogs.length} ENTRIES</div>
      </div>

      {loading ? (
        <div className="logs-loading">
          <div className="terminal-loader"></div>
          <p>Loading deployment logs...</p>
        </div>
      ) : (
        <div className="logs-box" ref={logsBoxRef}>
          {error ? (
            <div className="logs-empty"><p>{error}</p></div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty"><p>Waiting for logs...</p></div>
          ) : (
            filteredLogs.map((log, index) => {
              const type = getLogType(log);
              const timeLabel = log.timestamp ? new Date(log.timestamp).toLocaleString() : "-";
              return (
                <div key={`${index}-${log?.message?.slice(0, 24)}`} className={`log-line ${type}`}>
                  <div className="log-number">{String(index + 1).padStart(3, "0")}</div>
                  <div className={`log-tag ${type}`}>{type}</div>
                  <div className="log-message">
                    <div className="log-meta">{timeLabel}</div>
                    <div className="log-text">{log.message}</div>
                    {index === filteredLogs.length - 1 && <span className="terminal-cursor"></span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default LogsViewer;