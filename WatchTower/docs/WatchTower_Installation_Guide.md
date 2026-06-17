# WatchTower — Project Creation & Installation Guide

> **Company:** Xentrix Solutions Pvt Ltd
> **Product:** WatchTower — Multi-Tenant Security Workforce Management SaaS
> **Document:** Getting Started — scaffold the monorepo, install dependencies, run locally
> **Audience:** Any engineer setting up the project for the first time
> **Companion docs:** see the architecture set (`docs/01`–`docs/22`)

This guide takes you from an empty machine to a running local stack: backend services, web portals, the mobile app, and the data layer (PostgreSQL, Redis, Kafka). Follow it top to bottom the first time.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Repository layout](#2-repository-layout)
3. [Create the monorepo from scratch](#3-create-the-monorepo-from-scratch)
4. [Scaffold the backend services](#4-scaffold-the-backend-services)
5. [Scaffold the web portals](#5-scaffold-the-web-portals)
6. [Scaffold the mobile app](#6-scaffold-the-mobile-app)
7. [Local infrastructure with Docker Compose](#7-local-infrastructure-with-docker-compose)
8. [Environment configuration](#8-environment-configuration)
9. [Database setup and migrations](#9-database-setup-and-migrations)
10. [Running everything locally](#10-running-everything-locally)
11. [Seeding demo data](#11-seeding-demo-data)
12. [Verifying the installation](#12-verifying-the-installation)
13. [Common commands reference](#13-common-commands-reference)
14. [Troubleshooting](#14-troubleshooting)
15. [Next steps](#15-next-steps)

---

## 1. Prerequisites

Install these before you begin. Versions are minimums; newer is fine.

| Tool | Version | Used for | Install |
|------|---------|----------|---------|
| Git | ≥ 2.40 | Version control | [git-scm.com](https://git-scm.com) |
| Node.js | ≥ 20 LTS | Web, mobile, tooling | Use `nvm` (recommended) |
| pnpm | ≥ 9 | Monorepo package manager | `npm i -g pnpm` |
| Go | ≥ 1.22 | High-throughput backend services | [go.dev/dl](https://go.dev/dl) |
| Docker + Docker Compose | ≥ 24 | Local Postgres, Redis, Kafka | [docker.com](https://docker.com) |
| Make | any | Task runner | OS package manager |
| jq, yq | any | Scripting helpers | OS package manager |

Mobile development additionally needs:

| Tool | For |
|------|-----|
| JDK 17 + Android Studio (SDK, emulator) | Android builds |
| Xcode (macOS only) + CocoaPods | iOS builds |
| Watchman | React Native file watching |

> **Tip — use a version manager.** Install Node via [`nvm`](https://github.com/nvm-sh/nvm) and Go via [`g`](https://github.com/stefanmaric/g) or your OS package manager so the whole team pins the same versions. Commit an `.nvmrc` (`20`) and a `go.mod` Go directive so versions are explicit.

### Verify your toolchain

```bash
git --version
node --version       # v20.x
pnpm --version       # 9.x
go version           # go1.22+
docker --version
docker compose version
```

---

## 2. Repository layout

We use a **monorepo** managed by pnpm workspaces + [Turborepo](https://turbo.build/repo) so shared types and cross-cutting changes stay atomic, while each service still deploys independently. Target structure:

```
watchtower/
├── apps/
│   ├── mobile/              # React Native app (TypeScript)
│   ├── web-tenant/          # Tenant + Xentrix portals (React + Vite)
│   └── web-client/          # Client portal (React + Vite)
├── services/                # Backend microservices
│   ├── auth/                # Go
│   ├── tenant/              # Go
│   ├── user/                # Go
│   ├── attendance/          # Go  (hot path)
│   ├── shift/               # Go
│   ├── patrol/              # Go
│   ├── incident/            # Node/TS
│   ├── tracking/            # Go  (hot path)
│   ├── payroll/             # Node/TS
│   ├── billing/             # Node/TS
│   ├── report/              # Node/TS
│   ├── notification/        # Node/TS
│   ├── ai/                  # Python (FastAPI) for ML serving
│   └── audit/               # Go
├── packages/                # Shared libraries
│   ├── api-types/           # TS types generated from OpenAPI
│   ├── ui/                  # Shared web component library
│   ├── design-tokens/
│   ├── auth-client/
│   └── eventschemas/        # Kafka event schemas
├── infra/
│   ├── docker/              # local docker-compose + Dockerfiles
│   ├── terraform/           # cloud IaC (not needed for local dev)
│   └── helm/
├── openapi/                 # API contract — source of truth
├── scripts/                 # dev/setup scripts
├── docs/                    # architecture documentation
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── Makefile
```

> The language split (Go for hot-path services, Node/TS for integration-heavy ones, Python for AI) is a recommendation, not a requirement. If your team is stronger in one language, standardize on it and record the decision in `docs/adr/`. This guide shows the mixed setup; skip the parts you don't use.

---

## 3. Create the monorepo from scratch

If the repo already exists, clone it instead (see [§3.3](#33-or-clone-an-existing-repo)) and skip to [§7](#7-local-infrastructure-with-docker-compose).

### 3.1 Initialize

```bash
mkdir watchtower && cd watchtower
git init
echo "20" > .nvmrc
pnpm init
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "typecheck": {}
  }
}
```

Install Turborepo at the root:

```bash
pnpm add -D -w turbo typescript
```

### 3.2 Root `.gitignore`

```gitignore
node_modules/
dist/
build/
.turbo/
*.log
.env
.env.*
!.env.example
.DS_Store
# Go
bin/
# Python
__pycache__/
.venv/
# Mobile
apps/mobile/android/app/build/
apps/mobile/ios/Pods/
```

### 3.3 …or clone an existing repo

```bash
git clone git@github.com:xentrix/watchtower.git
cd watchtower
pnpm install            # installs all JS/TS workspace deps
```

---

## 4. Scaffold the backend services

Each service follows the layered layout from `docs/20-folder-structure.md` (`api → usecase → domain`, with `repository` and `events` injected).

### 4.1 A Go service (example: `attendance`)

```bash
mkdir -p services/attendance/{cmd/server,internal/{api,domain,usecase,repository,events,config},migrations,test}
cd services/attendance
go mod init github.com/xentrix/watchtower/services/attendance
```

Minimal `cmd/server/main.go` to boot and pass a health check:

```go
package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("attendance service listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
```

Add common Go dependencies as you build out the service:

```bash
go get github.com/jackc/pgx/v5            # PostgreSQL driver
go get github.com/segmentio/kafka-go      # Kafka client
go get github.com/golang-jwt/jwt/v5       # JWT validation
go get github.com/redis/go-redis/v9       # Redis
```

Run it:

```bash
go run ./cmd/server
curl localhost:8081/healthz   # {"status":"ok"}
```

Repeat for the other Go services (`auth`, `tenant`, `user`, `shift`, `patrol`, `tracking`, `audit`), assigning each a unique local port (see the port map in [§10](#10-running-everything-locally)).

### 4.2 A Node/TypeScript service (example: `payroll`)

```bash
mkdir -p services/payroll/src/{api,domain,usecase,repository,events,config}
cd services/payroll
pnpm init
pnpm add fastify @fastify/cors pg kafkajs ioredis zod
pnpm add -D typescript tsx @types/node @types/pg vitest
npx tsc --init
```

Minimal `src/index.ts`:

```ts
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 8090);
app.listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`payroll service on :${port}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
```

Add to `services/payroll/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run"
  }
}
```

Run it:

```bash
pnpm dev
curl localhost:8090/healthz
```

Repeat for `incident`, `billing`, `report`, `notification`.

### 4.3 The Python AI service

```bash
mkdir -p services/ai/app
cd services/ai
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn pydantic numpy onnxruntime
pip freeze > requirements.txt
```

Minimal `app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="WatchTower AI Service")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
```

Run it:

```bash
uvicorn app.main:app --reload --port 8099
curl localhost:8099/healthz
```

---

## 5. Scaffold the web portals

Both web apps are React + Vite + TypeScript. Example for the tenant portal:

```bash
cd apps
pnpm create vite@latest web-tenant -- --template react-ts
cd web-tenant
pnpm install
pnpm add @tanstack/react-query react-router-dom axios zustand
pnpm add -D @types/node
```

Wire up the dev script (Vite provides it by default). Run:

```bash
pnpm dev      # http://localhost:5173
```

Repeat for `web-client`:

```bash
cd apps
pnpm create vite@latest web-client -- --template react-ts
```

> Generate the typed API client into `packages/api-types` from `openapi/openapi.json` (see [§13](#13-common-commands-reference)) so the portals never hand-write request/response shapes.

---

## 6. Scaffold the mobile app

```bash
cd apps
npx @react-native-community/cli@latest init mobile --version latest
cd mobile
```

Install the core runtime dependencies WatchTower needs:

```bash
pnpm add @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context \
  @reduxjs/toolkit react-redux \
  react-native-mmkv \
  react-native-vision-camera \
  react-native-geolocation-service \
  @react-native-firebase/app @react-native-firebase/messaging \
  react-native-keychain
```

iOS only (macOS):

```bash
cd ios && pod install && cd ..
```

Run on a simulator/emulator:

```bash
# Android (emulator must be running)
pnpm android
# iOS (macOS only)
pnpm ios
```

> First Android run requires `ANDROID_HOME` set and an AVD created in Android Studio. First iOS run requires Xcode command-line tools and a configured simulator.

---

## 7. Local infrastructure with Docker Compose

Create `infra/docker/docker-compose.yml` to run the data layer locally:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: watchtower
      POSTGRES_PASSWORD: watchtower
      POSTGRES_DB: watchtower
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U watchtower"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7
    ports: ["6379:6379"]

  kafka:
    image: bitnami/kafka:3.7
    ports: ["9092:9092"]
    environment:
      KAFKA_CFG_NODE_ID: "0"
      KAFKA_CFG_PROCESS_ROLES: "controller,broker"
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: "0@kafka:9093"
      KAFKA_CFG_LISTENERS: "PLAINTEXT://:9092,CONTROLLER://:9093"
      KAFKA_CFG_ADVERTISED_LISTENERS: "PLAINTEXT://localhost:9092"
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT"
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: "CONTROLLER"
      ALLOW_PLAINTEXT_LISTENER: "yes"

  # Optional: local S3-compatible object storage
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: watchtower
      MINIO_ROOT_PASSWORD: watchtower123

volumes:
  pgdata:
```

Start it:

```bash
cd infra/docker
docker compose up -d
docker compose ps        # all services healthy
```

This gives you PostgreSQL on `5432`, Redis on `6379`, Kafka on `9092`, and MinIO (object storage) on `9000` (console `9001`).

---

## 8. Environment configuration

Never commit real secrets. Each service reads config from environment variables; provide a committed `.env.example` and a local `.env` (gitignored).

Create a root `.env.example`:

```bash
# --- Database ---
DATABASE_URL=postgres://watchtower:watchtower@localhost:5432/watchtower

# --- Redis ---
REDIS_URL=redis://localhost:6379

# --- Kafka ---
KAFKA_BROKERS=localhost:9092

# --- Object storage (MinIO locally) ---
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=watchtower
S3_SECRET_KEY=watchtower123
S3_BUCKET=watchtower-dev

# --- Auth ---
JWT_PRIVATE_KEY_PATH=./infra/docker/keys/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./infra/docker/keys/jwt_public.pem
ACCESS_TOKEN_TTL=8h
REFRESH_TOKEN_TTL=720h

# --- Third-party (use test/sandbox keys locally) ---
SMS_PROVIDER_KEY=changeme
WHATSAPP_BSP_KEY=changeme
MAPS_API_KEY=changeme
FCM_SERVER_KEY=changeme

# --- Service ports (local) ---
PORT=8081
```

Copy and fill in locally:

```bash
cp .env.example .env
```

Generate local JWT signing keys (RS256):

```bash
mkdir -p infra/docker/keys
openssl genrsa -out infra/docker/keys/jwt_private.pem 2048
openssl rsa -in infra/docker/keys/jwt_private.pem -pubout -out infra/docker/keys/jwt_public.pem
```

> For local dev, sandbox/test keys for SMS, WhatsApp, and maps are enough. The OTP flow can be configured to log the OTP to the console instead of sending a real SMS — set `SMS_PROVIDER=console` in your auth service config.

---

## 9. Database setup and migrations

We use SQL migrations (`golang-migrate`). Install the CLI:

```bash
# macOS
brew install golang-migrate
# Linux
curl -L https://github.com/golang-migrate/migrate/releases/latest/download/migrate.linux-amd64.tar.gz | tar xz
sudo mv migrate /usr/local/bin/
```

Create the first migration for a service (example: attendance):

```bash
cd services/attendance
migrate create -ext sql -dir migrations -seq init_attendance
```

This creates `000001_init_attendance.up.sql` and `..._down.sql`. Populate the `up` file (schema from `docs/08-database-schema.md`):

```sql
CREATE TABLE IF NOT EXISTS attendance_events (
  event_id        uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  employee_id     uuid NOT NULL,
  post_id         uuid NOT NULL,
  event_type      text NOT NULL CHECK (event_type IN ('CHECK_IN','CHECK_OUT')),
  method          text NOT NULL,
  device_id       text,
  latitude        numeric(10,8),
  longitude       numeric(11,8),
  gps_accuracy_m  numeric(6,2),
  server_ts       timestamptz NOT NULL DEFAULT now(),
  device_ts       timestamptz,
  status          text NOT NULL DEFAULT 'VALID',
  fraud_score     numeric(4,3)
);

CREATE INDEX IF NOT EXISTS ix_att_emp_ts
  ON attendance_events (tenant_id, employee_id, server_ts DESC);

-- Row-Level Security backstop (see docs/08 and docs/18)
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendance_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Apply migrations:

```bash
export DATABASE_URL=postgres://watchtower:watchtower@localhost:5432/watchtower
migrate -path services/attendance/migrations -database "$DATABASE_URL" up
```

> **Migration discipline:** migrations are expand-contract and reversible. Never run a blocking `ALTER` on a large table in production — see `docs/19-deployment.md §19.4`.

---

## 10. Running everything locally

### 10.1 Local port map

| Service | Port | Service | Port |
|---------|------|---------|------|
| auth | 8080 | payroll | 8090 |
| attendance | 8081 | billing | 8091 |
| tenant | 8082 | report | 8092 |
| user | 8083 | notification | 8093 |
| shift | 8084 | ai | 8099 |
| patrol | 8085 | web-tenant | 5173 |
| tracking | 8086 | web-client | 5174 |
| incident | 8087 | Postgres | 5432 |
| audit | 8088 | Redis / Kafka | 6379 / 9092 |

### 10.2 Start order

```bash
# 1. Infrastructure
cd infra/docker && docker compose up -d && cd ../..

# 2. Migrations (all services)
make migrate-up

# 3. Backend services (each in its own terminal, or use the Makefile target below)
make dev-backend

# 4. Web portals
pnpm --filter web-tenant dev      # :5173
pnpm --filter web-client dev      # :5174

# 5. Mobile (separate terminal)
pnpm --filter mobile start        # Metro bundler, then `pnpm android` / `pnpm ios`
```

### 10.3 A root `Makefile` to glue it together

```makefile
.PHONY: up down migrate-up dev-backend dev-web seed

up:                ## Start local infra
	cd infra/docker && docker compose up -d

down:              ## Stop local infra
	cd infra/docker && docker compose down

migrate-up:        ## Run all service migrations
	@for svc in auth tenant user attendance shift patrol incident tracking payroll billing audit; do \
		echo "migrating $$svc"; \
		migrate -path services/$$svc/migrations -database "$(DATABASE_URL)" up || true; \
	done

dev-backend:       ## Run Go services concurrently (requires `overmind` or `foreman`)
	overmind start -f Procfile.dev

seed:              ## Load demo data
	go run ./scripts/seed

dev-web:           ## Run both portals
	pnpm --filter web-tenant --filter web-client dev
```

`Procfile.dev` (used by [overmind](https://github.com/DarthSim/overmind) / foreman to run all services in one terminal):

```
auth:        cd services/auth && PORT=8080 go run ./cmd/server
attendance:  cd services/attendance && PORT=8081 go run ./cmd/server
tenant:      cd services/tenant && PORT=8082 go run ./cmd/server
payroll:     cd services/payroll && PORT=8090 pnpm dev
ai:          cd services/ai && . .venv/bin/activate && uvicorn app.main:app --port 8099
```

---

## 11. Seeding demo data

A seed script creates one tenant, a client, a site, posts, shifts, and a few guards so you can log in and exercise flows immediately.

```bash
make seed
```

The seed should create (matching the hierarchy in `docs/01`):

- **Tenant:** ABC Security Services
- **Client:** HDFC Bank → **Site:** Pune Branch → **Posts:** Main Gate, ATM Area
- **Shift:** Morning 07:00–15:00
- **Users:** one Tenant Owner (web login), one Site Supervisor, three Security Guards (OTP login)
- A printed/console OTP for each guard so you can log in without a real SMS

> Keep seed data idempotent (safe to re-run) and clearly fake. Never seed real PII.

---

## 12. Verifying the installation

Run this checklist after first setup:

```bash
# Infra healthy
docker compose -f infra/docker/docker-compose.yml ps

# Each backend health endpoint
for p in 8080 8081 8082 8090 8099; do
  echo "port $p:"; curl -s localhost:$p/healthz; echo;
done
```

Then exercise the core path manually:

1. **Web login** — open `http://localhost:5173`, log in as the seeded Tenant Owner. The dashboard should load.
2. **OTP login (API)** — request and verify an OTP for a seeded guard:
   ```bash
   curl -s -X POST localhost:8080/v1/auth/otp/send \
     -H "Content-Type: application/json" \
     -d '{"mobile":"+919999900001"}'
   # OTP printed to the auth service console (SMS_PROVIDER=console)
   curl -s -X POST localhost:8080/v1/auth/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"mobile":"+919999900001","otp":"<printed-otp>","device_fingerprint":"dev-1"}'
   # → returns access_token + tenant_config
   ```
3. **Submit attendance** — using the access token from step 2:
   ```bash
   curl -s -X POST localhost:8081/v1/attendance \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{"event_id":"<uuid>","event_type":"CHECK_IN","method":"QR","post_id":"<seeded-post-id>","latitude":18.5204,"longitude":73.8567,"gps_accuracy_m":10,"device_ts":"2025-03-15T06:47:22Z"}'
   # → 202 Accepted
   ```
4. **Confirm it landed** — query the DB:
   ```bash
   psql "$DATABASE_URL" -c "select event_id, status, method from attendance_events order by server_ts desc limit 1;"
   ```

If all four steps pass, your local stack is working end to end.

---

## 13. Common commands reference

| Task | Command |
|------|---------|
| Install all JS deps | `pnpm install` |
| Start local infra | `make up` |
| Stop local infra | `make down` |
| Run all migrations | `make migrate-up` |
| Run all backend services | `overmind start -f Procfile.dev` |
| Run tenant portal | `pnpm --filter web-tenant dev` |
| Run mobile Metro | `pnpm --filter mobile start` |
| Run a single Go service | `cd services/<svc> && go run ./cmd/server` |
| Build everything | `pnpm turbo build` |
| Lint everything | `pnpm turbo lint` |
| Run all tests | `pnpm turbo test` |
| Generate API types from OpenAPI | `pnpm dlx openapi-typescript openapi/openapi.json -o packages/api-types/index.ts` |
| New migration | `migrate create -ext sql -dir services/<svc>/migrations -seq <name>` |
| Tail Kafka topic | `docker exec -it docker-kafka-1 kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic attendance.raw` |

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `port already in use` | Another process on a service port | `lsof -i :<port>` then kill, or change `PORT` |
| Postgres connection refused | Container not up / wrong URL | `docker compose ps`; check `DATABASE_URL` host/port |
| `relation does not exist` | Migrations not run | `make migrate-up` |
| RLS blocks all rows in dev | `app.tenant_id` not set on connection | Ensure the service sets `SET app.tenant_id = '<uuid>'` per request; for ad-hoc psql, `SET app.tenant_id = '...';` first |
| Kafka client can't connect | Advertised listener mismatch | Confirm `KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092` |
| OTP never arrives | Real SMS provider in dev | Set `SMS_PROVIDER=console`; read OTP from auth logs |
| Mobile build fails on Android | `ANDROID_HOME` unset / no AVD | Set SDK path; create an emulator in Android Studio |
| iOS `pod install` fails | CocoaPods/Xcode mismatch | `sudo gem install cocoapods`; update Xcode CLI tools |
| `pnpm` resolves wrong workspace | Stale lockfile | `rm -rf node_modules && pnpm install` |
| Go module errors | Proxy/version | `go clean -modcache && go mod tidy` |

---

## 15. Next steps

Once the stack runs locally:

1. **Read the architecture docs** — start with `docs/01-project-overview.md`, then your team's section.
2. **Pick up the OpenAPI contract** — `openapi/openapi.json` is the source of truth; generate clients, don't hand-write types.
3. **Wire CI** — see `docs/17-cicd.md` for the pipeline (lint → test → scan → build → deploy).
4. **Set up cloud envs** — `docs/16-infrastructure.md` and `docs/19-deployment.md` cover Terraform, EKS/AKS, and the GitOps release flow.
5. **Follow the conventions** — feature-first folders, conventional commits, ADRs in `docs/adr/`, ≥80% coverage on business-logic packages.

> **Security reminder for local dev:** the keys and passwords in this guide are for local use only. Never reuse them anywhere real. Production secrets live in the secrets manager (`docs/18-security-compliance.md`), are injected at runtime, and never enter Git.

---

*WatchTower — Project Creation & Installation Guide · Xentrix Solutions Pvt Ltd · Companion to the architecture documentation set.*
