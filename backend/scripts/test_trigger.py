import json
import sys
from pathlib import Path

# Ensure project root is on sys.path when running this script
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

# Load .env so services pick up environment variables like the app does
from dotenv import load_dotenv
load_dotenv(root / '.env')

from services.jenkins_service import trigger_jenkins_job


if __name__ == '__main__':
    # Provide repo URL as first argument or set TEST_REPO_URL in .env
    import os
    repo = None
    if len(sys.argv) > 1:
        repo = sys.argv[1]
    else:
        repo = os.getenv('TEST_REPO_URL')

    if not repo:
        print('No repo URL provided. Usage: python scripts/test_trigger.py <repo_url> or set TEST_REPO_URL in .env')
    else:
        result = trigger_jenkins_job(repo)
        print(json.dumps(result, indent=2))
