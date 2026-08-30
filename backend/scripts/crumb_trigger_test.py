import os
import requests

url = os.environ["JENKINS_URL"]
job = os.environ.get("JENKINS_JOB_NAME", "flask-docker-build")
user = os.environ["JENKINS_USER"]
token = os.environ["JENKINS_API_TOKEN"]

# Reproduce the fixed flow: ONE session for crumb GET + build POST.
session = requests.Session()
session.headers.update({"Accept": "application/json", "User-Agent": "DeployX/1.0"})
session.auth = (user, token)

crumb = session.get(url + "/crumbIssuer/api/json", timeout=15)
print("crumb          ->", crumb.status_code)
data = crumb.json()
hdr_field = data["crumbRequestField"]
hdr_val = data["crumb"]

session.headers.update({hdr_field: hdr_val})

resp = session.post(
    url + "/job/" + job + "/buildWithParameters",
    params={"REPO_URL": "https://github.com/example/example.git", "FRAMEWORK": "flask"},
    timeout=15,
    allow_redirects=False,
)
print("build trigger  ->", resp.status_code)
print("Location       ->", resp.headers.get("Location"))
# Optional: show queue item
if resp.status_code in (201, 302):
    loc = resp.headers.get("Location")
    if loc and "/queue/item/" in loc:
        qid = loc.rstrip("/").split("/")[-1]
        q = session.get(url + "/queue/item/" + qid + "/api/json", timeout=15)
        print("queue item     ->", q.status_code, q.text[:200])