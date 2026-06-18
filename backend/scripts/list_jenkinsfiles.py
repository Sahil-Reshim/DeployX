from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'deployments'
for p in root.rglob('jenkinsfile'):
    print(p)
