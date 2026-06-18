from pathlib import Path
root = Path(__file__).resolve().parents[1]
search_terms = [
    'https://github.com/example/repo.git',
    'example/repo.git',
    'git branch: ',
    'git url:',
    'checkout([',
    'credentialsId:',
    'userRemoteConfigs:',
    'Jenkinsfile'
]

matches = []
for p in root.rglob('*'):
    if p.is_file():
        try:
            text = p.read_text(encoding='utf-8')
        except Exception:
            continue
        for term in search_terms:
            if term in text:
                matches.append((str(p), term, text.count(term)))
                break

for path, term, count in matches:
    print(f'{count}x {term} in {path}')
print(f'Found {len(matches)} files with matching terms.')
