# 09 — API Documentation

[← Back to index](../README.md)

---

## 9.1 Conventions

- **Base URL:** `https://api.watchtower.app/v1`
- **Versioning:** path-based (`/v1`); breaking changes → `/v2`.
- **Auth:** `Authorization: Bearer <access_token>` on every call except auth bootstrap.
- **Tenant context:** derived from the token; never accepted from the client body.
- **Idempotency:** unsafe POSTs accept `Idempotency-Key` header; attendance/patrol use `event_id`.
- **Pagination:** cursor-based — `?limit=50&cursor=<opaque>`; response includes `next_cursor`.
- **Content type:** `application/json; charset=utf-8`.
- **Spec:** the authoritative contract is the OpenAPI 3.1 document at `/openapi.json`; the typed clients (web + mobile) are generated from it.

## 9.2 Standard response envelope

Success:

```json
{ "data": { }, "meta": { "request_id": "..." } }
```

List:

```json
{ "data": [ ], "meta": { "next_cursor": "...", "request_id": "..." } }
```

Error:

```json
{
  "error": {
    "code": "ATTENDANCE_GEOFENCE_VIOLATION",
    "message": "Check-in location is outside the site geofence.",
    "details": { "distance_m": 230, "geofence_radius_m": 100 },
    "request_id": "..."
  }
}
```

## 9.3 Error codes (representative)

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Malformed request |
| 401 | `UNAUTHENTICATED` | Missing/invalid token |
| 401 | `OTP_INVALID` | Wrong/expired OTP |
| 403 | `PERMISSION_DENIED` | RBAC/ABAC failure |
| 403 | `DEVICE_NOT_REGISTERED` | Device binding mismatch |
| 409 | `ATTENDANCE_DUPLICATE` | Idempotent replay |
| 422 | `ATTENDANCE_GEOFENCE_VIOLATION` | Out of fence |
| 423 | `PAYROLL_LOCKED` | Period locked |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled |

## 9.4 Authentication endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/send` | Send OTP to mobile |
| POST | `/auth/otp/verify` | Verify OTP, bind device, issue tokens |
| POST | `/auth/login` | Email + password (managers) |
| POST | `/auth/mfa/verify` | TOTP second factor |
| POST | `/auth/token/refresh` | Rotate refresh token, new access token |
| POST | `/auth/logout` | Revoke refresh token |

`POST /auth/otp/verify`

```http
POST /v1/auth/otp/verify
Content-Type: application/json

{ "mobile": "+919876543210", "otp": "482915", "device_fingerprint": "..." }
```

```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "opaque-token",
    "expires_in": 28800,
    "profile": { "employee_id": "...", "role": "SECURITY_GUARD" },
    "tenant_config": { "...": "see mobile architecture §5.4" }
  }
}
```

## 9.5 Attendance endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance` | Submit a check-in/out event (any method) |
| POST | `/attendance/sync/batch` | Submit queued offline events |
| GET | `/attendance` | List events (filters: employee, post, date range, status) |
| GET | `/attendance/{event_id}` | Single event |
| POST | `/attendance/{event_id}/approve` | Approve an exception |
| POST | `/attendance/{event_id}/correct` | Correction with reason (audit-logged) |

`POST /attendance`

```json
{
  "event_id": "client-uuid",
  "event_type": "CHECK_IN",
  "method": "QR",
  "post_id": "post_abc_001",
  "qr_code_id": "qr_...",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "gps_accuracy_m": 12.5,
  "device_ts": "2025-03-15T06:47:22Z"
}
```

→ `202 Accepted` `{ "data": { "event_id": "...", "status": "PENDING_VALIDATION" } }`

## 9.6 Other module endpoints (summary)

| Module | Representative endpoints |
|--------|--------------------------|
| Tenants | `POST /tenants`, `PATCH /tenants/{id}`, `GET /tenants/{id}/subscription` |
| Clients/Sites | `POST /clients`, `POST /sites`, `POST /sites/{id}/posts` |
| Employees | `POST /employees`, `POST /employees/{id}/documents`, `POST /employees/{id}/transfer` |
| Shifts | `POST /shifts`, `POST /rosters`, `POST /rosters/{id}/publish`, `POST /shifts/swap` |
| Patrol | `POST /patrol/routes`, `POST /patrol/scan`, `GET /patrol/compliance` |
| Incidents | `POST /incidents`, `POST /incidents/{id}/evidence`, `POST /incidents/sos` |
| Payroll | `POST /payroll/runs`, `POST /payroll/runs/{id}/approve`, `GET /payslips/{id}` |
| Billing | `POST /invoices/generate`, `POST /invoices/{id}/approve`, `GET /invoices` |
| Reports | `POST /reports/generate`, `GET /reports/{id}`, `POST /reports/schedule` |
| Tracking | `POST /tracking/locations/batch`, `GET /tracking/guards/live` |

## 9.7 Rate limiting

- Per-user and per-IP token buckets at the gateway.
- Attendance/sync endpoints get a higher burst allowance (shift-change spikes).
- `429` responses include `Retry-After`.

## 9.8 Webhooks (tenant-facing, enterprise)

Tenants can register webhook endpoints for events (`attendance.exception`, `incident.created`, `invoice.generated`). Payloads are signed (HMAC-SHA256, `X-WT-Signature`) and retried with backoff.

## 9.9 Backend API best practices

- Validate at the edge (schema) and in the domain (business rules) — never trust the client.
- Keep endpoints resource-oriented; use sub-resources over verbs where natural.
- Return `202` for async work and a status resource the client can poll or subscribe to.
- Every write emits a domain event consumed by Audit; never write audit inline only.
- Document every endpoint in OpenAPI; CI fails if code and spec diverge (contract tests).
