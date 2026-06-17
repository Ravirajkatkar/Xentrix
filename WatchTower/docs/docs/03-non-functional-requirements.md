# 03 — Non-Functional Requirements

[← Back to index](../README.md)

---

## 3.1 Scale targets

| Dimension | Target | Notes |
|-----------|--------|-------|
| Tenants | 10,000 | Architecture supports 50,000+ |
| Clients | 100,000 | No hard limit |
| Sites | 1,000,000 | No hard limit |
| Employees | 10,000,000 | Horizontal DB sharding by tenant |
| Attendance events | 100M+ stored, ~15M/day | Async ingestion via Kafka |
| Concurrent users (peak) | 500,000 | Two daily spike windows (shift changes) |
| API requests/sec (peak) | 50,000 | 2× headroom provisioned |

## 3.2 Performance

| Metric | Target |
|--------|--------|
| P50 API latency | < 80 ms |
| P95 API latency | < 200 ms |
| P99 API latency | < 500 ms |
| Attendance write ack | < 100 ms (async accept) |
| Dashboard first paint | < 1.5 s |
| Mobile cold start | < 2.5 s |
| Report generation (standard) | < 10 s |
| Report generation (heavy, async) | queued, ≤ 5 min, delivered via notification |

## 3.3 Availability & reliability

| Metric | Target |
|--------|--------|
| Platform uptime SLA | 99.9% (≈ 43 min/month downtime budget) |
| Attendance service uptime | 99.95% (most critical path) |
| RTO (Recovery Time Objective) | 4 hours |
| RPO (Recovery Point Objective) | 1 hour |
| Data durability | 99.999999999% (11 nines, object storage) |

Availability is achieved with min. 3 instances per service across 2 availability zones, synchronous DB replication within region, and async cross-region replication for DR.

## 3.4 Scalability

- **Stateless services** behind an autoscaler; scale on CPU + request-queue depth.
- **Database** sharded by `tenant_id` hash; ~1,000–2,000 tenants per shard; 3 read replicas per shard.
- **Attendance/patrol/tracking** flow through Kafka so write spikes never block the API.
- **Hot/warm/cold/archive** storage tiers (see [08](08-database-schema.md)).

## 3.5 Security

- TLS 1.3 in transit; AES-256 at rest; per-tenant encryption keys (annual rotation).
- Certificate pinning in mobile; WAF + DDoS protection at edge.
- All PII columns (Aadhaar hash, phone, bank account) encrypted at the column level.
- Quarterly external penetration testing. Detail in [18](18-security-compliance.md).

## 3.6 Compliance

| Regime | Obligation |
|--------|------------|
| DPDP Act 2023 | Consent management, data subject rights, retention limits |
| PSARA 2005 | Guard registers, training records, police verification tracking |
| PF / ESI | Statutory contribution calculation and challan generation |
| State Minimum Wage | Per-state wage rate tables, updated monthly |

## 3.7 Maintainability

- Services follow a shared service template (health checks, structured logging, tracing).
- All public APIs versioned (`/v1/...`); breaking changes require a new version.
- Minimum 80% unit-test coverage on business-logic packages; contract tests on service boundaries.
- Infrastructure is 100% code (Terraform); no manual console changes in production.

## 3.8 Observability

- **Metrics:** Prometheus-compatible; RED (Rate, Errors, Duration) per service + USE for infra.
- **Logging:** structured JSON, centralized, correlation-ID propagated end-to-end.
- **Tracing:** OpenTelemetry distributed tracing across service hops.
- **Alerting:** SLO-burn-rate alerts; on-call rotation; runbooks linked from alerts.

## 3.9 Accessibility & localization

- Web portals MUST meet WCAG 2.1 AA.
- Mobile app MUST support Hindi + English at launch; architecture MUST allow adding regional languages without rebuild (string catalogs).
- All timestamps stored UTC; rendered in the user's local timezone.

## 3.10 Data retention

| Data class | Hot | Warm | Cold | Archive (WORM) |
|------------|-----|------|------|----------------|
| Attendance | current month | 12 months | >12 months | >3 years (7-year legal) |
| Payroll | current run | 12 months | >12 months | 7 years |
| Incident evidence | open | 90 days | resolved | 7 years if legal |
| Audit logs | — | — | — | 7 years, append-only |
| GPS tracking | 24–72 hours hot | 30 days | — | purged per policy |
