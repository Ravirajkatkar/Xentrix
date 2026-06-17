# 02 — Functional Requirements

[← Back to index](../README.md)

Requirements use RFC 2119 keywords. Each requirement has an ID (`FR-<module>-<n>`) for traceability into the test suite.

---

## 2.1 Tenant & subscription (FR-TEN)

| ID | Requirement |
|----|-------------|
| FR-TEN-1 | The system MUST allow Xentrix to provision, suspend, and delete tenants. |
| FR-TEN-2 | The system MUST enforce subscription entitlements (module access, guard-count limits) per tenant. |
| FR-TEN-3 | On subscription expiry, the system MUST move the tenant to read-only mode and retain data for 90 days. |
| FR-TEN-4 | The system MUST support per-tenant white-label config (logo, colors, app name) resolvable at runtime. |
| FR-TEN-5 | The system MUST support feature flags evaluated per tenant and per plan. |

## 2.2 Identity & access (FR-AUTH)

| ID | Requirement |
|----|-------------|
| FR-AUTH-1 | Guards MUST authenticate via mobile-number + OTP. |
| FR-AUTH-2 | Admin/manager web users MUST authenticate via email + password with TOTP MFA for Org Admin and above. |
| FR-AUTH-3 | The system MUST bind a guard's session to a registered device fingerprint. |
| FR-AUTH-4 | Enterprise tenants SHOULD be able to use SAML 2.0 / OIDC SSO. |
| FR-AUTH-5 | All permissions MUST resolve from role (RBAC) plus contextual attributes (ABAC). See [04](04-roles-and-permissions.md). |

## 2.3 Client, site, post (FR-ORG)

| ID | Requirement |
|----|-------------|
| FR-ORG-1 | A tenant MUST be able to create clients, sites, and posts in the hierarchy. |
| FR-ORG-2 | Each site MUST store GPS coordinates and a configurable geofence radius. |
| FR-ORG-3 | Each post MUST support assignment of QR codes, NFC tags, and patrol checkpoints. |
| FR-ORG-4 | A post MUST define required guard qualifications (armed/unarmed, gender, language). |

## 2.4 Employee lifecycle (FR-EMP)

| ID | Requirement |
|----|-------------|
| FR-EMP-1 | The system MUST support the 13-stage lifecycle: recruitment → onboarding → document verification → KYC → device registration → role/site/shift assignment → attendance enrollment → active → performance → leave → transfer → suspension/termination → rejoining. |
| FR-EMP-2 | The system MUST block deployment until mandatory documents reach VERIFIED status (configurable grace period). |
| FR-EMP-3 | The system MUST track document expiry and alert HR 60 days before expiry. |
| FR-EMP-4 | Employee records MUST persist across site transfers with full historical continuity. |

## 2.5 Attendance (FR-ATT)

| ID | Requirement |
|----|-------------|
| FR-ATT-1 | The system MUST support 11 methods: Manual, QR, GPS, Geofence, RFID, NFC, Biometric, Face, WiFi, Voice, AI. |
| FR-ATT-2 | Each check-in MUST be validated against geofence, time window, and device binding. |
| FR-ATT-3 | The system MUST compute a fraud score per attendance event. |
| FR-ATT-4 | Attendance MUST function offline and sync with ≤5-minute drift tolerance. |
| FR-ATT-5 | Exceptions MUST route to a supervisor approval queue. |
| FR-ATT-6 | All corrections MUST retain an immutable audit trail (old value, new value, approver, reason). |

Detail and sequence diagrams in [12 — Attendance](12-attendance.md).

## 2.6 Patrol (FR-PAT)

| ID | Requirement |
|----|-------------|
| FR-PAT-1 | The system MUST support QR, NFC, and GPS patrol verification. |
| FR-PAT-2 | A route MUST support up to 50 ordered checkpoints with time windows. |
| FR-PAT-3 | The system MUST detect missed/late/out-of-sequence patrols and escalate L1→L4. |
| FR-PAT-4 | The system MUST compute patrol compliance metrics per site and period. |

## 2.7 Incident (FR-INC)

| ID | Requirement |
|----|-------------|
| FR-INC-1 | The system MUST support incident creation with category and P1–P4 severity. |
| FR-INC-2 | Evidence (photo/video/audio) MUST be hashed (SHA-256) at upload for tamper evidence. |
| FR-INC-3 | SOS MUST trigger an escalation chain: Control Room → Supervisor → Area Manager → emergency services. |
| FR-INC-4 | P1 incidents MUST auto-create a Root Cause Analysis record. |

## 2.8 Shift (FR-SHF)

| ID | Requirement |
|----|-------------|
| FR-SHF-1 | The system MUST support fixed, rotational, split, night, and flexible shifts. |
| FR-SHF-2 | Roster publishing MUST be blocked while conflicts exist (overlap, >48h/week, <8h rest, unstaffed post). |
| FR-SHF-3 | The system MUST support shift swaps with approval and qualification checks. |
| FR-SHF-4 | The system SHOULD support auto-scheduling and MAY support AI scheduling. |

## 2.9 Payroll (FR-PAY)

| ID | Requirement |
|----|-------------|
| FR-PAY-1 | Payroll MUST synchronize from locked attendance for the period. |
| FR-PAY-2 | The system MUST compute overtime, night allowance, late deductions, and leave adjustments. |
| FR-PAY-3 | The system MUST apply PF, ESI, Professional Tax, and TDS per Indian statute. |
| FR-PAY-4 | Payroll MUST follow an approval chain: Payroll Mgr → Org Admin → Tenant Owner. |
| FR-PAY-5 | The system MUST generate NEFT bank files and PF/ESI challan files. |
| FR-PAY-6 | Each run MUST produce an immutable audit record. |

## 2.10 Billing (FR-BILL)

| ID | Requirement |
|----|-------------|
| FR-BILL-1 | The system MUST support per-guard, per-shift, per-day, attendance-based, and monthly billing models. |
| FR-BILL-2 | The system MUST apply overtime, holiday, and SLA-penalty adjustments to invoices. |
| FR-BILL-3 | Invoices MUST follow lifecycle: Draft → Reviewed → Approved → Dispatched → Paid → Reconciled. |
| FR-BILL-4 | The system MUST track per-client profitability (revenue − direct cost). |

## 2.11 Reporting (FR-REP)

| ID | Requirement |
|----|-------------|
| FR-REP-1 | The system MUST provide operational, HR, financial, and executive report categories. |
| FR-REP-2 | The system MUST offer a real-time client SLA dashboard. |
| FR-REP-3 | Reports MUST export to PDF and Excel and support scheduled email delivery. |
| FR-REP-4 | The system SHOULD provide a custom report builder. |

## 2.12 Notifications (FR-NOT)

| ID | Requirement |
|----|-------------|
| FR-NOT-1 | The system MUST deliver push (FCM/APNs), SMS, and email. |
| FR-NOT-2 | The system SHOULD deliver WhatsApp messages for guards who don't check the app. |
| FR-NOT-3 | Notification preferences MUST be configurable per tenant and per event type. |

## 2.13 Tracking (FR-TRK)

| ID | Requirement |
|----|-------------|
| FR-TRK-1 | The system MUST support live GPS tracking of on-duty guards. |
| FR-TRK-2 | The system MUST raise an alert when a guard leaves the site geofence during a shift. |
| FR-TRK-3 | Tracking MUST adapt sampling rate to motion to optimize battery. |
| FR-TRK-4 | Travel history MUST be retained for the configured retention window. |
