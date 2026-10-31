PAGEGUARD - PHASE 3: AUTOMATED BUILD & TEST

This ZIP contains:
1. .github/workflows/ci.yml - GitHub Actions workflow
2. README-PHASE3.txt - this visible instruction file

IMPORTANT:
The .github folder starts with a dot and may be hidden by Android file managers.
The workflow file is present at .github/workflows/ci.yml.

Upload this ZIP to the repository's incoming-zips/ folder.
The repository's ZIP extraction workflow should extract both files.
After extraction, GitHub Actions should run PageGuard CI on the new main-branch commit.

The CI job runs:
- npm install
- npm test
- npm run build

This workflow does not enable video deletion. PageGuard remains read-only.
