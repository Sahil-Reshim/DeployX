import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import "./LandingPage.css";

const Background = () => (
  <div className="landing-bg-container">
    <div className="landing-bg-orb landing-bg-orb-1" />
    <div className="landing-bg-orb landing-bg-orb-2" />
    <div className="landing-bg-orb landing-bg-orb-3" />
    <div className="landing-bg-orb landing-bg-orb-4" />
    <div className="landing-grid" />
    <div className="landing-particles">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 10 + 8}s`,
          }}
        />
      ))}
    </div>
  </div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Tech Stack", href: "#techstack" },
    { label: "Analytics", href: "#analytics" },
    { label: "About", href: "#about" },
  ];

  return (
    <motion.nav
      className={`landing-navbar ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="landing-nav-inner">
        <div className="landing-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo.png" alt="DeployX" className="landing-nav-logo-img" />
        </div>

        <div className={`landing-nav-center ${mobileOpen ? "open" : ""}`}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="landing-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="landing-nav-right">
          <motion.button
            className="landing-cta-btn"
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
          <button
            className={`landing-hamburger ${mobileOpen ? "active" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const pipelineSteps = [
    { label: "Repository", icon: "📦" },
    { label: "Git Clone", icon: "📥" },
    { label: "Docker Build", icon: "🐳" },
    { label: "Jenkins", icon: "⚙️" },
    { label: "Container", icon: "📦" },
    { label: "Production", icon: "🚀" },
    { label: "Live URL", icon: "🌐" },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section className="landing-hero" style={{ y, opacity }}>
      <div className="landing-hero-content">
        <motion.div
          className="landing-hero-logo"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <span className="hero-logo-text">Deploy</span>
          <span className="hero-logo-accent">X</span>
        </motion.div>

        <motion.h1
          className="landing-hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Deploy Any Repository.
          <br />
          <span className="hero-highlight">Anywhere. In Seconds.</span>
        </motion.h1>

        <motion.p
          className="landing-hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Deploy Flask, Django, FastAPI, React, Next.js, Express, Vue, Angular and more
          using Docker + Jenkins with real-time monitoring.
        </motion.p>

        <motion.div
          className="landing-hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            className="landing-hero-btn landing-hero-btn-primary"
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
            <span className="btn-arrow">→</span>
          </motion.button>
          <motion.a
            href="https://github.com/tanvishinde017/DeployX"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-hero-btn landing-hero-btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View GitHub
          </motion.a>
        </motion.div>

        <motion.div
          className="hero-pipeline-animation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {pipelineSteps.map((step, index) => (
            <motion.div
              key={step.label}
              className={`hero-pipeline-step ${index === activeStep ? "active" : ""} ${index < activeStep ? "done" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 1 }}
            >
              <span className="pipeline-step-icon">{step.icon}</span>
              <span className="pipeline-step-label">{step.label}</span>
              {index < pipelineSteps.length - 1 && (
                <motion.div
                  className="pipeline-step-arrow"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↓
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

const FeaturesSection = () => {
  const features = [
    { title: "One Click Deployment", desc: "Deploy any repository with a single click. No complex configuration needed.", icon: "🚀" },
    { title: "Automatic Framework Detection", desc: "Smart detection of your framework - Flask, React, Next.js, Django and more.", icon: "🔍" },
    { title: "Dockerfile Generation", desc: "Auto-generate optimized Dockerfiles for your specific tech stack.", icon: "🐳" },
    { title: "Jenkins CI/CD", desc: "Integrated Jenkins pipeline for continuous integration and deployment.", icon: "⚙️" },
    { title: "Docker Runtime", desc: "Secure containerized runtime environment with isolated deployments.", icon: "📦" },
    { title: "Real-Time Monitoring", desc: "Live CPU, RAM, and network monitoring for all deployments.", icon: "📊" },
    { title: "Analytics Dashboard", desc: "Comprehensive analytics with deployment metrics and trends.", icon: "📈" },
    { title: "Live Logs", desc: "Stream deployment logs in real-time with powerful filtering.", icon: "📝" },
    { title: "Production URL", desc: "Auto-generated production URLs for every successful deployment.", icon: "🌐" },
    { title: "Health Checks", desc: "Automated health monitoring with instant status updates.", icon: "💚" },
  ];

  return (
    <section id="features" className="landing-section">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Features</span>
        <h2>Everything You Need to Deploy</h2>
        <p>Powerful features designed for modern DevOps workflows.</p>
      </motion.div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
          >
            <div className="feature-card-glow" />
            <div className="feature-icon-wrapper">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const SupportedFrameworks = () => {
  const frameworks = [
    { name: "Python", icon: "🐍", color: "#3776AB" },
    { name: "Flask", icon: "🌶️", color: "#000000" },
    { name: "Django", icon: "🎸", color: "#092E20" },
    { name: "FastAPI", icon: "⚡", color: "#009688" },
    { name: "Node.js", icon: "🟢", color: "#339933" },
    { name: "Express", icon: "🚂", color: "#000000" },
    { name: "NestJS", icon: "🏗️", color: "#E0234E" },
    { name: "React", icon: "⚛️", color: "#61DAFB" },
    { name: "Vite", icon: "⚡", color: "#646CFF" },
    { name: "Next.js", icon: "▲", color: "#000000" },
    { name: "Vue", icon: "💚", color: "#4FC08D" },
    { name: "Angular", icon: "🅰️", color: "#DD0031" },
  ];

  return (
    <section className="landing-section landing-section-alt">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Supported Frameworks</span>
        <h2>Works With Your Stack</h2>
        <p>Automatic detection and deployment for all major frameworks.</p>
      </motion.div>

      <div className="frameworks-grid">
        {frameworks.map((fw, index) => (
          <motion.div
            key={fw.name}
            className="framework-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.08, y: -6 }}
          >
            <div className="framework-icon" style={{ background: `${fw.color}15`, borderColor: `${fw.color}30` }}>
              <span style={{ fontSize: "28px" }}>{fw.icon}</span>
            </div>
            <span className="framework-name">{fw.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const WorkflowSection = () => {
  const steps = [
    { label: "Repository", desc: "Connect your GitHub repo" },
    { label: "Clone", desc: "Auto-clone your code" },
    { label: "Framework Detection", desc: "Detect your tech stack" },
    { label: "Dockerfile", desc: "Generate Docker config" },
    { label: "Jenkins", desc: "CI/CD pipeline runs" },
    { label: "Build", desc: "Docker image build" },
    { label: "Docker Image", desc: "Image is created" },
    { label: "Container", desc: "Container starts" },
    { label: "Health Check", desc: "Verify uptime" },
    { label: "Production", desc: "Deploy to live" },
    { label: "Live", desc: "Your app is live!" },
  ];

  return (
    <section id="workflow" className="landing-section">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Workflow</span>
        <h2>Deployment Pipeline</h2>
        <p>From repository to production in minutes.</p>
      </motion.div>

      <div className="workflow-container">
        {steps.map((step, index) => (
          <motion.div
            key={step.label}
            className="workflow-step-wrapper"
            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="workflow-step">
              <div className="workflow-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="workflow-content">
                <h3>{step.label}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                className="workflow-connector"
                initial={{ height: 0 }}
                whileInView={{ height: "40px" }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const AnalyticsPreview = () => {
  const [counts, setCounts] = useState({ deployments: 0, successRate: 0, containers: 0, avgTime: 0 });

  useEffect(() => {
    const targets = { deployments: 1284, successRate: 97, containers: 342, avgTime: 28 };
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts({
        deployments: Math.floor(ease * targets.deployments),
        successRate: Math.floor(ease * targets.successRate),
        containers: Math.floor(ease * targets.containers),
        avgTime: Math.floor(ease * targets.avgTime),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById("analytics");
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const metrics = [
    { label: "Deployment Count", value: counts.deployments, suffix: "+", color: "var(--red)" },
    { label: "Success Rate", value: counts.successRate, suffix: "%", color: "var(--green)" },
    { label: "Containers Active", value: counts.containers, suffix: "", color: "var(--blue)" },
    { label: "Avg Deploy Time", value: counts.avgTime, suffix: "s", color: "var(--yellow)" },
  ];

  return (
    <section id="analytics" className="landing-section landing-section-alt">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Analytics</span>
        <h2>Platform Metrics</h2>
        <p>Real-time insights into your deployment infrastructure.</p>
      </motion.div>

      <div className="analytics-grid">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="analytics-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6 }}
          >
            <div className="analytics-card-glow" style={{ background: `radial-gradient(circle, ${metric.color}20, transparent 70%)` }} />
            <div className="analytics-card-value" style={{ color: metric.color }}>
              {metric.value}
              <span className="analytics-suffix">{metric.suffix}</span>
            </div>
            <div className="analytics-card-label">{metric.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const ScreenshotsPreview = () => {
  const previews = [
    { label: "Dashboard", icon: "📊", color: "#DC2626" },
    { label: "Pipeline", icon: "⚙️", color: "#2563EB" },
    { label: "Monitoring", icon: "📈", color: "#22C55E" },
    { label: "Logs", icon: "📝", color: "#EAB308" },
    { label: "Analytics", icon: "📉", color: "#8B5CF6" },
    { label: "Settings", icon: "⚡", color: "#EC4899" },
  ];

  return (
    <section className="landing-section">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Screenshots</span>
        <h2>Experience the Dashboard</h2>
        <p>Beautiful, intuitive interfaces for every task.</p>
      </motion.div>

      <div className="screenshots-grid">
        {previews.map((preview, index) => (
          <motion.div
            key={preview.label}
            className="screenshot-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            <div className="screenshot-glow" style={{ background: `radial-gradient(circle, ${preview.color}15, transparent 70%)` }} />
            <div className="screenshot-mockup" style={{ borderColor: `${preview.color}30` }}>
              <div className="screenshot-mockup-bar">
                <div className="mockup-dots">
                  <span style={{ background: "#EF4444" }} />
                  <span style={{ background: "#EAB308" }} />
                  <span style={{ background: "#22C55E" }} />
                </div>
                <span className="mockup-title">{preview.label}</span>
              </div>
              <div className="screenshot-mockup-content">
                <div className="mockup-grid">
                  <div className="mockup-row" style={{ width: "80%" }} />
                  <div className="mockup-row" style={{ width: "60%" }} />
                  <div className="mockup-row" style={{ width: "70%" }} />
                  <div className="mockup-row short" style={{ width: "40%" }} />
                </div>
              </div>
            </div>
            <span className="screenshot-label">{preview.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const TechStackSection = () => {
  const techs = [
    { name: "React", icon: "⚛️", color: "#61DAFB" },
    { name: "Flask", icon: "🌶️", color: "#000000" },
    { name: "Docker", icon: "🐳", color: "#2496ED" },
    { name: "Jenkins", icon: "⚙️", color: "#D33833" },
    { name: "Socket.IO", icon: "🔌", color: "#010101" },
    { name: "SQLite", icon: "🗄️", color: "#003B57" },
    { name: "GitHub", icon: "🐙", color: "#181717" },
    { name: "Python", icon: "🐍", color: "#3776AB" },
  ];

  return (
    <section id="techstack" className="landing-section">
      <motion.div
        className="landing-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <span className="section-eyebrow">Tech Stack</span>
        <h2>Built With Modern Technology</h2>
        <p>A powerful stack designed for performance and reliability.</p>
      </motion.div>

      <div className="techstack-grid">
        {techs.map((tech, index) => (
          <motion.div
            key={tech.name}
            className="techstack-card"
            initial={{ opacity: 0, rotateY: 90 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.1, z: 20 }}
          >
            <div className="techstack-icon" style={{ color: tech.color }}>
              {tech.icon}
            </div>
            <span className="techstack-name">{tech.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="landing-cta-section">
      <motion.div
        className="landing-cta-card"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <div className="cta-glow" />
        <motion.h2
          className="cta-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Ready to Deploy?
        </motion.h2>
        <motion.p
          className="cta-subtitle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Join thousands of developers deploying with DeployX.
        </motion.p>
        <motion.button
          className="landing-hero-btn landing-hero-btn-primary cta-btn"
          onClick={() => navigate("/dashboard")}
          whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(220,38,38,0.5)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Get Started
          <span className="btn-arrow">→</span>
        </motion.button>
        <motion.p
          className="cta-navigate"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Navigate to /dashboard
        </motion.p>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="landing-footer">
      <div className="landing-footer-inner">
        <div className="footer-brand">
          <div className="landing-nav-logo">
            <span className="landing-logo-text">Deploy</span>
            <span className="landing-logo-accent">X</span>
          </div>
          <p className="footer-desc">
            Modern DevOps Deployment Platform
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-links-col">
            <h4>Platform</h4>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#techstack">Tech Stack</a>
            <a href="#analytics">Analytics</a>
          </div>
          <div className="footer-links-col">
            <h4>Resources</h4>
            <a href="https://github.com/tanvishinde017/DeployX" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#">Documentation</a>
            <a href="#">Contributors</a>
            <a href="#">Version 2.0.0</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} DeployX. All rights reserved.</p>
          <div className="footer-social">
            <a href="https://github.com/tanvishinde017/DeployX" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="landing-page">
      <Background />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SupportedFrameworks />
      <WorkflowSection />
      <AnalyticsPreview />
      <ScreenshotsPreview />
      <TechStackSection />
      <CTASection />
      <Footer />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-top-btn"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
