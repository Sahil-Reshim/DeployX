import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";
import {
  Rocket, GitBranch, Box, Activity, ShieldCheck, Zap, Server, Terminal, Globe,
  Cpu, Layers, ArrowRight, ChevronUp, Check, Database, Network,
  Workflow, Radio, FileCode2, Search,
} from "lucide-react";
import "./LandingPage.css";

/* Brand icon not shipped by lucide-react — inline GitHub mark */
const Github = ({ size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   DeployX — Scroll-driven deployment storytelling landing page
   Palette: existing app tokens (dark / cherry red / electric blue)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Fixed background (grid + orbs + stars, click-transparent) ── */
const fxCubes = [
  { left: "8%",  top: "22%", size: 44, dur: 11, depth: "120px" },
  { left: "20%", top: "74%", size: 26, dur: 13, depth: "-70px" },
  { left: "80%", top: "18%", size: 36, dur: 10, depth: "100px" },
  { left: "88%", top: "62%", size: 50, dur: 14, depth: "150px" },
  { left: "50%", top: "8%",  size: 18, dur: 12, depth: "-90px" },
  { left: "38%", top: "84%", size: 28, dur: 15, depth: "60px" },
];

const Background = () => (
  <div className="dx-bg" aria-hidden="true">
    <div className="dx-orb dx-orb-red" />
    <div className="dx-orb dx-orb-blue" />
    <div className="dx-stars">
      {Array.from({ length: 60 }).map((_, i) => (
        <span key={i} className="dx-star" style={{
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
          animationDelay: `${Math.random() * 6}s`, animationDuration: `${Math.random() * 8 + 4}s`,
        }} />
      ))}
    </div>
    <div className="dx-floor" />
    {fxCubes.map((c, i) => (
      <span key={i} className="dx-cube" style={{
        left: c.left, top: c.top, width: c.size, height: c.size,
        animationDuration: `${c.dur}s`, "--depth": c.depth,
      }} />
    ))}
    <div className="dx-vignette" />
  </div>
);

/* ─── Cinematic scroll progress bar ─────────────────────────── */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });
  return <motion.div className="dx-progress" style={{ scaleX }} aria-hidden="true" />;
};

