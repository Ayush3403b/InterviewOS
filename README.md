# InterviewOS

An AI-assisted interview platform: resume analysis, an adaptive
interview loop (question generation, conversation tracking,
evaluation, coaching, and a final report), proctored MCQ tests, and
live video proctoring with a risk-scored evidence timeline.

npm workspaces monorepo:

```
apps/web        React + TypeScript + Vite frontend
services/api     Node.js + Express + MongoDB backend
packages/*       Reserved for shared code - currently empty scaffolding
```

## Running locally (without Docker)

Requires Node 22+ and a MongoDB instance.

```bash
npm install                      # installs all workspaces
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env
# edit both .env files - see the comments in .env.example for what's
# required vs optional, and how to generate JWT_SECRET
npm run dev                      # runs api + web together
```

The API listens on `http://localhost:5000`, the web app on
`http://localhost:5173` by default.

### Tests

```bash
npm test --workspace api         # backend unit tests (vitest)
```

There's no frontend test suite yet - `npm run build --workspace web`
(which runs `tsc -b` first) is the closest thing to a correctness
check on that side today.

## Running with Docker

```bash
cp services/api/.env.example services/api/.env
# fill in services/api/.env - same as above

docker compose up --build
```

This starts MongoDB, the API, and the web app (served via nginx,
reverse-proxying `/api` and `/socket.io` to the API container - see
`apps/web/nginx.conf`). The web app is then reachable at
`http://localhost:8080`.

`docker-compose.yml` overrides `MONGO_URI` to point at the `mongo`
service regardless of what's in your local `.env` - everything else
in `services/api/.env` (JWT secret, SMTP, AI provider keys) is used
as-is.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: backend
typecheck + unit tests, frontend lint + typecheck + build.

## Current status

This is under active, phased development - proctoring (live
monitoring, risk scoring, evidence timeline, recruiter review) and
the core interview loop (resume analysis, question/conversation/
evaluation/coach/report agents) are built and tested.

MCQ tests (`services/api/src/modules/mcq-test`, `apps/web/src/features/mcq-test`):
recruiters/faculty/admins build a test, generate questions with AI
from typed topics or uploaded PDFs/photos (text PDFs are read as text;
scans and photos go to the model as files), review and edit them, then
publish it and share an 8-character code or link. Candidates take it
under the same live proctoring as interviews, with a server-enforced
timer and one attempt each. Results show each attempt's score
alongside its proctoring report. Proctoring sessions now point at a
generic subject (`subjectType` + `subjectId`); the API migrates old
interview-only rows on startup (`migrateProctoringSubjects`). Notifications,
resume versioning/GitHub-LinkedIn import, deeper analytics, and voice
interviews are not yet started. Ask if you want the full breakdown -
it changes often enough that it's not worth freezing into this file.
