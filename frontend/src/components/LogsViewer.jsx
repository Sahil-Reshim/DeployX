import { useEffect, useRef, useState } from "react";

const INITIAL_LOGS = [
  { time: "00:00:01", tag: "system", msg: "DeployX engine initialized" },
  { time: "00:00:02", tag: "docker", msg: "Docker runtime connected" },
  { time: "00:00:03", tag: "info",   msg: "Listening for deployment events..." },
  { time: "00:00:04", tag: "info",   msg: "Waiting for new deployments..." },
];

const STREAM_LOGS = [
  { tag: "info",    msg: "Cloning repository..." },
  { tag: "info",    msg: "Detecting framework..." },
  { tag: "docker",  msg: "Building Docker image..." },
  { tag: "docker",  msg: "Installing dependencies..." },
  { tag: "info",    msg: "Running build command..." },
  { tag: "docker",  msg: "Container created successfully" },
  { tag: "success", msg: "Deployment live 🚀" },
];

let streamIndex = 0;

function pad(n) {
  return String(n).padStart(2, "0");
}

function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function LogsViewer() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const boxRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const entry = STREAM_LOGS[streamIndex % STREAM_LOGS.length];
      streamIndex++;
      setLogs((prev) => [
        ...prev,
        { time: nowTime(), tag: entry.tag, msg: entry.msg },
      ]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="logs-container">
      <div className="logs-header">
        <div className="logs-header-left">
          <div className="logs-dots">
            <span className="logs-dot red"></span>
            <span className="logs-dot yellow"></span>
            <span className="logs-dot green"></span>
          </div>
          <span className="logs-title">deployx — deployment-engine</span>
        </div>
        <div className="logs-status">
          <span className="logs-status-dot"></span>
          live
        </div>
      </div>

      <div className="logs-box" ref={boxRef}>
        {logs.map((line, i) => (
          <div className="log-line" key={i}>
            <span className="log-timestamp">{line.time}</span>
            <span className={`log-tag ${line.tag}`}>[{line.tag.toUpperCase()}]</span>
            <span className={`log-message ${line.tag === "success" ? "success-msg" : line.tag === "error" ? "error-msg" : ""}`}>
              {line.msg}
            </span>
          </div>
        ))}
        <div className="log-line">
          <span className="log-timestamp">{nowTime()}</span>
          <span className="log-tag system">[SYSTEM]</span>
          <span className="log-message">
            <span className="log-cursor"></span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default LogsViewer;