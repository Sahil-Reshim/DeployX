"""Regenerates the animated, on-theme header block of the DeployX README."""
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
BANNER = ROOT / "assets" / "deployx-banner.svg"

svg = BANNER.read_text(encoding="utf-8")
data_uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe="")

header = f"""<div align="center">

![DeployX - Animated Banner]({data_uri})

<br/>

# <span style="color:#ef4444">Deploy</span><span style="color:#2563eb">X</span>

### 🚀 Modern Self-Hosted DevOps Deployment Platform

> Deploy, orchestrate, monitor & scale production applications from your own infrastructure —
> <b>inspired by Vercel · Railway · Render · Kubernetes</b>

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-2563EB.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-ef4444.svg)](https://github.com/tanvishinde017/DeployX)
[![Python](https://img.shields.io/badge/Backend-Python%203.8%2B-2563EB.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019-2563EB.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg)](https://www.docker.com/)
[![Jenkins](https://img.shields.io/badge/Jenkins-Integrated-ef4444.svg)](https://www.jenkins.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-2563EB.svg)](https://kubernetes.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-22c55e.svg)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboards-22c55e.svg)](https://grafana.com/)

<br/>

<img src="https://img.shields.io/badge/STATUS-LIVE-brightgreen?style=for-the-badge&color=22c55e" alt="LIVE" />

<br/>

**🧱 Quickly Get Started**

[Documentation](#features) • [Quick Start](#installation-guide) • [Features](#key-features) • [Contributing](#contributing)

<br/>

<p>
  <img src="https://img.shields.io/github/stars/tanvishinde017/DeployX?style=social" alt="GitHub Stars" />
  <img src="https://img.shields.io/github/forks/tanvishinde017/DeployX?style=social" alt="GitHub Forks" />
  <img src="https://img.shields.io/github/watchers/tanvishinde017/DeployX?style=social" alt="GitHub Watchers" />
</p>

</div>

---
"""

text = README.read_text(encoding="utf-8")
marker = "---\n\n## Overview"
idx = text.find(marker)
if idx == -1:
    raise SystemExit("Could not locate the '---\\n\\n## Overview' marker in README.")
new_text = header + text[idx:]
README.write_text(new_text, encoding="utf-8")
print("README header regenerated successfully. Banner data URI length:", len(data_uri))