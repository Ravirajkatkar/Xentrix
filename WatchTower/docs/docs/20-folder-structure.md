# 20 — Folder Structure

[← Back to index](../README.md)

Monorepo recommended (Nx/Turborepo) for shared types and atomic cross-cutting changes; services remain independently deployable.

---

## 20.1 Top-level monorepo

```
watchtower/
├── apps/
│   ├── mobile/              # React Native app
│   ├── web-tenant/          # Tenant + Xentrix portals (React)
│   └── web-client/          # Client portal (React)
├── services/                # Backend microservices
│   ├── auth/
│   ├── tenant/
│   ├── user/
│   ├── attendance/
│   ├── shift/
│   ├── patrol/
│   ├── incident/
│   ├── tracking/
│   ├── payroll/
│   ├── billing/
│   ├── report/
│   ├── notification/
│   ├── ai/
│   └── audit/
├── packages/                # Shared libraries
│   ├── api-types/           # Generated from OpenAPI
│   ├── ui/                  # Shared web component library
│   ├── design-tokens/
│   ├── auth-client/
│   └── eventschemas/        # Kafka event schemas (Avro/JSON)
├── infra/
│   ├── terraform/
│   └── helm/
├── deploy/                  # GitOps env values (Argo CD)
├── docs/                    # This documentation set
└── openapi/                 # API contracts (source of truth)
```

## 20.2 Backend service layout (per service)

```
services/attendance/
├── cmd/
│   └── server/main.go              # entrypoint
├── internal/
│   ├── api/                        # HTTP/gRPC handlers (thin)
│   ├── domain/                     # entities, business rules (pure)
│   ├── usecase/                    # application services
│   ├── repository/                 # data access (interfaces + impl)
│   ├── events/                     # producers/consumers
│   └── config/
├── migrations/                     # SQL migrations
├── test/                           # unit + contract tests
├── Dockerfile
├── Makefile
└── README.md
```

Layering rule: `api → usecase → domain`; `domain` depends on nothing external; `repository` and `events` are injected interfaces (dependency inversion). This keeps business logic testable and infra-agnostic.

## 20.3 Web frontend layout

```
apps/web-tenant/
├── src/
│   ├── app/                        # router, providers, layout
│   ├── modules/                    # feature modules (lazy-loaded)
│   │   ├── attendance/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/                # typed client calls
│   │   │   └── routes.tsx
│   │   ├── payroll/
│   │   └── billing/
│   ├── components/                 # shared UI (from packages/ui)
│   ├── lib/                        # auth, query client, utils
│   ├── theme/                      # tenant theming (CSS vars)
│   └── permissions/                # <Can> guard, scope helpers
├── public/
├── index.html
└── vite.config.ts
```

## 20.4 Mobile app layout

```
apps/mobile/
├── src/
│   ├── navigation/                 # dynamic stack/tab from config
│   ├── features/
│   │   ├── attendance/             # QR/GPS/Face/NFC capture
│   │   ├── patrol/
│   │   ├── incident/
│   │   ├── sos/
│   │   ├── schedule/
│   │   └── payslip/
│   ├── core/
│   │   ├── auth/                   # OTP, token, device binding
│   │   ├── sync/                   # offline queue + sync engine
│   │   ├── storage/                # encrypted SQLite
│   │   ├── location/               # adaptive GPS tracking
│   │   └── notifications/          # FCM/APNs
│   ├── native/                     # native module bridges
│   ├── theme/                      # runtime branding
│   └── config/                     # tenant config loader
├── android/
├── ios/
└── package.json
```

## 20.5 Conventions

- **Feature-first** organization (not type-first) inside apps; colocate components, hooks, and API calls per feature.
- **Shared types** generated once from OpenAPI into `packages/api-types`; never hand-duplicate request/response shapes.
- **Event schemas** versioned in `packages/eventschemas`; producers and consumers import the same schema.
- Each service and app owns a `README.md` with local run instructions.
