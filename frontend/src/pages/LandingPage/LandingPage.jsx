import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Rocket, GitBranch, Box, Activity, ShieldCheck, Zap,
  Server, Terminal, Globe, Cpu, Layers, ArrowRight, ChevronUp, Check,
} from "lucide-react";
import "./LandingPage.css";

/* ═══════════════════════════════════════════════════════════════
   useTilt — mouse-tracked 3D card
   ═══════════════════════════════════════════════════════════════ */
function useTilt(max = 14) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 160, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 160, damping: 18 });

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(py * -max * 2);
  };
  const onMouseLeave = () => { rx.set(0); ry.set(0); };

  return { tiltStyle: { rotateX, rotateY, transformStyle: "preserve-3d" }, onMouseMove, onMouseLeave };
}

/* ─── Background (space aurora + 3D floor + floating cubes) ─── */
const fxCubes = [
  { left: "8%",  top: "20%", size: 46, dur: 9,  depth: "140px" },
  { left: "18%", top: "72%", size: 26, dur: 11, depth: "-60px" },
  { left: "78%", top: "16%", size: 38, dur: 8,  depth: "110px" },
  { left: "88%", top: "60%", size: 52, dur: 12, depth: "170px" },
  { left: "48%", top: "10%", size: 20, dur: 10, depth: "-100px" },
  { left: "36%", top: "82%", size: 30, dur: 13, depth: "60px" },
  { left: "66%", top: "78%", size: 22, dur: 9,  depth: "-140px" },
];