/* ─── Navbar ─────────────────────────────────────────────────── */
const links = [
  { label: "Your Code", href: "#code" },
  { label: "Build", href: "#build" },
  { label: "Kubernetes", href: "#kubernetes" },
  { label: "Monitoring", href: "#monitoring" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`dx-nav ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="dx-nav-inner">
        <div className="dx-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="app-logo">
            <span className="app-logo-badge">
              <img src="/logo.png" alt="DeployX" className="app-logo-img" />
            </span>
            <span className="app-logo-text">Deploy<span>X</span></span>
          </span>
        </div>

        <div className={`dx-nav-links ${open ? "open" : ""}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="dx-nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
<motion.a
            href="/dashboard"
            className="dx3-nav-cta"
            onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
          >
            Launch App
          </motion.a>
        </div>

        <button
          type="button"
          className={`dx-hamburger ${open ? "active" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>
    </motion.nav>
  );
};

/* ─── SECTION 1 — Hero (parallax + pipeline strip) ───────────── */
const heroChain = ["GitHub", "DeployX", "Docker", "Jenkins", "Kubernetes", "Live App"];

const Hero = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.9]);

  const scrollToHow = () => {
    document.getElementById("code")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
<section className="dx3-hero">
      <motion.div className="dx3-hero-glow-bg" style={{ y: yBg }} />

      <div className="dx3-hero-grid">
        <motion.div className="dx3-hero-left" style={{ y: yTitle, opacity: fade }}>
          <motion.div
            className="dx3-hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="dx3-pulse" /> Modern DevOps Deployment Platform
          </motion.div>

          <motion.h1
            className="dx3-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            Deploy any repo.
            <br />
            <span className="dx3-gradient-text">Go live in seconds.</span>
          </motion.h1>

          <motion.p
            className="dx3-hero-sub"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Deploy Flask, Django, FastAPI, React, Next.js & more using
            <b> Docker + Jenkins </b> — with real-time logs, live metrics and one-click rollback.
          </motion.p>

          <motion.div
            className="dx3-hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <motion.a
              href="/dashboard"
              className="dx3-btn dx3-btn-primary"
              onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 44px rgba(220,38,38,0.6)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="#pipeline"
              className="dx3-btn dx3-btn-ghost"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              See how it works
            </motion.a>
          </motion.div>

          <div className="dx3-hero-stats">
            <div className="dx3-hero-stat"><b>27s</b><span>avg deploy</span></div>
            <div className="dx3-hero-stat"><b>97%</b><span>success rate</span></div>
            <div className="dx3-hero-stat"><b>1.2k+</b><span>deployments</span></div>
          </div>
        </motion.div>

        <motion.h1 className="dx-hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
          Deploy Smarter.
          <br />
          <span className="dx-gradient-text">Scale Faster.</span>
          <br />
          Ship Effortlessly.
        </motion.h1>

        <motion.p className="dx-hero-sub" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
          An automated DevOps deployment platform powered by{" "}
          <b>Docker</b>, <b>Jenkins</b> and <b>Kubernetes</b> — from GitHub push
          to a live application, with real-time logs and monitoring.
        </motion.p>

        <motion.div className="dx-hero-actions" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}>
          {/* Get Started — real routing via react-router navigate("/dashboard") */}
          <button
            type="button"
            className="dx-btn dx-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Get Started <ArrowRight size={18} />
          </button>
          <button
            type="button"
            className="dx-btn dx-btn-ghost"
            onClick={scrollToHow}
          >
            See How It Works
          </button>
        </motion.div>

        <motion.div
          className="dx-hero-chain"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          aria-label="Deployment pipeline"
        >
          {heroChain.map((c, i) => (
            <span key={c} className="dx-chain-item">
              <span className="dx-chain-chip">{c}</span>
              {i < heroChain.length - 1 && <span className="dx-chain-arrow">↓</span>}
            </span>
          ))}
        </motion.div>

        <motion.div className="dx-hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.7 }}>
          <div className="dx-hero-stat"><b>27s</b><span>avg deploy</span></div>
          <div className="dx-hero-stat"><b>3</b><span>kubernetes pods</span></div>
          <div className="dx-hero-stat"><b>100%</b><span>pipeline automated</span></div>
        </motion.div>
      </div>

      <motion.div className="dx-scroll-hint" style={{ opacity: fade }} aria-hidden="true">
        <span>scroll</span>
        <ChevronUp className="dx-hint-chevron" size={20} />
      </motion.div>
    </section>
  );
};

/* ─── Shared section header ──────────────────────────────────── */
const SectionHeader = ({ eyebrow, title, sub }) => (
  <motion.div
    className="dx-section-head"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6 }}
  >
    <span className="dx-eyebrow">{eyebrow}</span>
    <h2 className="dx-section-title">{title}</h2>
    <p className="dx-section-sub">{sub}</p>
  </motion.div>
);

/* ─── SECTION 2 — Your Code (GitHub → DeployX) ───────────────── */
const repoFiles = ["app.py", "Dockerfile", "requirements.txt", "jenkins/Jenkinsfile", "K8s/ingress.yml"];

const YourCode = () => (
  <section id="code" className="dx-section">
    <SectionHeader
      eyebrow="Step 01 — Your Code"
      title="It starts with a push"
      sub="Connect your GitHub repository and let DeployX handle the deployment."
    />
    <div className="dx-flow">
      <motion.div
        className="dx-glass dx-repo-card"
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="dx-repo-head">
          <Github size={18} />
          <span>tanvishinde017 / DeployX</span>
          <span className="dx-branch"><GitBranch size={13} /> main</span>
        </div>
        <ul className="dx-repo-files">
          {repoFiles.map((f, i) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            >
              <FileCode2 size={14} /> {f}
            </motion.li>
          ))}
        </ul>
        <div className="dx-repo-commit"><GitBranch size={13} /> git push origin main</div>
      </motion.div>

      {/* animated data flow — code elements streaming toward DeployX */}
      <div className="dx-flow-line" aria-hidden="true">
        <span className="dx-flow-dot" style={{ animationDelay: "0s" }} />
        <span className="dx-flow-dot" style={{ animationDelay: "0.8s" }} />
        <span className="dx-flow-dot" style={{ animationDelay: "1.6s" }} />
      </div>

      <motion.div
        className="dx-glass dx-deployx-node"
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <span className="app-logo-badge dx-node-logo"><img src="/logo.png" alt="DeployX" /></span>
        <h3>DeployX</h3>
        <p>Push your application —<br />DeployX takes it from here.</p>
        <span className="dx-node-pulse" />
      </motion.div>
    </div>
  </section>
);

/* ─── SECTION 3 — Build (GitHub → DeployX → Docker → Jenkins) ── */
const buildStages = [
  { Icon: Github, title: "Clone Repository", desc: "DeployX pulls your latest commit from GitHub." },
  { Icon: Search, title: "Detect Framework", desc: "Flask, Django, Node, React — auto-detected." },
  { Icon: FileCode2, title: "Generate Dockerfile", desc: "A production-ready container spec is prepared." },
  { Icon: Box, title: "Build Image", desc: "Docker layers build and cache for fast rebuilds." },
  { Icon: Workflow, title: "Run CI Pipeline", desc: "Jenkins tests, builds and packs your app." },
];

const Build = () => {
  const reduce = useReducedMotion();
  return (
    <section id="build" className="dx-section dx-section-alt">
      <SectionHeader
        eyebrow="Step 02 — Build"
        title="From source to image, automatically"
        sub="Every stage activates as your code travels down the pipeline."
      />
      <div className="dx-build-grid">
        <ol className="dx-stages">
          {buildStages.map((s, i) => (
            <motion.li
              key={s.title}
              className="dx-stage"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <span className="dx-stage-num">0{i + 1}</span>
              <span className="dx-stage-icon"><s.Icon size={20} /></span>
              <span className="dx-stage-body">
                <b>{s.title}</b>
                <p>{s.desc}</p>
              </span>
              <motion.span
                className="dx-stage-check"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.35 + i * 0.12, type: "spring", stiffness: 300 }}
              >
                <Check size={13} />
              </motion.span>
              {i < buildStages.length - 1 && <span className="dx-stage-line" aria-hidden="true" />}
            </motion.li>
          ))}
        </ol>

        <div className="dx-build-visual">
          <motion.div
            className="dx-docker-scene"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <div className={`dx-docker-cube ${reduce ? "static" : ""}`}>
              <span className="face front"><Box size={30} /></span>
              <span className="face back"><Box size={30} /></span>
              <span className="face right"><Box size={30} /></span>
              <span className="face left"><Box size={30} /></span>
              <span className="face top"><Box size={30} /></span>
              <span className="face bottom"><Box size={30} /></span>
            </div>
            <p className="dx-visual-caption"><Box size={14} /> Docker image · deployx:latest</p>
          </motion.div>

          <motion.div
            className="dx-glass dx-jenkins-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="dx-jenkins-head"><Workflow size={16} /> Jenkins CI <span className="dx-jenkins-ok"><Check size={13} /> PASSED</span></div>
            <div className="dx-jenkins-bar"><motion.span initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeInOut" }} /></div>
            <ul className="dx-jenkins-steps">
              {["checkout", "build", "test", "docker pack"].map((s, i) => (
                <motion.li key={s} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.3 }}>
                  <Check size={12} /> {s}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── SECTION 4 — Kubernetes Orchestration (SVG cluster) ─────── */
const Kubernetes = () => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const [built, setBuilt] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setBuilt(v > 0.35));

  const pods = [
    { x: 115, label: "Frontend Pod", cls: "pod-frontend" },
    { x: 365, label: "Backend Pod", cls: "pod-backend" },
    { x: 615, label: "MongoDB Pod", cls: "pod-mongo" },
  ];
  const svcs = [
    { x: 115, label: "Frontend Service" },
    { x: 365, label: "Backend Service" },
    { x: 615, label: "MongoDB Service" },
  ];

  return (
    <section id="kubernetes" className="dx-section" ref={ref}>
      <SectionHeader
        eyebrow="Step 03 — Kubernetes Orchestration"
        title="Your app, orchestrated"
        sub="DeployX ships your containers to a Kubernetes cluster — pods, services and ingress, wired together."
      />
      <motion.div
        className={`dx-glass dx-k8s-wrap ${built ? "built" : ""}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
      >
        <svg className={`dx-k8s-svg ${reduce ? "reduced" : ""}`} viewBox="0 0 900 470" role="img" aria-label="Kubernetes cluster diagram">
          <defs>
            <linearGradient id="dxPodGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(239,68,68,0.16)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.10)" />
            </linearGradient>
          </defs>

          {/* cluster boundary */}
          <rect x="20" y="14" width="860" height="442" rx="22" className="k8s-cluster-box" />
          <text x="46" y="46" className="k8s-cluster-label">Kubernetes Cluster · namespace: deployx</text>

          {/* NGINX Ingress */}
          <g className="k8s-float">
            <rect x="335" y="62" width="230" height="54" rx="12" className="k8s-ingress" />
            <text x="450" y="94" textAnchor="middle" className="k8s-node-text">⬡ NGINX Ingress</text>
          </g>

          {/* ingress → each pod/service flow lines */}
          <path id="dxPathF" d="M 400 116 C 380 180, 215 200, 205 258" className="k8s-line" />
          <path id="dxPathB" d="M 450 116 L 450 258" className="k8s-line" />
          <path id="dxPathM" d="M 500 116 C 520 180, 685 200, 695 258" className="k8s-line" />

          {/* pods row */}
          {pods.map((p, i) => (
            <g key={p.label} className={`k8s-float k8s-float-${i}`}>
              <rect x={p.x} y="258" width="170" height="56" rx="12" fill="url(#dxPodGrad)" className={`k8s-pod ${p.cls}`} />
              <circle cx={p.x + 24} cy="286" r="5" className="k8s-pod-dot" />
              <text x={p.x + 40} y="291" className="k8s-node-text">{p.label}</text>
              <text x={p.x + 40} y="306" className="k8s-node-sub">Running · 1/1</text>
            </g>
          ))}

          {/* pod → service vertical links */}
          {svcs.map((s) => (
            <path key={s.label} d={`M ${s.x + 85} 314 L ${s.x + 85} 358`} className="k8s-line" />
          ))}

          {/* service → service chain */}
          <path d="M 285 396 L 365 396" className="k8s-line k8s-line-flow" />
          <path d="M 535 396 L 615 396" className="k8s-line k8s-line-flow" />

          {/* services row */}
          {svcs.map((s) => (
            <g key={s.label} className={`k8s-float k8s-float-${s.x === 365 ? 1 : s.x === 115 ? 0 : 2}`}>
              <rect x={s.x} y="358" width="170" height="50" rx="12" className="k8s-service" />
              <text x={s.x + 85} y="388" textAnchor="middle" className="k8s-node-text">{s.label}</text>
            </g>
          ))}

          {/* travelling data packets */}
          {!reduce && (
            <>
              <circle r="4" className="k8s-packet k8s-packet-red"><animateMotion dur="3.2s" repeatCount="indefinite"><mpath href="#dxPathF" /></animateMotion></circle>
              <circle r="4" className="k8s-packet k8s-packet-blue"><animateMotion dur="2.6s" repeatCount="indefinite"><mpath href="#dxPathB" /></animateMotion></circle>
              <circle r="4" className="k8s-packet k8s-packet-red"><animateMotion dur="3.8s" repeatCount="indefinite"><mpath href="#dxPathM" /></animateMotion></circle>
            </>
          )}
        </svg>
        <div className="dx-k8s-legend">
          <span><i className="dot red" /> Ingress routing</span>
          <span><i className="dot blue" /> Service-to-service traffic</span>
          <span><i className="dot pulse" /> Pods running</span>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── SECTION 5 — Live Deployment (scroll-driven checklist) ──── */
const liveSteps = [
  { label: "Repository Connected", icon: Github },
  { label: "Docker Image Built", icon: Box },
  { label: "CI Pipeline Passed", icon: Workflow },
  { label: "Kubernetes Deployment Running", icon: Server },
  { label: "Services Ready", icon: Network },
  { label: "Ingress Configured", icon: Globe },
  { label: "Application Live", icon: Rocket },
];

const LiveDeployment = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const [count, setCount] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCount(Math.min(liveSteps.length, Math.max(0, Math.floor(v * (liveSteps.length + 0.5)))));
  });

  return (
    <section id="live" className="dx-section dx-section-alt" ref={ref}>
      <SectionHeader
        eyebrow="Step 04 — Go Live"
        title="Watch every step complete"
        sub="Each check lights up as the pipeline advances — exactly what you see in the real dashboard."
      />
      <div className="dx-live-grid">
        <motion.ol
          className="dx-live-list"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {liveSteps.map((s, i) => {
            const done = i < count;
            return (
              <li key={s.label} className={`dx-live-step ${done ? "done" : ""}`}>
                <span className="dx-live-check">{done && <Check size={14} />}</span>
                <s.icon size={16} className="dx-live-icon" />
                <span>{s.label}</span>
              </li>
            );
          })}
        </motion.ol>

        <motion.div
          className="dx-glass dx-pipeline-visual"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          aria-hidden="true"
        >
          {["Repo", "Build", "Docker", "Jenkins", "K8s", "Ingress", "LIVE"].map((s, i) => (
            <div key={s} className={`dx-pipe-node ${i < count ? "lit" : ""}`}>
              <span className="dx-pipe-dot" />
              {s}
            </div>
          ))}
          <span className="dx-pipe-spine" />
        </motion.div>
      </div>
    </section>
  );
};

