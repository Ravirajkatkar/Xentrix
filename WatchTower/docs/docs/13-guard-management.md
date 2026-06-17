# 13 — Security Guard Management Module

[← Back to index](../README.md)

Covers employee lifecycle, shifts, patrol, incidents, SOS, payroll, and billing as they relate to the guard workforce.

---

## 13.1 Employee lifecycle

```mermaid
flowchart LR
    R[Recruitment] --> O[Onboarding] --> D[Doc verification] --> K[KYC]
    K --> DR[Device registration] --> RA[Role/Site/Shift assignment]
    RA --> EN[Attendance enrollment] --> AC[Active]
    AC --> PT[Performance tracking]
    AC --> LV[Leave]
    AC --> TR[Transfer]
    AC --> SU[Suspension]
    AC --> TE[Termination / F&F]
    TE --> AR[Archive]
    AR -.-> RJ[Rejoining]
```

Mandatory onboarding documents (India): Aadhaar, PAN, PSARA training certificate, police verification, previous-employment NOC, bank proof, medical fitness, education proof. Deployment is blocked until VERIFIED (configurable 7-day grace with a visible flag). Document expiry alerts fire 60 days out.

## 13.2 Shift management

| Type | Description |
|------|-------------|
| Fixed | Same window daily |
| Rotational | Weekly rotation Morning/Afternoon/Night |
| Split | Two segments with a gap |
| Night | Night allowance triggered |
| Flexible | Start within a window, fixed hours |

**Roster conflict rules (block publish):** overlapping shifts, >48h/week, <8h rest between shifts, leave-vs-assignment, unstaffed post. **Swap:** requires equivalent qualifications, no new overtime, 24h notice (configurable), supervisor approval.

```mermaid
sequenceDiagram
    participant A as Guard A
    participant B as Guard B
    participant S as Supervisor
    A->>B: Request swap (date X)
    B-->>A: Accept
    A->>S: Swap pending
    S-->>A: Approve (qualifications + no-OT checks pass)
    Note over A,B: Both rosters updated; attendance engine re-pointed
```

## 13.3 Patrol management

Routes hold up to 50 ordered checkpoints (QR/NFC/GPS) with time windows and a per-shift frequency. The compliance engine evaluates each round and escalates:

```mermaid
flowchart TD
    M{"Round started<br/>within tolerance?"}
    M -->|no| L1["L1: Push to Supervisor"]
    L1 --> L2["L2 (no ack 10m): Area Manager"]
    M -->|"critical checkpoint missed"| L3["L3: Control Room Manager call"]
    L3 --> L4["L4 (SLA threshold): notify Client"]
```

Metrics: compliance rate, checkpoint coverage, average duration, missed/late/out-of-sequence counts. Detail mirrors [02 §2.6](02-functional-requirements.md).

## 13.4 Incident management

Categories: security breach, theft, fire/safety, medical, violence, vandalism, suspicious activity, equipment failure, SOS, near-miss. Severity P1–P4 drives response SLA and client-notification timing.

```mermaid
flowchart LR
    C[Create] --> E[Evidence + SHA-256 hash]
    E --> A[Assess severity P1-P4]
    A --> AS[Assign investigator]
    AS --> CN[Client notify per SLA]
    CN --> IN[Investigate]
    IN --> RS[Resolve]
    RS --> RCA{P1?}
    RCA -->|yes| ROOT[Auto RCA record]
    RCA -->|no| CL[Close]
    ROOT --> CL
```

## 13.5 SOS workflow

```mermaid
sequenceDiagram
    participant G as Guard
    participant N as Notification
    participant CR as Control Room
    participant SUP as Supervisor
    participant AM as Area Manager
    G->>N: SOS (3s hold) + live GPS
    N->>CR: Flashing P1 alert
    N->>CR: SMS to Control Room Manager
    CR->>G: Operator calls within 60s
    alt no response 2m
        CR->>SUP: Escalate (call)
    end
    alt still no response
        CR->>AM: Escalate; emergency services (100/112)
    end
    Note over CR: All actions timestamped in incident record
```

## 13.6 Payroll (guard-facing)

```mermaid
flowchart LR
    LK[Lock attendance] --> CALC[Calculate per employee]
    CALC --> ADD[+ OT, night allowance, incentives]
    ADD --> DED[- PF/ESI/PT/TDS, late marks, advances]
    DED --> REG[Payroll register]
    REG --> APP[Approve: Payroll Mgr → Org Admin → Owner]
    APP --> BANK[NEFT file]
    APP --> SLIP[Payslips to app]
    APP --> STAT[PF/ESI challan files]
```

Statutory: PF 12%+12% (8.33% EPS + 3.67% EPF), ESI 0.75%+3.25% (gross <₹21k), Professional Tax (state slab), Gratuity provision (15/26 × Basic per year, payable after 5y). Each run is immutable and audited.

## 13.7 Client billing (guard-derived)

Billing reads locked attendance + shift logs at cycle end:

```mermaid
flowchart LR
    PULL[Pull attendance for client] --> CALC[Guard-days × rate + OT + holiday + night]
    CALC --> SLA[Apply SLA penalties]
    SLA --> DRAFT[Draft invoice]
    DRAFT --> REV[Client Mgr review]
    REV --> APP[Org Admin approve]
    APP --> SEND[Dispatch: email + portal]
    SEND --> PAY[Track: Pending → Paid → Reconciled]
```

Billing models: per-guard, per-shift, per-day, attendance-based, monthly, with overtime/holiday/SLA-penalty modifiers. Per-client profitability = revenue − (salaries + PF/ESI + gratuity provision + uniform + training); margin alerts trigger renegotiation review.

## 13.8 Reliever flow (absence)

```mermaid
sequenceDiagram
    participant E as Attendance Engine
    participant SUP as Supervisor
    participant OM as Ops Manager
    participant R as Reliever
    E->>SUP: Guard not checked in (tolerance elapsed)
    SUP->>E: Mark ABSENT (with note)
    E->>OM: Reliever required
    OM->>R: Assign (qualified, available)
    R->>E: Check-in (type = RELIEVER)
    Note over E: SLA breach logged if post uncovered beyond threshold
```