const Background = () => (
  <div className="dx3-bg" aria-hidden="true">
    <div className="dx3-orb dx3-orb-cyan" />
    <div className="dx3-orb dx3-orb-pink" />
    <div className="dx3-orb dx3-orb-violet" />
    <div className="dx3-stars">
      {Array.from({ length: 90 }).map((_, i) => (
        <span key={i} className="dx3-star" style={{
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2.4 + 1}px`, height: `${Math.random() * 2.4 + 1}px`,
          animationDelay: `${Math.random() * 6}s`, animationDuration: `${Math.random() * 8 + 4}s`,
        }} />
      ))}
    </div>
    <div className="dx3-floor" />
    {fxCubes.map((c, i) => (
      <span key={i} className="dx3-cube" style={{
        left: c.left, top: c.top, width: c.size, height: c.size,
        animationDuration: `${c.dur}s`, "--depth": c.depth,
      }} />
    ))}
    <div className="dx3-vignette" />
  </div>
);

/* ─── Navbar ──────────────────────────────────────────────── */
const links = [
  { label: "Features", href: "#features" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Analytics", href: "#analytics" },
  { label: "Stack", href: "#stack" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`dx3-nav ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="dx3-nav-inner">
        <div className="dx3-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="app-logo">
            <span className="app-logo-badge">
              <img src="/logo.png" alt="DeployX" className="app-logo-img" />
            </span>
            <span className="app-logo-text">Deploy<span>X</span></span>
          </span>
        </div>

        <div className={`dx3-nav-links ${open ? "open" : ""}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="dx3-nav-link" onClick={() => setOpen(false)}>
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

        <button className={`dx3-hamburger ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </motion.nav>
  );
};
/* ─── Hero (3D stage with scroll camera) ───────────────────── */
const OrbitIcon = ({ Icon, style, delay = 0 }) => (
  <span className="dx3-orbit-icon" style={style}>
    <span className="dx3-orbit-ring" style={{ animationDelay: `${delay}s` }}>
      <Icon size={20} />
    </span>
  </span>
);

const HeroConsole = () => {
  const { tiltStyle, onMouseMove, onMouseLeave } = useTilt(16);

  const lines = [
    { prompt: "$", text: "deployx deploy tanvishinde017/DeployX --prod", ok: false },
    { prompt: "✓", text: "Cloned repository  ·  128 files", ok: true },
    { prompt: "✓", text: "Built Docker image  ·  deployx:v2.0", ok: true },
    { prompt: "✓", text: "Jenkins pipeline passed in 27s", ok: true },
    { prompt: "✓", text: "Containers live on 0.0.0.0:4173", ok: true },
  ];

  return (
    <motion.div
      className="dx3-console-scene"
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
    >
      <OrbitIcon Icon={Rocket} style={{ top: "-16%", left: "50%" }} />
      <OrbitIcon Icon={Server} style={{ top: "12%", left: "-9%" }} />
      <OrbitIcon Icon={Activity} style={{ top: "76%", left: "110%" }} />
      <OrbitIcon Icon={ShieldCheck} style={{ top: "42%", left: "-12%" }} />
      <OrbitIcon Icon={Cpu} style={{ top: "88%", left: "118%" }} />

      <div className="dx3-console-wrap" {...{ style: tiltStyle, onMouseMove, onMouseLeave }}>
        <div className="dx3-console-card">
          <div className="dx3-console-head">
            <div className="dx3-dots"><span /><span /><span /></div>
            <div className="dx3-console-title"><Terminal size={14} /> deployx — live terminal</div>
            <span className="dx3-console-live"><span className="dx3-pulse" /> LIVE</span>
          </div>

          <div className="dx3-console-body">
            {lines.map((l, i) => (
              <motion.div
                key={i}
                className={`dx3-line ${l.ok ? "ok" : ""}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.35 }}
              >
                <span className="dx3-line-prompt">{l.prompt}</span>
                <span className="dx3-line-text">{l.text}</span>
                {l.ok && <Check size={13} className="dx3-line-check" />}
              </motion.div>
            ))}
            <span className="dx3-cursor" />
          </div>

          <div className="dx3-console-foot">
            <span className="dx3-metric"><Zap size={12} /> 27s avg deploy</span>
            <span className="dx3-metric"><Layers size={12} /> 342 containers</span>
            <span className="dx3-metric"><Globe size={12} /> live-url ready</span>
          </div>
        </div>
        <div className="dx3-console-glow" />
      </div>
    </motion.div>
  );
};
const Hero = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 220]);
  const yTitle = useTransform(scrollY, [0, 700], [0, -120]);
  const zoom = useTransform(scrollY, [0, 700], [1, 0.82]);
  const fade = useTransform(scrollY, [0, 500], [1, 0]);

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

        <motion.div className="dx3-hero-right" style={{ scale: zoom, opacity: fade }}>
          <HeroConsole />
        </motion.div>
      </div>

      <motion.div className="dx3-scroll-hint" style={{ opacity: fade }}>
        <span>scroll</span>
        <ChevronUp className="dx3-hint-chevron" size={20} />
      </motion.div>
    </section>
  );
};
/* ─── Features (3D tilt cards) ─────────────────────────────── */
const features = [
  { Icon: GitBranch, color: "#ef4444", title: "GitHub Auto-Deploy", desc: "Point at any repo and push. DeployX clones, builds and ships your code automatically." },
  { Icon: ShieldCheck, color: "#2563eb", title: "One-Click Rollback", desc: "Recover in an instant with version snapshots and single-command revert." },
  { Icon: Activity, color: "#dc2626", title: "Real-Time Monitoring", desc: "Watch CPU, RAM and network metrics stream live for every running container." },
  { Icon: Terminal, color: "#4ade80", title: "Live Build Logs", desc: "Stream Jenkins build output line-by-line the moment it happens." },
  { Icon: Zap, color: "#fbbf24", title: "Sub-Minute Builds", desc: "Optimized Docker layers cut average deployment time to under 30 seconds." },
  { Icon: Globe, color: "#60a5fa", title: "Public Production Link", desc: "Ship to a shareable production URL instantly after each successful deploy." },
];

const SectionHeader = ({ eyebrow, title, sub }) => (
  <motion.div
    className="dx3-section-head"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6 }}
  >
    <span className="dx3-eyebrow">{eyebrow}</span>
    <h2 className="dx3-section-title">{title}</h2>
    <p className="dx3-section-sub">{sub}</p>
  </motion.div>
);

const Features = () => (
  <section id="features" className="dx3-section">
    <SectionHeader
      eyebrow="Features"
      title="Everything you need to ship"
      sub="A complete deployment toolkit — from code push to live production link."
    />
    <div className="dx3-feature-grid">
      {features.map((f, i) => {
        const TiltCard = () => {
          const { tiltStyle, onMouseMove, onMouseLeave } = useTilt(10);
          return (
            <motion.div
              className="dx3-feature-tilt"
              {...{ style: tiltStyle, onMouseMove, onMouseLeave }}
            >
              <div className="dx3-feature-card" style={{ ["--c"]: f.color }}>
                <div className="dx3-feature-icon" style={{ color: f.color, borderColor: `${f.color}55`, background: `${f.color}15` }}>
                  <f.Icon size={26} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="dx3-feature-glow" style={{ background: `radial-gradient(circle, ${f.color}30, transparent 70%)` }} />
              </div>
            </motion.div>
          );
        };
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 40, rotateX: -12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.12 }}
          >
            <TiltCard />
          </motion.div>
        );
      })}
    </div>
  </section>
);
/* ─── Pipeline (3D glowing vertical timeline) ──────────────── */
const pipelineSteps = [
  { Icon: GitBranch, title: "Connect Repository", desc: "Paste a GitHub repo URL to kick off the flow.", color: "#ef4444" },
  { Icon: Box, title: "Docker Build", desc: "Containerize your app with a smart, cached build.", color: "#2563eb" },
  { Icon: Activity, title: "Jenkins Pipeline", desc: "Automated test, build and pack steps run cleanly.", color: "#dc2626" },
  { Icon: Layers, title: "Container Launch", desc: "Orchestrate and boot optimized containers.", color: "#4ade80" },
  { Icon: Globe, title: "Production Live", desc: "Get a secure, shareable production URL.", color: "#fbbf24" },
];

const Pipeline = () => (
  <section id="pipeline" className="dx3-section dx3-section-alt">
    <SectionHeader
      eyebrow="Pipeline"
      title="From push to production"
      sub="A fully automated pipeline that turns your repository into a running app."
    />

    <div className="dx3-pipeline">
      {pipelineSteps.map((s, i) => (
        <motion.div
          key={s.title}
          className="dx3-pipe-step"
          initial={{ opacity: 0, x: i % 2 ? 60 : -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
        >
          <div className="dx3-pipe-content" style={{ ["--c"]: s.color }}>
            <div className="dx3-pipe-icon" style={{ color: s.color, background: `${s.color}14`, borderColor: `${s.color}55` }}>
              <s.Icon size={26} />
            </div>
            <div className="dx3-pipe-body">
              <span className="dx3-pipe-num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          </div>
          {i < pipelineSteps.length - 1 && (
            <motion.div
              className="dx3-pipe-line-glow"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  </section>
);

/* ─── Analytics (count-up metrics) ─────────────────────────── */
const statData = [
  { label: "Deployments", value: 1284, suffix: "+", color: "#ef4444" },
  { label: "Success Rate", value: 97, suffix: "%", color: "#4ade80" },
  { label: "Active Containers", value: 342, suffix: "", color: "#2563eb" },
  { label: "Avg Build Time", value: 27, suffix: "s", color: "#fbbf24" },
];

const Analytics = () => {
  const [counts, setCounts] = useState(statData.map(() => 0));

  useEffect(() => {
    let raf;
    const start = Date.now();
    const dur = 1900;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCounts(statData.map((s) => Math.floor(ease * s.value)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const el = document.getElementById("analytics");
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { raf = requestAnimationFrame(tick); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    if (el) obs.observe(el);
    return () => { if (raf) cancelAnimationFrame(raf); obs.disconnect(); };
  }, []);

  return (
    <section id="analytics" className="dx3-section dx3-section-alt">
      <SectionHeader
        eyebrow="Analytics"
        title="Performance you can trust"
        sub="Live, real-world metrics across the entire deployment platform."
      />
      <div className="dx3-analytics-grid">
        {statData.map((s, i) => (
          <motion.div
            key={s.label}
            className="dx3-stat-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8 }}
            style={{ ["--c"]: s.color }}
          >
            <span className="dx3-stat-glow" style={{ background: `radial-gradient(circle, ${s.color}28, transparent 70%)` }} />
            <div className="dx3-stat-value" style={{ color: s.color }}>
              {counts[i]}<span className="dx3-stat-suffix">{s.suffix}</span>
            </div>
            <div className="dx3-stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
/* ─── Tech Stack (marquee) ─────────────────────────────────── */
const stackItems = [
  "React", "Node.js", "Flask", "Django", "FastAPI", "Express",
  "Next.js", "Vue", "Angular", "Docker", "Jenkins", "GitHub",
];

const TechStack = () => (
  <section id="stack" className="dx3-section">
    <SectionHeader
      eyebrow="Tech Stack"
      title="Works with your favorite frameworks"
      sub="From Python backends to modern JavaScript frontends — anything Docker can run."
    />
    <div className="dx3-marquee">
      <div className="dx3-marquee-track">
        {[...stackItems, ...stackItems].map((s, i) => (
          <span key={i} className="dx3-marquee-chip">{s}</span>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CTA ──────────────────────────────────────────────────── */
const CTA = () => {
  const navigate = useNavigate();
  const { tiltStyle, onMouseMove, onMouseLeave } = useTilt(8);
  return (
    <section className="dx3-cta-section">
      <motion.div
        className="dx3-cta-card"
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        {...{ style: tiltStyle, onMouseMove, onMouseLeave }}
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

/* ─── Footer ───────────────────────────────────────────────── */
const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  return (
    <footer className="dx3-footer">
      <div className="dx3-footer-inner">
        <div className="dx3-footer-brand">
          <div className="dx3-logo">
            <span className="app-logo">
              <span className="app-logo-badge">
                <img src="/logo.png" alt="DeployX" className="app-logo-img" />
              </span>
              <span className="app-logo-text">Deploy<span>X</span></span>
            </span>
          </div>
          <p>Modern DevOps Deployment Platform</p>
        </div>

        <div className="dx3-footer-col">
          <h4>Platform</h4>
          <a href="#features">Features</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#analytics">Analytics</a>
          <a href="#stack">Tech Stack</a>
        </div>

        <div className="dx3-footer-col">
          <h4>Resources</h4>
          <a href="https://github.com/tanvishinde017/DeployX" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#">Documentation</a>
          <a href="#">Contributors</a>
          <a href="#">Version 2.0.0</a>
        </div>

        <div className="dx3-footer-col">
          <h4>Get Started</h4>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Open Dashboard</a>
        </div>
      </div>
      <div className="dx3-footer-bottom">
        <p>&copy; {year} DeployX. All rights reserved.</p>
        <span>Powered by Docker · Jenkins · React</span>
      </div>
    </footer>
  );
};
/* ─── Page ─────────────────────────────────────────────────── */
function LandingPage() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="dx3-page">
      <Background />
      <Navbar />
      <Hero />
      <Features />
      <Pipeline />
      <Analytics />
      <TechStack />
      <CTA />
      <Footer />

      <AnimatePresence>
        {showTop && (
          <motion.button
            className="dx3-top-btn"
            onClick={toTop}
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