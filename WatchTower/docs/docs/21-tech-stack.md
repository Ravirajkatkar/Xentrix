# 21 — Technology Stack

[← Back to index](../README.md)

Choices favor a large hiring pool in India, strong typing, and proven scale. Alternatives noted where reasonable.

---

## 21.1 Summary

| Layer | Choice | Rationale | Alternatives |
|-------|--------|-----------|--------------|
| Mobile | React Native + TypeScript | Single codebase, native modules, large talent pool | Flutter |
| Web | React + TypeScript + Vite | Ecosystem, component reuse with RN concepts | Next.js, Angular |
| Web data | TanStack Query | Server-state caching, retries | SWR, RTK Query |
| Backend | Go (high-throughput services) + Node/TypeScript (BFF/integration) | Go for attendance/tracking throughput; Node where iteration speed matters | Java/Spring, .NET |
| API | REST (OpenAPI 3.1) + gRPC internal | REST for clients, gRPC for service-to-service | GraphQL (BFF only) |
| Eventing | Apache Kafka (MSK) | Proven high-volume streaming | Pulsar, Kinesis |
| OLTP DB | PostgreSQL (sharded, RLS, partitioned) | RLS, partitioning, JSONB, maturity | — |
| Cache | Redis | Sessions, configs, hot reads | — |
| Object store | S3 (SSE-KMS) | Durable, cheap, lifecycle tiering | Azure Blob, GCS |
| Vector DB | managed/self-hosted (e.g., pgvector at small scale, dedicated at scale) | Face embeddings | Milvus, Pinecone |
| Warehouse | Columnar (Redshift / managed) | Reporting at scale | BigQuery, Snowflake |
| Search | OpenSearch | Logs + entity search | Elasticsearch |
| Orchestration | Kubernetes (EKS/AKS) | Standard, autoscaling | ECS |
| IaC | Terraform | Multi-cloud, mature | Pulumi |
| GitOps/CD | Argo CD + Helm | Declarative, auditable | Flux |
| CI | GitHub Actions / GitLab CI | Ubiquitous | CircleCI |
| Observability | Prometheus + Grafana + OpenTelemetry | Open standards | Datadog |
| Secrets | AWS Secrets Manager + KMS | Managed, rotated | Vault, Key Vault |

## 21.2 AI/ML stack

| Need | Choice |
|------|--------|
| Face recognition | ArcFace (server) + MobileFaceNet (on-device) |
| Liveness | Challenge-response + depth (where available) |
| Fraud/anomaly | Isolation Forest, gradient-boosted trees (XGBoost/LightGBM) |
| Attrition/prediction | XGBoost/LightGBM on behavioral features |
| AI assistant | LLM via API with tool-calling, permission-scoped, PII-masked |
| Serving | GPU node pool on Kubernetes; model registry + versioning |

## 21.3 Why Go + Node split

- **Go** for the hot path (attendance, tracking, patrol ingestion): low latency, low memory, excellent concurrency for high event volume.
- **Node/TypeScript** for integration-heavy and rapidly-iterating services (notifications, reporting orchestration, BFF) where the ecosystem and shared TypeScript types with the frontend speed delivery.
- A single language is simpler operationally; this split is optional — a Go-only or Node-only backend is viable. Pick based on team strength; document the decision in an ADR.

## 21.4 Standards & tooling

- **Code style:** ESLint + Prettier (TS), golangci-lint + gofmt (Go).
- **Testing:** Vitest/Jest (web), Detox (mobile e2e), Go test, Playwright (web e2e), k6 (perf), Pact (contract).
- **API contract:** OpenAPI 3.1 is the source of truth; clients generated; CI enforces parity.
- **Commit/PR:** conventional commits; required reviews; CI gates.
- **ADRs:** architecture decisions recorded in `docs/adr/` with context and consequences.