/* ─── SECTION 6 — Live Application ────────────────────────────── */
const LiveApp = () => (
  <section id="app" className="dx-section">
    <SectionHeader
      eyebrow="Step 05 — Live Application"
      title="Your application is LIVE."
      sub="A shareable production URL, served through the NGINX ingress from your running pods."
    />
    <motion.div
      className="dx-glass dx-browser"
      initial={{ opacity: 0, y: 50, rotateX: -8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
    >
      <div className="dx-browser-head">
        <span className="dx-dot red" /><span className="dx-dot amber" /><span className="dx-dot green" />
        <div className="dx-browser-url"><span className="dx-url-lock">✓</span> http://deployx.local</div>
        <span className="dx-live-tag"><span className="dx-pulse" /> LIVE</span>
      </div>
      <div className="dx-browser-body">
        <div className="dx-app-skeleton">
          <div className="dx-app-nav" />
          <div className="dx-app-hero" />
          <div className="dx-app-row">
            <span /><span /><span />
          </div>
        </div>
      </div>
      <div className="dx-browser-foot">
        <div className="dx-app-meta"><Server size={14} /> Pods <b>3/3 Running</b></div>
        <div className="dx-app-meta"><Network size={14} /> Services <b>3 Ready</b></div>
        <div className="dx-app-meta"><Globe size={14} /> Ingress <b>Configured</b></div>
        <div className="dx-app-meta"><Zap size={14} /> Deploy time <b>27s</b></div>
      </div>
    </motion.div>
  </section>
);

/* ─── Monitoring section (descriptive — no backend calls here) ── */
const monCards = [
  {
    Icon: Terminal, title: "Real-Time Logs", desc: "Stream Jenkins build output line-by-line the moment it happens.",
    visual: (
      <div className="dx-mini-term">
        <span>▸ clone · done</span><span>▸ docker build · done</span><span className="ok">▸ pipeline · passed</span>
      </div>
    ),
  },
  {
    Icon: Cpu, title: "Container Metrics", desc: "CPU, RAM and network usage for every running container.",
    visual: (
      <div className="dx-mini-bars" aria-hidden="true">
        {[40, 65, 30, 80, 55, 72, 45, 60].map((h, i) => (
          <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    ),
  },
  {
    Icon: Activity, title: "Deployment Status", desc: "Track every stage from clone to running pods — live.",
    visual: (
      <div className="dx-mini-status">
        <span className="ok">Running</span><span className="warn">Building</span><span className="ok">Ready</span>
      </div>
    ),
  },
  {
    Icon: Radio, title: "Socket.IO Updates", desc: "Status, logs and metrics pushed in real time over Socket.IO.",
    visual: <div className="dx-mini-live"><span className="dx-pulse" /> live channel connected</div>,
  },
];

const Monitoring = () => (
  <section id="monitoring" className="dx-section dx-section-alt">
    <SectionHeader
      eyebrow="Observability"
      title="Know exactly what's happening"
      sub="DeployX monitors every deployment — container status, workload information and real-time Socket.IO updates."
    />
    <div className="dx-mon-grid">
      {monCards.map((c, i) => (
        <motion.div
          key={c.title}
          className="dx-glass dx-mon-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: i * 0.1 }}
          whileHover={{ y: -6 }}
        >
          <span className="dx-mon-icon"><c.Icon size={22} /></span>
          <h3>{c.title}</h3>
          <p>{c.desc}</p>
          <div className="dx-mon-visual">{c.visual}</div>
        </motion.div>
      ))}
    </div>
  </section>
);

/* ─── CTA + Footer ────────────────────────────────────────────── */
const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="dx-cta-section">
      <motion.div
        className="dx-cta-card"
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
      >
<div className="dx3-cta-glow" />
        <h2 className="dx3-cta-title">Ready to go live?</h2>
        <p className="dx3-cta-sub">
          Launch your first app in under a minute. No servers to configure, no pipelines to babysit.
        </p>
        <motion.a
          href="/dashboard"
          className="dx3-btn dx3-btn-primary dx3-btn-lg"
          onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
          whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(220,38,38,0.55)" }}
          whileTap={{ scale: 0.94 }}
        >
          Launch Your First Deploy <Rocket size={20} />
        </motion.a>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  return (
    <footer className="dx-footer">
      <div className="dx-footer-inner">
        <div className="dx-footer-brand">
          <div className="dx-logo">
            <span className="app-logo">
              <span className="app-logo-badge"><img src="/logo.png" alt="DeployX" className="app-logo-img" /></span>
              <span className="app-logo-text">Deploy<span>X</span></span>
            </span>
          </div>
          <p>Modern DevOps Deployment Platform</p>
        </div>
        <div className="dx-footer-col">
          <h4>Pipeline</h4>
          <a href="#code">Your Code</a>
          <a href="#build">Build</a>
          <a href="#kubernetes">Kubernetes</a>
          <a href="#monitoring">Monitoring</a>
        </div>
        <div className="dx-footer-col">
          <h4>Resources</h4>
          <a href="https://github.com/tanvishinde017/DeployX" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://kubernetes.io/docs" target="_blank" rel="noopener noreferrer">Kubernetes Docs</a>
          <a href="https://www.jenkins.io/doc/" target="_blank" rel="noopener noreferrer">Jenkins Docs</a>
        </div>
        <div className="dx-footer-col">
          <h4>Get Started</h4>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Open Dashboard</a>
        </div>
      </div>
      <div className="dx-footer-bottom">
        <p>&copy; {year} DeployX. All rights reserved.</p>
        <span>Powered by Docker · Jenkins · Kubernetes</span>
      </div>
    </footer>
  );
};

/* ─── Page ────────────────────────────────────────────────────── */
function LandingPage() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="dx-page">
      <Background />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <YourCode />
      <Build />
      <Kubernetes />
      <LiveDeployment />
      <LiveApp />
      <Monitoring />
      <CTA />
      <Footer />
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            className="dx-top-btn"
            onClick={toTop}
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;









