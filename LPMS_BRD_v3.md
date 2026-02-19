# LEAN PORTFOLIO MANAGEMENT SYSTEM
## Business Requirements Document — Version 3.0 FINAL DRAFT

**Document Version:** 3.0  
**Date:** February 2026  
**Prepared by:** Bader Alshalawi  
**Reviewed by:** Hussam  
**Status:** FINAL DRAFT — GOVERNANCE REFACTOR APPLIED

---

## Governance Refactor Executive Summary (v2.0 → v3.0)

This document represents a complete governance refactor of the LPMS BRD. The changes below have been applied systematically across all sections.

### Roles Removed
- **ADMIN** — fully removed. All user management, audit log access, resource management, and cost-rate administration transferred exclusively to SUPER_ADMIN.
- **CONTRIBUTOR** — fully removed. `FeatureContributorAssignment` table removed from the data model. Feature detail editing is now the exclusive domain of assigned Product Managers.

### Four-Role Model
LPMS now operates with exactly four roles: `SUPER_ADMIN`, `PROGRAM_MANAGER`, `PRODUCT_MANAGER`, `VIEWER`.

### SUPER_ADMIN — Supreme Governance Authority
- Holds full system authority across all modules.
- Only role that can create/archive portfolios, freeze/unfreeze the system, manage users, set cost rates, manage the resource directory, and export audit logs.
- Mandatory approver for all portfolio-level governance transitions.

### Portfolio Approval Tightened
- Portfolio approval (`SUBMITTED → APPROVED`) now requires SUPER_ADMIN as the sole approver.
- Risk RISK02 (self-approval) is resolved by this change.

### Resource Management Centralised
- SUPER_ADMIN exclusively manages the resource directory, cost rates, and assignment deletion.
- Program Managers may view utilisation data only.

### Data Model Simplified
- `FeatureContributorAssignment` entity removed.
- All Contributor-specific governance logic removed.

---

## Table of Contents

1. Executive Summary
2. Scope
3. Stakeholders & User Personas *(UPDATED)*
4. Role Definitions & Permission Matrix *(UPDATED)*
5. System Architecture Overview
6. Functional Requirements *(UPDATED)*
7. Workflow & Status Lifecycle Model *(UPDATED)*
8. Financial Model & Budget Governance
9. Data Model Overview *(UPDATED)*
10. Non-Functional Requirements
11. Risk Register *(UPDATED)*
12. Open Questions *(UPDATED)*
13. Assumptions & Constraints Registry *(UPDATED)*
14. Glossary *(UPDATED)*

---

## 1. Executive Summary

The Lean Portfolio Management System (LPMS) is an enterprise governance platform that provides a single, structured environment for managing technology investments across a hierarchy of Portfolios, Products, Releases, and Features. It replaces fragmented, email-based approval processes and disconnected spreadsheet tracking with a governed, role-enforced, auditable workflow platform.

LPMS is designed for organisations managing multiple strategic technology portfolios simultaneously. Every investment decision — from portfolio creation through feature delivery — is governed by a formal state machine, enforced by role-based access controls, tracked through an immutable audit trail, and reported via real-time financial dashboards.

### 1.1 Problem Statement

Organisations managing technology portfolios without a unified governance platform face five recurring operational failures:

- Approval processes conducted via email and informal meetings produce no auditable record, delay investment decisions, and allow scope creep without accountability.
- Cost tracking exists in disconnected spreadsheets with no connection to the features and products being delivered, preventing variance analysis or meaningful budget governance.
- Feature development status is tracked outside portfolio systems (in tools such as Jira or Excel), breaking traceability between strategic investment decisions and delivery outcomes.
- User access controls are informal, granting over-broad permissions that lead to accidental or unauthorised changes to approved artefacts.
- Emergency situations — such as the need to halt all system activity during an incident — have no mechanism beyond ad-hoc communication, leaving data integrity at risk.

### 1.2 Proposed Solution

LPMS resolves these failures by providing: a formal approval workflow (`DRAFT → SUBMITTED → APPROVED → LOCKED → ARCHIVED`) enforced on every portfolio entity; a five-state feature lifecycle with role-gated transitions; automatic cost rollup from feature to product to portfolio level; a resource management module connecting team utilisation to financial cost; a tamper-evident, append-only audit log; and a Super Admin system-freeze mechanism.

The system is built as a cloud-native single-page application using Next.js 14, PostgreSQL (Supabase), Prisma ORM, and deployed on Vercel serverless infrastructure.

### 1.3 Business Goals & Success Metrics

- **Eliminate informal approval bottlenecks:** 100% of portfolio and product approvals captured with submitter identity, approver identity, timestamp, and — for rejections — a mandatory written reason.
- **Improve portfolio cost visibility:** Actual vs estimated cost variance visible at portfolio, product, release, and feature levels with RAG (red/amber/green) variance indicators.
- **Reduce governance risk:** Zero approved items modifiable without a lock-then-unlock audit trail; self-approval prohibited at all entity levels.
- **Enforce accountability:** Every state transition, cost entry, and user management action traceable to a named actor with IP address and timestamp.
- **Centralise feature lifecycle:** Feature discovery-to-release cycle tracked end-to-end within LPMS; no external spreadsheet tracking required.
- **Optimise resource deployment:** Resource utilisation visible across all portfolios; over-allocation detected before commitment.

---

## 2. Scope

### 2.1 In-Scope Features

- Portfolio lifecycle management: create, edit, submit, approve, reject, lock, unlock, archive
- Product lifecycle management: create, edit, submit, approve, reject, lock, archive within portfolios
- Release planning with Go/No-Go decision gate and structured readiness checklist
- Feature lifecycle management: five-state machine (`DISCOVERY → READY → IN_PROGRESS → RELEASED → ARCHIVED`)
- Resource management: resource directory, cost-rate management, utilisation tracking, assignment management
- Cost tracking: entries by category, estimated vs actual, three-level automatic rollup (Feature → Product → Portfolio)
- Document attachment to any entity (Portfolio, Product, Release, Feature)
- User management: create, edit, role assignment, portfolio assignment, deactivate, reactivate — exclusively by SUPER_ADMIN
- Role-based access control with four defined roles and a granular permission matrix
- System-wide freeze / unfreeze (SUPER_ADMIN only) with mandatory reason
- Audit log: append-only, paginated, filterable, with CSV export
- JWT authentication (HttpOnly cookie + Bearer token) with bcrypt password hashing
- Dashboard: KPI cards, cost trend charts, portfolio comparison, resource utilisation
- Approval SLA tracking with configurable threshold and overdue indicators
- Multi-language support: English (LTR) and Arabic (RTL) — full production-grade localisation

### 2.2 Out-of-Scope Items

- Email, SMS, or push notifications for state transitions — no mail integration
- Single Sign-On (SSO) / SAML / OAuth / external identity provider
- Payment, subscription, or billing functionality
- Native mobile application (iOS / Android)
- Gantt or timeline visualisations
- Real-time collaboration (no WebSocket or Server-Sent Events)
- External analytics platform integration (e.g. Mixpanel, Amplitude)

### 2.3 Assumptions

- **A-01:** The system operates within a single organisational tenant; no multi-tenancy isolation layer is implemented in this version.
- **A-02:** File storage is handled by an external service (to be confirmed — see OQ-03); the system records the file path or object key only.
- **A-03:** Each Portfolio has exactly one assigned Program Manager; the Program Manager cannot be their own approver.
- **A-04:** Product Managers may be assigned to multiple products via the `ProductManagerAssignment` join table.
- **A-05:** All cost entries within a portfolio must use the same currency as the portfolio's `costCurrency` field.
- **A-06:** The `/api/auth/register` endpoint shall be disabled in production; all user creation is exclusively controlled by SUPER_ADMIN.

### 2.4 Constraints

- **C-01:** All non-SUPER_ADMIN write operations are blocked system-wide when the system is frozen.
- **C-02:** State machine transitions are enforced server-side; client-side state changes are decorative only.
- **C-03:** Cost currency is validated per portfolio; cross-currency arithmetic is not performed.
- **C-04:** Self-approval (submitter = approver) is prohibited for all governance transitions.
- **C-05:** Audit log records are append-only; no application API permits deletion or modification of audit entries.
- **C-06:** `JWT_SECRET` must be a minimum of 32 characters; application refuses to start if this constraint is not met.

---

## 3. Stakeholders & User Personas [UPDATED]

### 3.1 Stakeholder Registry

> The ADMIN and CONTRIBUTOR roles have been removed. Their responsibilities have been absorbed by SUPER_ADMIN and PRODUCT_MANAGER respectively.

| Stakeholder | System Role | Primary Interest | Key Needs |
|---|---|---|---|
| Executive Sponsor | Out-of-system consumer | Portfolio ROI, investment visibility | Real-time dashboard with cost and status visibility |
| Super Administrator | Supreme system authority | System integrity, user governance, emergency control | System freeze kill-switch; full audit trail; user management; resource cost-rate control; portfolio approval authority |
| Program Manager | Portfolio owner | Roadmap governance, product oversight, cost rollup | Portfolio submission workflow; product approval; financial dashboards; Go/No-Go gate; view utilisation |
| Product Manager | Product delivery owner | Release planning, feature lifecycle, Go/No-Go | Feature state machine; release checklist; resource assignment; cost entry |
| Viewer | Read-only stakeholder | Status visibility without modification rights | Read-only access to all entities; portfolio and feature status without needing to ask |

---

## 4. Role Definitions & Permission Matrix [UPDATED]

### 4.1 Role Definitions

> LPMS operates with exactly **four roles**. The ADMIN and CONTRIBUTOR roles have been permanently removed.

#### SUPER_ADMIN

The supreme governance authority of the entire LPMS platform. Holds full system access across all entities and all operations. SUPER_ADMIN is the **only** role capable of:

- Creating and archiving portfolios
- Freezing and unfreezing the system
- Creating, editing, deactivating, and reactivating user accounts
- Managing the resource directory and setting cost rates
- Approving or rejecting portfolios at the governance level
- Viewing and exporting the full audit log
- Overriding governance workflows in exceptional circumstances
- Assigning and reassigning Program Managers to portfolios

#### PROGRAM_MANAGER

Assigned to exactly one portfolio via `User.assignedPortfolioId`. Responsible for portfolio-level and product-level governance: submitting the portfolio roadmap, approving or rejecting products within their portfolio (as a distinct approver from the submitter), locking approved entities, and recording Go/No-Go decisions for releases. A Program Manager cannot approve an entity they themselves submitted — this constraint is enforced server-side. Program Managers cannot create portfolios, manage users, manage system configuration, or set resource cost rates.

#### PRODUCT_MANAGER

Assigned to one or more products via the `ProductManagerAssignment` join table. Responsible for product submission, release creation and planning, feature creation and state-machine transitions, cost entry, resource assignment creation, and document management. The Product Manager submits releases for Go/No-Go but cannot record the decision. Product Managers are also the exclusive editors of feature detail fields; the former Contributor role has been subsumed into Product Manager authority.

#### VIEWER

Read-only access to all entities visible to the authenticated user. Cannot create, edit, submit, approve, lock, upload documents, manage cost entries, or perform any write operation. Intended for executive stakeholders who require status visibility without the ability to alter data.

---

### 4.2 Permission Matrix [UPDATED]

> `✓` = Permitted | `–` = Not permitted | `✓*` = Permitted only if not the submitter of the same entity

| Permission | Super Admin | Program Manager | Product Manager | Viewer |
|---|:---:|:---:|:---:|:---:|
| **PORTFOLIO** | | | | |
| Create Portfolio | ✓ | – | – | – |
| Edit Portfolio (DRAFT) | ✓ | ✓ | – | – |
| Submit Portfolio (DRAFT→SUBMITTED) | ✓ | ✓ | – | – |
| Approve Portfolio (SUBMITTED→APPROVED) | ✓ | – | – | – |
| Reject Portfolio (SUBMITTED→REJECTED) | ✓ | – | – | – |
| Lock Portfolio (APPROVED→LOCKED) | ✓ | ✓ | – | – |
| Unlock Portfolio | ✓ | ✓ | – | – |
| Archive Portfolio | ✓ | – | – | – |
| View Portfolio | ✓ | ✓ | ✓ | ✓ |
| **PRODUCT** | | | | |
| Create Product | ✓ | ✓ | – | – |
| Edit Product (DRAFT) | ✓ | ✓ | ✓ | – |
| Submit Product (DRAFT→SUBMITTED) | ✓ | – | ✓ | – |
| Approve Product (SUBMITTED→APPROVED) | ✓ | ✓ | – | – |
| Reject Product | ✓ | ✓ | – | – |
| Lock Product | ✓ | ✓ | – | – |
| View Product | ✓ | ✓ | ✓ | ✓ |
| **RELEASE** | | | | |
| Create Release | ✓ | – | ✓ | – |
| Edit Release (DRAFT) | ✓ | – | ✓ | – |
| Submit Release for Go/No-Go | ✓ | – | ✓ | – |
| Record Go/No-Go Decision | ✓ | ✓ | – | – |
| Lock Release (after GO) | ✓ | – | ✓ | – |
| View Release | ✓ | ✓ | ✓ | ✓ |
| **FEATURE** | | | | |
| Create Feature | ✓ | – | ✓ | – |
| Edit Feature (any state except ARCHIVED) | ✓ | – | ✓ | – |
| Transition Feature State | ✓ | – | ✓ | – |
| View Feature | ✓ | ✓ | ✓ | ✓ |
| **COST** | | | | |
| Create/Edit/Delete Cost Entry | ✓ | ✓ | ✓ | – |
| View Cost Data | ✓ | ✓ | ✓ | – |
| **DOCUMENTS** | | | | |
| Attach Document | ✓ | ✓ | ✓ | – |
| Delete Document | ✓ | ✓ | ✓ | – |
| **USER MANAGEMENT** | | | | |
| Create User | ✓ | – | – | – |
| Edit User | ✓ | – | – | – |
| Deactivate / Reactivate User | ✓ | – | – | – |
| View Users | ✓ | – | – | – |
| **AUDIT** | | | | |
| View Audit Log | ✓ | – | – | – |
| Export Audit Log (CSV) | ✓ | – | – | – |
| **SYSTEM** | | | | |
| Freeze / Unfreeze System | ✓ | – | – | – |
| View System Config | ✓ | – | – | – |
| **RESOURCES** | | | | |
| Manage Resource Directory | ✓ | – | – | – |
| Set / Update Cost Rates | ✓ | – | – | – |
| Create Resource Assignments | ✓ | – | ✓ | – |
| Delete Resource Assignment | ✓ | – | – | – |
| View Resource Utilisation | ✓ | ✓ | ✓ | – |

---

## 5. System Architecture Overview

### 5.1 Architecture Summary

LPMS is a cloud-native Single-Page Application built on the Next.js 14 App Router, deployed on Vercel serverless infrastructure with PostgreSQL as the persistent data store accessed via the Prisma ORM through Supabase connection pooling. Authentication is stateless JWT-based; all permission checks are performed server-side on every API request.

### 5.2 Tier Definitions

- **Presentation Tier:** Next.js 14 React SPA. State management via Zustand (`authStore`, `systemStore`). UI component library: shadcn/ui (Radix UI). Styling: Tailwind CSS with CSS logical properties for RTL support.
- **API Tier:** Next.js API Routes deployed as Vercel Serverless Functions. All business logic, permission checks, state machine enforcement, and audit logging occur at this tier. Security headers applied via `vercel.json`.
- **Data Tier:** PostgreSQL database hosted on Supabase. All access via Prisma ORM. Connection pooling via Supabase PgBouncer (`poolMode=transaction`).
- **Infrastructure:** Vercel (region: `iad1` — US East). Environment variables for all secrets and configuration. Supabase for database hosting and storage (when file storage is implemented).

### 5.3 Key Library Decisions

- **Authentication:** `jsonwebtoken` (JWT signing/verification), `bcryptjs` (password hashing, cost factor 12)
- **ORM:** Prisma with PostgreSQL provider — provides type-safe DB access and transaction support for cost rollup atomicity
- **Permission Engine:** `src/lib/permissions.ts` (RBAC), `src/lib/rbac.ts` (context-sensitive checks including `ProductManagerAssignment` lookup)
- **Audit:** `src/lib/audit.ts` — centralised audit entry creation with IP extraction from Next.js request headers
- **Cost Rollup:** `src/lib/cost-calculator.ts` — executes Feature → Product → Portfolio rollup within a Prisma `$transaction`

---

## 6. Functional Requirements [UPDATED]

> All Contributor and Admin references have been removed. Owning roles have been updated throughout.

### 6.1 Module: Authentication

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR01 | The system shall authenticate users via email and password, issue a signed JWT (HS256, minimum 32-character secret) stored as an HttpOnly, SameSite=Strict cookie named `auth-token` with a 7-day expiry. | SUPER_ADMIN | Must | Valid credentials + ACTIVE status → 7-day JWT cookie set; user redirected to `/dashboard`. |
| FR02 | The system shall support JWT authentication via `Authorization: Bearer` header for programmatic API clients. | SUPER_ADMIN | Should | Valid Bearer token → request authenticated without a cookie; 401 returned for expired or invalid tokens. |
| FR03 | The system shall invalidate a session on logout by clearing the `auth-token` cookie server-side. | SUPER_ADMIN | Must | `POST /api/auth/logout` clears the cookie; subsequent requests return 401. |
| FR04 | The system shall deny authentication to users whose status is `INACTIVE`, returning 401 without issuing a token. | SUPER_ADMIN | Must | INACTIVE user with valid credentials → 401; no JWT issued; audit entry `FAILED_LOGIN/USER` written. |
| FR05 | The system shall enforce a bcrypt password hash with cost factor 12 at the point of user creation and password change. | SUPER_ADMIN | Must | Password stored as bcrypt hash; plaintext never persisted; factor verified at startup via unit test. |
| FR06 | The system shall block all user-creation routes except `POST /api/users` (SUPER_ADMIN-only); the `/api/auth/register` endpoint shall be disabled in production. | SUPER_ADMIN | Must | Direct POST to `/register` in production → 404 or 403; all user creation passes through SUPER_ADMIN-controlled endpoint. |

---

### 6.2 Module: User Management [UPDATED]

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR07 | The system shall allow SUPER_ADMIN to create users providing: email (unique, immutable), full name, role (one of four), temporary password, and optionally an `assignedPortfolioId`. | SUPER_ADMIN | Must | `POST /api/users` with unique email by SUPER_ADMIN → user created with ACTIVE status; `CREATE/USER` audit entry written. |
| FR08 | The system shall prevent modification of a user's email address after account creation; the email field shall be read-only on all edit interfaces. | SUPER_ADMIN | Must | `PATCH /api/users/{id}` with email field → field ignored; no change persisted. |
| FR09 | The system shall allow SUPER_ADMIN to edit user full name, role, `assignedPortfolioId`, and password; all changes shall produce a field-level diff in the audit log. | SUPER_ADMIN | Must | Changed fields visible in `AuditLog.changedFields` as `{field, oldValue, newValue}`; unchanged fields omitted. |
| FR10 | The system shall allow SUPER_ADMIN to deactivate a user account, setting status to `INACTIVE`; deactivated users shall be immediately unable to authenticate. | SUPER_ADMIN | Must | `POST /api/users/{id}/deactivate` → status = INACTIVE; subsequent login attempt returns 401; `DEACTIVATE/USER` audit entry written. |
| FR11 | The system shall allow SUPER_ADMIN to reactivate a deactivated user, restoring ACTIVE status and login capability. | SUPER_ADMIN | Must | `POST /api/users/{id}/reactivate` → status = ACTIVE; login resumes; `REACTIVATE/USER` audit entry written. |
| FR12 | The system shall display a paginated, searchable user directory accessible exclusively to SUPER_ADMIN, showing name, role, status, utilisation percentage, and assigned portfolio. | SUPER_ADMIN | Must | `GET /api/users` returns paginated list (50/page); searchable by name or email; role-gated to SUPER_ADMIN only. |

---

### 6.3 Module: Portfolio Management [UPDATED]

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR13 | The system shall allow only SUPER_ADMIN to create portfolios, providing: name, unique code, description, priority (1–5), estimated budget, cost currency, and assigned Program Manager. | SUPER_ADMIN | Must | `POST /api/portfolios` by non-SUPER_ADMIN → 403; valid creation → portfolio in DRAFT state with SUPER_ADMIN as creator. |
| FR14 | The system shall allow only SUPER_ADMIN to archive a portfolio; archived portfolios are read-only and excluded from active dashboard views. | SUPER_ADMIN | Must | `PATCH /api/portfolios/{id}/archive` → `governanceState = ARCHIVED`; write operations on entity return 409; archive action logged. |
| FR15 | The system shall allow the assigned Program Manager to submit a DRAFT portfolio for approval, transitioning state to SUBMITTED and recording `submittedAt` and `submittedById`. | PROGRAM_MANAGER | Must | Submitter's `assignedPortfolioId` matches target; state = DRAFT; state → SUBMITTED; `SUBMIT/PORTFOLIO` audit entry written. |
| FR16 | The system shall require SUPER_ADMIN as the sole approver of a SUBMITTED portfolio. The approver must differ from the submitter. Program Managers may recommend approval but cannot approve portfolio entities. | SUPER_ADMIN | Must | `approvedById ≠ submittedById` enforced server-side; approving actor must hold SUPER_ADMIN role; state = SUBMITTED → APPROVED; `APPROVE/PORTFOLIO` audit entry written. |
| FR17 | The system shall allow SUPER_ADMIN to reject a SUBMITTED portfolio with a mandatory, non-empty rejection reason, transitioning state to REJECTED and recording `rejectionReason`, `rejectedAt`, and `rejectedById`. | SUPER_ADMIN | Must | Empty reason → 400; state = SUBMITTED → REJECTED; rejection reason visible to submitter on portfolio detail page. |
| FR18 | The system shall allow a REJECTED portfolio to be edited by the assigned Program Manager and re-submitted, resetting the state to DRAFT before submission. | PROGRAM_MANAGER | Must | REJECTED portfolio → editable by assigned PM; re-submission resets state to DRAFT then triggers SUBMITTED transition; re-submit audit entry written. |
| FR19 | The system shall allow the assigned Program Manager to lock an APPROVED portfolio, setting `isLocked=true`, `lockedAt`, and `lockedById`; locked portfolios prevent direct edits to portfolio-level fields. | PROGRAM_MANAGER | Must | state = APPROVED, `isLocked = false` required; lock action → `isLocked=true`; `LOCK/PORTFOLIO` audit entry; subsequent direct-edit attempts return 409. |
| FR20 | The system shall allow the assigned Program Manager to unlock a locked portfolio, resetting `isLocked=false` with `lockedBy` and `lockedAt` cleared; unlock action shall produce an audit entry. | PROGRAM_MANAGER | Must | `UNLOCK/PORTFOLIO` audit entry; portfolio fields become editable. |
| FR21 | The system shall store portfolio financial fields: `estimatedBudget`, `actualCost` (computed via rollup), `costCurrency`; the default currency shall be SAR; currency shall be immutable after the portfolio is APPROVED. | PROGRAM_MANAGER | Must | `actualCost` auto-updated on every cost rollup; `costCurrency` editable only in DRAFT/SUBMITTED states; currency change after APPROVED → 409. |

---

### 6.4 Module: Product Management

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR22 | The system shall allow Program Managers to create products within their assigned portfolio, providing: name, unique code (per portfolio), `businessValue`, `targetClient`, `endUser`, `valueProposition`, and assigning one or more Product Managers. | PROGRAM_MANAGER | Must | `user.assignedPortfolioId` matches `portfolioId`; product created in DRAFT; `CREATE/PRODUCT` audit entry written. |
| FR23 | The system shall allow an assigned Product Manager to submit a DRAFT product for approval, transitioning state to SUBMITTED and recording `submittedAt` and `submittedById`. | PRODUCT_MANAGER | Must | `ProductManagerAssignment` record exists; state = DRAFT → SUBMITTED; `SUBMIT/PRODUCT` audit entry written. |
| FR24 | The system shall allow the parent portfolio's Program Manager to approve a SUBMITTED product, transitioning state to APPROVED; the approver must differ from the submitter. | PROGRAM_MANAGER | Must | `approvedById ≠ submittedById`; product's `portfolioId` matches PM's `assignedPortfolioId`; `APPROVE/PRODUCT` audit entry written. |
| FR25 | The system shall allow the parent portfolio's Program Manager to reject a SUBMITTED product with a mandatory non-empty reason, recording `rejectionReason` and transitioning state to REJECTED. | PROGRAM_MANAGER | Must | Empty reason → 400; `REJECT/PRODUCT` audit entry; rejection reason surfaced to Product Manager. |
| FR26 | The system shall allow an APPROVED product to be locked by the Program Manager, preventing field-level edits until unlocked. | PROGRAM_MANAGER | Must | `isLocked=true` set on APPROVED product; direct field edits return 409; `LOCK/PRODUCT` audit entry written. |
| FR27 | The system shall persist and display all product profile fields: `businessValue`, `targetClient`, `endUser`, `valueProposition`, `estimatedCost`, `actualCost` (rollup), and `costCurrency`. | PRODUCT_MANAGER | Must | All fields returned on `GET /api/products/{id}`; `actualCost` updated via rollup trigger; displayed on product detail page. |

---

### 6.5 Module: Release Management

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR28 | The system shall allow an assigned Product Manager to create a Release under an APPROVED product, providing: version (unique per product), name, description, `startDate`, `endDate`, `estimatedCost`, and a structured readiness checklist. | PRODUCT_MANAGER | Must | Version uniqueness enforced per product; release created in DRAFT; readiness checklist stored as structured array of `{item, completed}` objects, not free-form JSON. |
| FR29 | The system shall allow the assigned Product Manager to manage the readiness checklist via a structured UI, individually marking each checklist item as complete or incomplete. | PRODUCT_MANAGER | Must | `PATCH /api/releases/{id}/checklist` with item ID and completed boolean; each item updated independently; completion status persisted and displayed. |
| FR30 | The system shall allow the assigned Product Manager to submit a Release for a Go/No-Go gate decision, setting `goNogoSubmitted=true` and recording `goNogoSubmittedAt` and `goNogoSubmittedById`. | PRODUCT_MANAGER | Must | `goNogoSubmitted=false` required; state transition recorded; `SUBMIT/RELEASE` audit entry written; decision form activates. |
| FR31 | The system shall restrict Go/No-Go decision recording to a role different from the submitter: the decision shall be recorded by the parent portfolio's Program Manager or SUPER_ADMIN. | PROGRAM_MANAGER | Must | `goNogoDecidedById ≠ goNogoSubmittedById` enforced server-side; decision actor must hold PROGRAM_MANAGER or SUPER_ADMIN role. |
| FR32 | The system shall record a Go/No-Go decision of GO or NO_GO with optional decision notes, storing `goNogoDecision`, `goNogoDecidedAt`, `goNogoDecidedById`, and `goNogoNotes`. | PROGRAM_MANAGER | Must | Decision value must be in `{GO, NO_GO}`; invalid value → 400; `UPDATE/RELEASE` audit entry written with decision in `changedFields`. |
| FR33 | The system shall allow a Release to be locked only after a GO decision has been recorded; the Lock button shall be enabled only when `goNogoDecision='GO'` and `isLocked=false`. | PRODUCT_MANAGER | Must | Lock attempt without prior GO decision → 409; `LOCK/RELEASE` audit entry written after successful lock. |
| FR34 | The system shall allow post-release notes to be added to a locked Release by the assigned Product Manager. | PRODUCT_MANAGER | Could | `PATCH /api/releases/{id}/post-release-notes`; notes persisted; `UPDATE/RELEASE` audit entry written. |

---

### 6.6 Module: Feature Lifecycle [UPDATED]

> The Contributor role has been removed. All feature detail editing is now exclusively performed by assigned Product Managers. The `FeatureContributorAssignment` table has been removed from the data model.

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR35 | The system shall allow assigned Product Managers to create Features linked to a product and optionally to a release, providing: name, description, priority (1–5), `targetUser`, `customerSegmentation`, `valueProposition`, `businessModel`, `risksChallenges`, `estimatedEffort`, and `estimatedCost`. | PRODUCT_MANAGER | Must | Feature created in DISCOVERY state; `CREATE/FEATURE` audit entry; `releaseId` is nullable. |
| FR36 | The system shall enforce a five-state feature lifecycle with the following valid transitions only: `DISCOVERY→READY`; `READY→IN_PROGRESS`; `READY→DISCOVERY` (back-transition); `IN_PROGRESS→RELEASED`; `IN_PROGRESS→READY` (back-transition); `RELEASED→ARCHIVED`. No other transitions shall be permitted. | PRODUCT_MANAGER | Must | Invalid transition attempt → 400 with list of valid next states; transition audit entry records `fromState` and `toState`. |
| FR37 | The system shall restrict feature state transitions to Product Managers assigned to the parent product via the `ProductManagerAssignment` join table. | PRODUCT_MANAGER | Must | `feature:transition` permission check verifies `ProductManagerAssignment` exists for the actor and product; unassigned PM → 403. |
| FR38 | The system shall allow assigned Product Managers to edit all feature detail fields (name, description, `risksChallenges`, `estimatedEffort`, and all other non-computed fields) in any non-ARCHIVED state. | PRODUCT_MANAGER | Must | Product Manager edit attempt on ARCHIVED feature → 403; successful edit → `UPDATE/FEATURE` audit entry; `ProductManagerAssignment` verified. |
| FR39 | The system shall display only the valid next state transitions as actionable buttons on the feature detail page, preventing invalid transitions at the UI layer before any API call. | PRODUCT_MANAGER | Must | UI derives valid next states from `validTransitions[currentState]` map; only valid transitions rendered as active buttons. |
| FR40 | The system shall display all feature profile fields on the feature detail page in labelled sections: Overview, Business Profile (`targetUser`, `customerSegmentation`, `valueProposition`, `businessModel`), Risk & Effort (`risksChallenges`, `estimatedEffort`, `estimatedCost`, `actualCost`), and Lifecycle History. | PRODUCT_MANAGER | Must | `GET /api/features/{id}` returns all fields; UI renders four named sections; lifecycle history tab shows all state transitions with actor and timestamp. |

---

### 6.7 Module: Resource Management [UPDATED]

> Resource Management is now exclusively governed by SUPER_ADMIN. Program Managers may view utilisation data only.

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR41 | The system shall maintain a Resource Directory containing all system users eligible for project assignment, displaying: full name, system role, cost rate (amount + currency), utilisation percentage, and Active/Inactive status. Management of this directory is exclusive to SUPER_ADMIN. | SUPER_ADMIN | Must | `GET /api/resources` returns all users with ACTIVE status and their current utilisation; paginated at 50/page; searchable by name and role; endpoint role-gated to SUPER_ADMIN. |
| FR42 | The system shall allow SUPER_ADMIN to set and update a resource cost rate (amount and currency per month) for each user, which is used in assignment-level monthly cost calculations. | SUPER_ADMIN | Must | `PATCH /api/resources/{userId}/cost-rate` with `{amount, currency}` by SUPER_ADMIN only; cost rate stored on user record; `UPDATE/RESOURCE` audit entry written. |
| FR43 | The system shall calculate and display resource utilisation as the sum of all active assignment utilisation percentages for a given user, categorised as: Available (< 80%), Near Capacity (80–100%), Over-Allocated (> 100%). | SUPER_ADMIN | Must | Utilisation = sum of `assignment.utilisation` for user across all active assignments; threshold categories applied; colour-coded status badge displayed. |
| FR44 | The system shall display dashboard-level resource KPI cards: total Available count, Near Capacity count, Over-Allocated count, and average utilisation across all active resources. Visible to SUPER_ADMIN. | SUPER_ADMIN | Must | KPI cards updated in real time on resource load; counts derived from current utilisation buckets; shown at top of Resource Management page. |
| FR45 | The system shall allow SUPER_ADMIN and Program Managers to create resource assignments linking a user to a product and release, specifying: utilisation percentage, assignment period (`startDate`, `endDate`), and computing monthly cost = `costRate × (utilisation / 100)`. | SUPER_ADMIN | Must | `POST /api/resource-assignments`; monthly cost computed server-side; assignment period validated (`startDate < endDate`); `CREATE/RESOURCE_ASSIGNMENT` audit entry written. |
| FR46 | The system shall display the Assignments tab showing all active resource assignments with: resource name, role, assigned product, assigned release version, period, utilisation percentage, and computed monthly cost. Visible to SUPER_ADMIN and Program Managers. | SUPER_ADMIN | Must | `GET /api/resource-assignments` returns all assignments; filterable by product, release, and user; monthly cost displayed in system currency. |
| FR47 | The system shall allow only SUPER_ADMIN to delete a resource assignment; deletion shall produce an audit entry and recalculate the affected user's utilisation percentage. | SUPER_ADMIN | Must | `DELETE /api/resource-assignments/{id}` by SUPER_ADMIN only; utilisation recalculated; `DELETE/RESOURCE_ASSIGNMENT` audit entry; monthly cost removed from display. |

---

### 6.8 Module: Cost Tracking & Financial Management

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR48 | The system shall allow non-Viewer users (SUPER_ADMIN, PROGRAM_MANAGER, PRODUCT_MANAGER) to create cost entries linked to exactly one entity (Portfolio, Product, Feature, or Release), providing: description, amount, currency, category, and date. | PRODUCT_MANAGER | Must | `entityType` and `entityId` required; exactly one link enforced; category must be one of `{LABOR, INFRASTRUCTURE, LICENSING, THIRD_PARTY, OTHER}`; `CREATE/COST_ENTRY` audit entry written. |
| FR49 | The system shall automatically execute a cost rollup transaction after every cost entry creation, update, or deletion, updating: `Feature.actualCost`, `Product.actualCost`, and `Portfolio.actualCost`; all three updates shall execute within a single database transaction. | PRODUCT_MANAGER | Must | Transaction rolls back entirely if any level fails; rollup triggered on INSERT, UPDATE, DELETE of CostEntry; no partial updates persist. |
| FR50 | The system shall allow cost entry editing and deletion by the original creator or by Program Manager / Super Admin; deletion shall produce an audit entry and trigger a rollup. | PROGRAM_MANAGER | Must | Only creator, PM, or SUPER_ADMIN can modify/delete; `DELETE/COST_ENTRY` audit entry; rollup re-executed after deletion. |
| FR51 | The system shall enforce that all cost entries within a portfolio use the same currency as the portfolio's `costCurrency` field; entries with mismatched currency shall be rejected with a 400 error. | PRODUCT_MANAGER | Must | Cost entry currency ≠ `portfolio.costCurrency` → 400 with message `'Currency must match portfolio currency {code}'`; no cross-currency arithmetic performed. |
| FR52 | The system shall display cost summaries at each level: Portfolio financial widget (`estimatedBudget`, `actualCost`, variance amount, variance %), Product cost summary, Release estimated vs actual cost, Feature cost breakdown by category. | PROGRAM_MANAGER | Must | All summary figures derived from current rollup values; variance colour-coded (green ≤ 0%, amber 1–10%, red > 10%); displayed on respective detail pages. |

---

### 6.9 Module: Document Management

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR53 | The system shall allow non-Viewer users to attach document records to exactly one entity (Portfolio, Product, Release, or Feature), providing: document name, file path or URL, file type, and file size. | PRODUCT_MANAGER | Must | Exactly one `entityId` provided; zero or more than one → 400; document record created; `CREATE/DOCUMENT` audit entry written. |
| FR54 | The system shall display an attached documents panel on every entity detail page (Portfolio, Product, Release, Feature), listing all documents with name, file type, file size, uploader name, and upload date. | PRODUCT_MANAGER | Must | `GET /api/documents?entityType={type}&entityId={id}` returns all documents for entity; panel rendered on each detail page. |
| FR55 | The system shall allow the document uploader, the entity's owning PM, or SUPER_ADMIN to delete a document record; deletion shall produce an audit entry. | PRODUCT_MANAGER | Should | `DELETE /api/documents/{id}` by authorised actor; `DELETE/DOCUMENT` audit entry; document record removed from panel immediately. |

---

### 6.10 Module: System Administration [UPDATED]

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR56 | The system shall allow only SUPER_ADMIN to activate a system-wide freeze, requiring a mandatory non-empty reason; freeze state shall be stored as a `SystemConfig` singleton record. | SUPER_ADMIN | Must | Empty reason → 400; valid freeze → all non-SUPER_ADMIN write operations return 403 with message `'System is frozen: {reason}'`. |
| FR57 | The system shall display a persistent, prominent red banner at the top of all pages for all authenticated users when the system is frozen, showing the freeze reason and timestamp. | SUPER_ADMIN | Must | `isFrozen=true` → SystemBanner component renders above navigation; banner cannot be dismissed by non-SUPER_ADMIN; banner removed immediately on unfreeze. |
| FR58 | The system shall allow only SUPER_ADMIN to unfreeze the system; unfreeze shall clear the frozen flag and produce a `UNFREEZE/SYSTEM` audit entry. | SUPER_ADMIN | Must | `POST /api/system/unfreeze` by SUPER_ADMIN → `frozen=false`; `UNFREEZE/SYSTEM` audit entry; banner removed; writes resume immediately. |
| FR59 | The system shall persist every significant action in an append-only audit log with: timestamp, `actorUserId`, `actorEmail`, `actorName`, action type, `entityType`, `entityId`, `entityName`, `changedFields` (JSON diff), comment, `ipAddress`, and `userAgent`. | SUPER_ADMIN | Must | AuditLog record created after every audited action; no audit records shall be deletable via any API. |
| FR60 | The system shall provide SUPER_ADMIN with an Audit Log page displaying entries paginated at 50 per page, filterable by `entityType`, action type, actor email, and date range; each entry shall be expandable to show full field-diff detail. | SUPER_ADMIN | Must | `GET /api/audit-log` with optional query params; role-gated to SUPER_ADMIN; expandable row reveals `changedFields` JSON. |
| FR61 | The system shall provide a SUPER_ADMIN-triggered CSV export of the filtered audit log, generating a file with all columns including field-diff as a formatted string. | SUPER_ADMIN | Should | `GET /api/audit-log/export?{filters}` returns `Content-Type: text/csv`; role-gated to SUPER_ADMIN. |

---

### 6.11 Module: Notifications & Pending Actions

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR62 | The system shall display in-app notification badges when there are pending actions: pending product approvals for Program Managers, pending Go/No-Go decisions for Program Managers; pending portfolio approvals displayed to SUPER_ADMIN. | PROGRAM_MANAGER | Should | Badge count derived from server-side query of entities in SUBMITTED state; badge displayed on relevant nav items; cleared when all pending items are actioned. |
| FR63 | The system shall display a dashboard-level 'Pending Actions' widget for Program Managers listing all SUBMITTED products requiring approval; SUPER_ADMIN sees SUBMITTED portfolios. | PROGRAM_MANAGER | Should | Widget queries entities WHERE `governanceState='SUBMITTED'`; sorted by `submittedAt` ascending (oldest first). |
| FR64 | The system shall surface overdue-approval indicators on SUBMITTED entities that have not been actioned within a configurable SLA threshold (default: 5 business days). | PROGRAM_MANAGER | Could | SLA threshold configurable via SystemConfig key `approval_sla_days`; entities exceeding threshold display amber 'Overdue' badge; SLA calculated in business days excluding weekends. |

---

### 6.12 Module: Dashboard & Reporting [UPDATED]

| FR ID | Requirement | Owning Role | Priority | Acceptance Criteria |
|---|---|---|:---:|---|
| FR65 | The system shall provide a main Dashboard page with KPI cards: Total Portfolios (by state breakdown), Total Products, Active Releases, Features In Progress, Total Portfolio Budget, Total Actual Cost, and Budget Variance %. | VIEWER | Must | KPI cards derived from live database aggregates; visible to all roles; Portfolio-level financial KPIs visible to SUPER_ADMIN and PROGRAM_MANAGER only. |
| FR66 | The system shall provide a cost trend line chart showing monthly `actualCost` aggregated across all portfolios over the trailing 12 months. | PROGRAM_MANAGER | Should | Chart data derived from `CostEntry.date` aggregated by month; visible to PROGRAM_MANAGER and SUPER_ADMIN. |
| FR67 | The system shall provide a cost distribution doughnut chart breaking down total actual cost by CostEntry category. | PROGRAM_MANAGER | Should | Chart data aggregated from all active CostEntry records by category; displayed on Dashboard and Portfolio Financial tab. |
| FR68 | The system shall provide a portfolio comparison bar chart showing `estimatedBudget` vs `actualCost` per portfolio. | PROGRAM_MANAGER | Should | One bar pair per portfolio; colour-coded by variance (green / amber / red); click-through navigates to portfolio detail. |
| FR69 | The system shall provide a Resource Utilisation dashboard showing: total available resources, near-capacity count, over-allocated count, average utilisation %, and a per-resource utilisation bar chart. Visible to SUPER_ADMIN and Program Managers. | SUPER_ADMIN | Must | Utilisation calculated at page load; threshold buckets applied; chart ordered by utilisation descending. |
| FR70 | The system shall provide a Portfolio Financial Detail view showing: `estimatedBudget` vs `actualCost` gauge, cost category breakdown, and cost rollup waterfall (Portfolio → Products → Features). | PROGRAM_MANAGER | Must | Waterfall shows each level's contribution; variance percentage shown in RAG colour; all figures derived from current rollup values. |

---

## 7. Workflow & Status Lifecycle Model [UPDATED]

### 7.1 Governance State Machine

All Portfolio and Product entities pass through a linear governance state machine. State transitions are strictly enforced server-side; invalid transitions return HTTP 400. Every transition is recorded in the audit log with actor identity, old state, new state, and timestamp.

- **DRAFT:** Entity is created and editable. Governance actions (submit, approve) are not yet available.
- **SUBMITTED:** Entity has been submitted for approval. The submitting actor cannot approve the same entity. No further edits to the entity's core fields are permitted until a decision is reached.
- **APPROVED:** Entity has been approved by an authorised actor. Lock action becomes available.
- **REJECTED:** Entity was rejected with a mandatory reason. The entity reverts to an editable DRAFT-equivalent state, allowing the submitter to revise and re-submit.
- **LOCKED:** Entity is locked against direct field edits. An explicit Unlock action — itself audited — is required before further edits.
- **ARCHIVED:** Terminal state. Entity is read-only and excluded from active operational views. Archive requires SUPER_ADMIN authority.

### 7.2 Feature Lifecycle State Machine

Features follow a separate five-state lifecycle focused on delivery progress. Back-transitions are explicitly supported. Feature editing is performed exclusively by assigned Product Managers in all non-ARCHIVED states.

- **DISCOVERY:** Feature identified but not yet refined or ready for development.
- **READY:** Feature sufficiently defined and ready to be taken into active development.
- **IN_PROGRESS:** Feature actively being implemented. Assigned Product Managers may edit all feature detail fields.
- **RELEASED:** Feature delivered. Can be archived to remove from active backlogs.
- **ARCHIVED:** Terminal state. No further transitions permitted.

### 7.3 Release Go/No-Go Gate

Releases carry a two-field Go/No-Go gate: `goNogoSubmitted` (boolean) and `goNogoDecision` (`GO | NO_GO | null`). The `isLocked` flag is only settable after `goNogoDecision = 'GO'` has been recorded. The decision must be recorded by a different actor than the submitter (Program Manager or SUPER_ADMIN).

### 7.4 Complete Workflow Transition Table [UPDATED]

| Entity | From State | Action | To State | Authorised Actor | Guard Condition |
|---|---|---|---|---|---|
| Portfolio | — | Create | DRAFT | SUPER_ADMIN | System not frozen |
| Portfolio | DRAFT | Submit Roadmap | SUBMITTED | PROGRAM_MANAGER | `assignedPortfolioId` matches; system not frozen |
| Portfolio | SUBMITTED | Approve | APPROVED | **SUPER_ADMIN** | `approvedById ≠ submittedById`; actor must be SUPER_ADMIN; state = SUBMITTED |
| Portfolio | SUBMITTED | Reject | REJECTED | **SUPER_ADMIN** | Rejection reason non-empty; actor must be SUPER_ADMIN; approver ≠ submitter |
| Portfolio | REJECTED | Edit & Resubmit | DRAFT → SUBMITTED | PROGRAM_MANAGER | Re-edit permitted; re-submission follows standard submit rules |
| Portfolio | APPROVED | Lock | APPROVED (isLocked=true) | PROGRAM_MANAGER | state = APPROVED; isLocked = false |
| Portfolio | APPROVED (locked) | Unlock | APPROVED (isLocked=false) | PROGRAM_MANAGER | isLocked = true |
| Portfolio | APPROVED/LOCKED | Archive | ARCHIVED | SUPER_ADMIN | No active products in DRAFT or SUBMITTED state |
| Product | — | Create | DRAFT | PROGRAM_MANAGER | Parent portfolio not ARCHIVED; system not frozen |
| Product | DRAFT | Submit Roadmap | SUBMITTED | PRODUCT_MANAGER | `ProductManagerAssignment` exists; system not frozen |
| Product | SUBMITTED | Approve | APPROVED | PROGRAM_MANAGER | Portfolio PM's `assignedPortfolioId` matches; approver ≠ submitter |
| Product | SUBMITTED | Reject | REJECTED | PROGRAM_MANAGER | Rejection reason non-empty |
| Product | REJECTED | Edit & Resubmit | DRAFT → SUBMITTED | PRODUCT_MANAGER | Product editable in REJECTED state; standard submit rules apply |
| Product | APPROVED | Lock | APPROVED (isLocked=true) | PROGRAM_MANAGER | state = APPROVED; isLocked = false |
| Release | — | Create | DRAFT | PRODUCT_MANAGER | Parent product in APPROVED state; system not frozen |
| Release | DRAFT | Submit for Go/No-Go | DRAFT (goNogoSubmitted=true) | PRODUCT_MANAGER | `goNogoSubmitted = false`; system not frozen |
| Release | goNogoSubmitted=true | Record GO | DRAFT (goNogoDecision=GO) | PROGRAM_MANAGER / SUPER_ADMIN | `goNogoDecidedById ≠ goNogoSubmittedById` |
| Release | goNogoSubmitted=true | Record NO_GO | DRAFT (goNogoDecision=NO_GO) | PROGRAM_MANAGER / SUPER_ADMIN | `goNogoDecidedById ≠ goNogoSubmittedById`; remediation expected |
| Release | goNogoDecision=GO | Lock Release | DRAFT (isLocked=true) | PRODUCT_MANAGER | `goNogoDecision = GO`; isLocked = false |
| Feature | — | Create | DISCOVERY | PRODUCT_MANAGER | Parent product in APPROVED state; system not frozen |
| Feature | DISCOVERY | Advance | READY | PRODUCT_MANAGER | `ProductManagerAssignment` exists |
| Feature | READY | Advance | IN_PROGRESS | PRODUCT_MANAGER | `ProductManagerAssignment` exists |
| Feature | READY | Regress | DISCOVERY | PRODUCT_MANAGER | Back-transition; audit entry records reason |
| Feature | IN_PROGRESS | Advance | RELEASED | PRODUCT_MANAGER | `ProductManagerAssignment` exists |
| Feature | IN_PROGRESS | Regress | READY | PRODUCT_MANAGER | Back-transition; audit entry records reason |
| Feature | RELEASED | Archive | ARCHIVED | PRODUCT_MANAGER | RELEASED state required |

---

## 8. Financial Model & Budget Governance

### 8.1 Cost Rollup Architecture

Actual costs flow upward through a three-level hierarchy executed within a single atomic database transaction. No partial rollup states persist. The rollup is triggered on every creation, update, and deletion of a `CostEntry` record.

- **Level 1 — Feature:** `Feature.actualCost` = sum of all `CostEntry` records where `entityType = 'FEATURE'` AND `entityId = feature.id`
- **Level 2 — Product:** `Product.actualCost` = sum of all linked `Feature.actualCost` values + sum of direct `CostEntry` records where `entityType = 'PRODUCT'` AND `entityId = product.id`
- **Level 3 — Portfolio:** `Portfolio.actualCost` = sum of all linked `Product.actualCost` values

### 8.2 Cost Entry Rules

- Cost entries are linked to exactly one entity (Portfolio, Product, Feature, or Release).
- All cost entries within a portfolio must use the same currency as the portfolio's `costCurrency` field; mismatched entries are rejected with HTTP 400.
- Permitted cost categories: `LABOR`, `INFRASTRUCTURE`, `LICENSING`, `THIRD_PARTY`, `OTHER`.
- Cost entries may be created by `PROGRAM_MANAGER`, `PRODUCT_MANAGER`, and `SUPER_ADMIN` roles. `VIEWER` cannot create cost entries.
- The original creator, the parent entity's Program Manager, and SUPER_ADMIN may edit or delete a cost entry. Deletion triggers a full rollup recalculation.

### 8.3 Resource Assignment Cost Calculation

Monthly cost for a resource assignment is calculated as: `monthlyRateCached = user.costRate × (assignment.utilisation / 100)`. This value is cached on the `ResourceAssignment` record at creation and updated if either the cost rate or the utilisation percentage is modified. Resource assignment costs are informational and feed into financial reporting but do not automatically create `CostEntry` records; a separate `CostEntry` must be created to affect the rollup.

### 8.4 Budget Governance Rules

- A portfolio's `costCurrency` is immutable after the portfolio reaches APPROVED state; currency change attempts return HTTP 409.
- Variance is calculated as: `variance = actualCost − estimatedBudget`; `variance % = (variance / estimatedBudget) × 100`.
- Variance colour-coding: green = variance ≤ 0% (at or under budget); amber = 0% < variance ≤ 10% (marginal overrun); red = variance > 10% (significant overrun).
- Estimated budget is editable in DRAFT and SUBMITTED states; it becomes read-only once the portfolio reaches APPROVED state.

---

## 9. Data Model Overview [UPDATED]

### 9.1 Entity Relationship Summary

> The `FeatureContributorAssignment` entity has been removed.

```
User --< ProductManagerAssignment >-- Product
User --< ResourceAssignment >-- Product
Portfolio --< Product --< Release
Product --< Feature (releaseId nullable FK)
Portfolio | Product | Release | Feature --< Document
Portfolio | Product | Feature | Release --< CostEntry
User --< AuditLog
SystemConfig (singleton keys: system_frozen, approval_sla_days)
```

### 9.2 Cascade & Integrity Rules

- Portfolio deleted → Products, Documents cascade; AuditLog entries retain entity reference as historical record.
- Product deleted → Releases, Features, Documents cascade.
- Release deleted → Documents cascade; `Feature.releaseId` → SetNull (features are not deleted).
- Feature deleted → Documents, CostEntries cascade; rollup recalculated up the hierarchy.

### 9.3 Data Dictionary [UPDATED]

> `FeatureContributorAssignment` removed. `User.role` enum restricted to 4 values.

| Entity | Key Fields | Notes & Constraints |
|---|---|---|
| **User** | `id`, `email` (unique, immutable), `passwordHash`, `name`, `role` (enum: `SUPER_ADMIN \| PROGRAM_MANAGER \| PRODUCT_MANAGER \| VIEWER`), `status` (`ACTIVE\|INACTIVE`), `avatarUrl`, `assignedPortfolioId` (FK nullable), `costRate` (decimal), `costRateCurrency`, `createdAt`, `updatedAt` | Default role: VIEWER. Email immutable after creation. `costRate` used in resource assignment calculations. Role enum restricted to 4 values. |
| **Portfolio** | `id`, `name`, `code` (unique), `description`, `governanceState` (enum), `isLocked` (bool), `lockedAt`, `lockedById`, `priority` (1–5), `programManagerId` (FK), `estimatedBudget` (decimal), `actualCost` (decimal, rollup), `costCurrency`, `submittedAt`, `submittedById`, `approvedAt`, `approvedById`, `rejectedAt`, `rejectedById`, `rejectionReason`, `createdAt`, `updatedAt` | Cascade deletes to Products, Documents. `costCurrency` immutable after APPROVED. `actualCost` = sum of Products' `actualCost`. |
| **Product** | `id`, `portfolioId` (FK), `name`, `code` (unique per portfolio), `businessValue`, `targetClient`, `endUser`, `valueProposition`, `governanceState` (enum), `isLocked` (bool), `estimatedCost`, `actualCost` (rollup), `costCurrency`, `submittedAt`, `submittedById`, `approvedAt`, `approvedById`, `rejectedAt`, `rejectedById`, `rejectionReason`, `createdAt`, `updatedAt` | Cascade deletes to Releases, Features, Documents. `actualCost` = sum of Features' `actualCost` + direct product CostEntries. |
| **Release** | `id`, `productId` (FK), `version` (unique per product), `name`, `description`, `startDate`, `endDate`, `governanceState` (enum), `isLocked` (bool), `goNogoSubmitted` (bool), `goNogoSubmittedAt`, `goNogoSubmittedById`, `goNogoDecision` (`GO\|NO_GO\|null`), `goNogoDecidedAt`, `goNogoDecidedById`, `goNogoNotes`, `readinessChecklist` (JSON array of `{id, item, completed}`), `postReleaseNotes`, `estimatedCost`, `actualCost`, `createdAt`, `updatedAt` | Cascade deletes to Documents. `Feature.releaseId` → SetNull on Release delete. |
| **Feature** | `id`, `productId` (FK), `releaseId` (nullable FK), `name`, `description`, `state` (enum), `priority` (1–5), `targetUser`, `customerSegmentation`, `valueProposition`, `businessModel`, `risksChallenges`, `ownerId` (FK), `estimatedEffort`, `estimatedCost`, `actualCost` (rollup), `createdAt`, `updatedAt` | SetNull on Release delete. `actualCost` = sum of linked CostEntries where `entityType=FEATURE`. |
| **CostEntry** | `id`, `entityType` (`PORTFOLIO\|PRODUCT\|FEATURE\|RELEASE`), `entityId`, `description`, `amount` (decimal), `currency` (must match parent portfolio currency), `category` (enum), `date`, `recordedById` (FK), `createdAt`, `updatedAt` | Indexed on `(entityType, entityId)`. Triggers rollup transaction on INSERT, UPDATE, DELETE. |
| **Document** | `id`, `name`, `filePath` (string), `fileType`, `fileSize` (bytes), `portfolioId \| productId \| featureId \| releaseId` (exactly one non-null), `uploadedById` (FK), `createdAt` | Cascade deletes with parent entity. Exactly-one-link constraint enforced server-side. |
| **AuditLog** | `id`, `timestamp`, `actorUserId`, `actorEmail`, `actorName`, `action` (enum), `entityType` (enum), `entityId`, `entityName`, `changedFields` (JSON), `comment`, `ipAddress`, `userAgent` | Append-only. No DELETE endpoint. Composite index on `(entityType, action, timestamp)`. Paginated 50/page. |
| **ResourceAssignment** | `id`, `userId` (FK), `productId` (FK), `releaseId` (nullable FK), `utilisation` (0–200 decimal %), `startDate`, `endDate`, `monthlyRateCached` (computed), `assignedById`, `createdAt`, `updatedAt` | `monthlyRateCached = user.costRate × (utilisation/100)`. Unique constraint: `(userId, productId, releaseId, startDate)`. |
| **SystemConfig** | `id`, `key` (unique), `value` (JSON), `updatedBy`, `updatedAt` | Singleton key: `system_frozen` → `{frozen: bool, reason: string, frozenAt: timestamp, frozenBy: userId}`. Key: `approval_sla_days` → `{days: number}`. |
| **ProductManagerAssignment** | `id`, `userId` (FK), `productId` (FK), `assignedAt`, `assignedById` | Unique `(userId, productId)`. Governs `product:submit`, `product:transition`, `release:create`. |

---

## 10. Non-Functional Requirements

| NFR-ID | Category | Requirement | Verification Method |
|---|---|---|---|
| NFR01 | Security — Authentication | Passwords hashed with bcrypt cost factor 12. JWT secret ≥ 32 characters enforced at startup; application shall throw and refuse to start if `JWT_SECRET` is not set. No hardcoded fallback secret permitted. | Startup test verifies `JWT_SECRET` length; bcrypt factor verified in unit test. |
| NFR02 | Security — Transport & Cookie | All API routes served over HTTPS. `auth-token` cookie set with `HttpOnly=true`, `SameSite=Strict`, `Secure=true`. CSRF middleware applied to all state-changing API routes. | Penetration test verifies cookie attributes; CSRF token required on POST/PATCH/DELETE. |
| NFR03 | Security — Headers | All `/api/*` routes return security headers: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`. | Automated header check on all API routes as part of CI pipeline. |
| NFR04 | Security — Rate Limiting | Authentication endpoints (`POST /api/auth/login`) rate-limited to 10 requests per minute per IP address using Vercel Edge middleware or Upstash. | Load test confirms 429 returned after 10 requests/minute from same IP. |
| NFR05 | Performance — API Response | API responses (excluding export endpoints) shall complete within 500 ms at p95 under normal load (≤ 100 concurrent users). | Performance test suite with k6 measures p95 latency; alerting configured. |
| NFR06 | Performance — Cost Rollup | Cost rollup transaction shall complete within 200 ms; maximum rollup depth is 3 levels (Feature → Product → Portfolio). | Rollup execution time logged; database transaction timeout set to 5 seconds. |
| NFR07 | Performance — Audit Log Query | Paginated audit log queries shall return within 200 ms with composite indexes on `(entity_type, action)` and `(timestamp)`. | Index existence verified in CI; query plan analysed for sequential scans. |
| NFR08 | Availability | Deployed on Vercel serverless functions (target: 99.9% monthly uptime). PostgreSQL via Supabase with connection pooling (minimum pool size 5). | Uptime monitored via external health-check on `GET /api/health` every 60 seconds. |
| NFR09 | Scalability | Stateless JWT design supports horizontal scaling without session state. System designed for organisational scale: up to 500 users, 50 portfolios, 500 products. | Load test to 200 concurrent users; no stateful session dependencies. |
| NFR10 | Accessibility | All UI components built with Radix UI (Keyboard navigation, ARIA labels, focus management). Target: WCAG 2.1 AA compliance. | Automated axe-core scan in CI; manual keyboard navigation test for all forms. |
| NFR11 | Internationalisation | UI shall support English (LTR) and Arabic (RTL) locales. All translatable strings managed via i18n resource files. Arabic locale shall render full RTL layout using CSS logical properties. | Language toggle switches locale and layout direction; all strings resolved from locale file; no hardcoded English strings in components. |
| NFR12 | Audit / Compliance | All state-changing operations produce an AuditLog record with IP address and user agent. Audit records are append-only; no DELETE or UPDATE operations are permitted on the AuditLog table via the application API. | Attempt to delete audit record via API → 405; DB-level audit record count monotonically increasing. |
| NFR13 | Backup / Disaster Recovery | Database backup managed by Supabase platform (daily automated backups, 7-day retention). RTO target: 4 hours. RPO target: 24 hours. Recovery procedure documented in operations runbook. | RTO/RPO targets reviewed with infrastructure team; restore test performed quarterly. |
| NFR14 | Configuration | All environment-sensitive values supplied via environment variables. Required: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (≥ 32 chars), `JWT_EXPIRES_IN` (default 7d), `APPROVAL_SLA_DAYS` (default 5). Application shall fail fast at startup if required variables are absent. | Startup validation rejects launch if any required variable is missing or fails constraint. |

---

## 11. Risk Register [UPDATED]

> RISK02 (self-approval) is **resolved** by the governance refactor. Portfolio approval now requires SUPER_ADMIN exclusively.

| Risk ID | Severity | Description | Category | Remediation |
|---|---|---|---|---|
| RISK01 | Critical | Hardcoded JWT secret fallback in `src/lib/auth.ts` — if `JWT_SECRET` is not set, all tokens can be forged. | Security | Remove fallback immediately. Implement startup guard that throws and halts process if `JWT_SECRET` is absent or shorter than 32 characters. |
| RISK02 | **Resolved** | Self-approval of portfolios — previously the same PROGRAM_MANAGER could submit and approve the same entity. **RESOLVED:** Portfolio approval now requires SUPER_ADMIN exclusively; self-approval prohibited server-side. | Governance | Resolved by governance refactor. `approvedById ≠ submittedById` enforced server-side. SUPER_ADMIN is the mandatory portfolio approver. |
| RISK03 | High | Go/No-Go decision uses the same permission as submission; the submitting Product Manager can record the GO decision for their own release. | Governance | Add `release:decide-go-nogo` permission restricted to PROGRAM_MANAGER and SUPER_ADMIN roles only. |
| RISK04 | High | File storage is a stub — `filePath` stored as a plain string with no upload handler or signed URL generation. | Functional | Integrate Supabase Storage or S3-compatible backend; generate pre-signed upload URLs; store object key rather than client-supplied path. |
| RISK05 | Medium | No audit log database indexes on `action`, `entityType`, or `timestamp` columns — queries will degrade as log volume grows. | Performance | Add composite B-tree indexes: `(entity_type, action)`, `(timestamp DESC)`. Run `EXPLAIN ANALYSE` in staging to verify. |
| RISK06 | Medium | No CSRF protection — JWT stored in cookie without `SameSite=Strict`; cross-site request forgery is possible on state-changing endpoints. | Security | Set `SameSite=Strict` on `auth-token` cookie. Add CSRF token middleware to all POST/PATCH/DELETE routes. |
| RISK07 | Medium | Cost currency mismatch — rollup sums amounts without currency conversion when entries use different currencies. | Financial | Enforce single currency per portfolio (FR51). Reject cost entries with mismatched currency with 400 error. |
| RISK08 | Medium | No rate limiting on authentication endpoints — brute-force attacks against `/api/auth/login` are unrestricted. | Security | Implement Vercel Edge rate limiting: 10 requests/minute per IP on authentication routes. Return 429 on threshold breach. |
| RISK09 | Low | N+1 database queries in `canPerform()` permission checks for product and feature ownership lookups. | Performance | Cache entity ownership lookups using a short-lived (60-second TTL) in-memory or Redis cache layer. |

---

## 12. Open Questions for Stakeholder Resolution [UPDATED]

| OQ-ID | Urgency | Question | Decision Needed By |
|---|---|---|---|
| OQ-01 | **Resolved** | Who is the authorised approver of a portfolio once self-approval is prohibited? **RESOLVED:** SUPER_ADMIN is the mandatory and exclusive approver for portfolio-level entities. Program Managers may recommend but cannot approve portfolios. | Resolved. Permission matrix and FR16 updated accordingly. |
| OQ-02 | Medium | Is multi-tenancy (multiple organisations sharing the system) a future requirement? The current schema has no tenant-isolation column. | If yes, add `tenantId` to all entities before data volume makes migration costly. |
| OQ-03 | High | What is the file storage backend? (Supabase Storage, Azure Blob, S3) — impacts signed-URL generation and attachment security model. | Confirm storage vendor; implement adapter before document management Sprint 2. |
| OQ-04 | Medium | Are email or push notifications required for state-transition events (e.g. portfolio submitted, approval decision recorded)? No mail integration exists. | Define notification channels and triggers; scope separately or defer to Phase 2. |
| OQ-05 | Medium | Is there a requirement for time-triggered portfolio or product archival (e.g. archive after 12 months in APPROVED/LOCKED state)? | Confirm business rule; implement scheduled archive job or SUPER_ADMIN-triggered archive only. |
| OQ-06 | High | Should the release readiness checklist be a structured array (array of `{id, item, completed}`) or remain free-form JSON? | Adopt structured array per FR-28; confirm maximum checklist items per release. |
| OQ-07 | Medium | Are there SLA requirements for approval turnaround (e.g. portfolios approved within 5 business days)? | Define SLA values; configure via SystemConfig key `approval_sla_days`; implement overdue badge per FR-64. |
| OQ-08 | High | Is the VIEWER role intended to see only their own portfolio's data, or all portfolios globally? Currently all authenticated users see all entities. | Define visibility scope for VIEWER; implement row-level filtering if scoped access required. |
| OQ-09 | Should | Is audit log CSV/PDF export required for compliance filings? CSV export implemented for SUPER_ADMIN only. | CSV export per FR61 gated to SUPER_ADMIN; PDF export deferred to Phase 2. |
| OQ-10 | Medium | What are the disaster recovery RTO and RPO targets for the PostgreSQL database? Currently delegated entirely to Supabase. | Confirm RTO/RPO with infrastructure team; document in operations runbook. |
| OQ-11 | **Resolved** | Is self-service user registration (`/api/auth/register`) intentional or should all user creation be SUPER_ADMIN-controlled only? **RESOLVED:** All user creation is SUPER_ADMIN-controlled. Registration endpoint disabled in production (FR06). | Resolved. |
| OQ-12 | Medium | Is full Arabic localisation (RTL layout and translated strings) a committed requirement for the initial release or a Phase 2 stub? | Confirm localisation scope; if committed, all Sprint 1 components must support RTL from the outset. |

---

## 13. Assumptions & Constraints Registry [UPDATED]

| ID | Type | Statement | Impact if Wrong |
|---|---|---|---|
| A-01 | Assumption | Single-tenant architecture; no organisation isolation layer. | Multi-tenancy retrofit is costly; if required, add `tenantId` to all entities before first data entry. |
| A-02 | Assumption | File storage handled externally; system stores path/key only. | Document attachment feature unusable until storage backend is confirmed and integrated. |
| A-03 | Assumption | Each portfolio has exactly one Program Manager. | If multiple PMs per portfolio required, `assignedPortfolioId` → join table. |
| A-04 | Assumption | A Product Manager may be assigned to multiple products via `ProductManagerAssignment`. | No impact — join table already supports many-to-many. |
| A-05 | Assumption | All cost entries within a portfolio use the portfolio's currency (default SAR). | Multi-currency rollup requires a conversion service and FX rate management. |
| A-06 | Assumption | The `/api/auth/register` self-service registration endpoint is disabled in production; all user creation is exclusively SUPER_ADMIN-controlled. | Any accessible register endpoint is a security vulnerability allowing unauthorised user creation. |
| C-01 | Constraint | All non-SUPER_ADMIN write operations are blocked system-wide when frozen. | Freeze mechanism non-negotiable for incident management compliance. |
| C-02 | Constraint | State machine transitions enforced server-side; client-side checks are decorative. | Client-side-only enforcement creates API-level bypass vulnerability. |
| C-03 | Constraint | Currency is validated per portfolio; cross-currency arithmetic is not performed. | Cost rollup figures become meaningless if different currencies are mixed without conversion. |
| C-04 | Constraint | Self-approval (submitter = approver) is prohibited for all governance transitions. | Self-approval nullifies governance controls; enforced server-side with 403 response. |
| C-05 | Constraint | Audit log records are append-only; no API permits deletion or update of audit entries. | Compliance and accountability requirements mandate immutable audit trail. |
| C-06 | Constraint | `JWT_SECRET` must be ≥ 32 characters; application refuses to start if unset. | Short or absent secret allows token forgery; startup guard is the last defence. |

---

## 14. Glossary [UPDATED]

> ADMIN, Contributor, and FeatureContributorAssignment entries removed. Four-role model definitions below.

| Term | Definition |
|---|---|
| LPMS | Lean Portfolio Management System — this application. |
| Portfolio | A strategic grouping of related Products owned by a Program Manager. |
| Product | A deliverable initiative within a Portfolio, owned by one or more Product Managers. |
| Release | A versioned delivery milestone for a Product containing a set of Features. |
| Feature | A discrete unit of functionality being built within a Product. |
| GovernanceState | Approval lifecycle: `DRAFT → SUBMITTED → APPROVED/REJECTED → LOCKED → ARCHIVED`. |
| FeatureState | Development lifecycle: `DISCOVERY → READY → IN_PROGRESS → RELEASED → ARCHIVED`. |
| Go/No-Go | A binary release-gate decision (`GO` or `NO_GO`) required before locking a Release. |
| System Freeze | A SUPER_ADMIN-only control that blocks all non-SUPER_ADMIN write operations system-wide. |
| SUPER_ADMIN | Supreme system authority. The only role that can create/archive portfolios, manage users, manage the resource directory, set cost rates, approve portfolios, and freeze/unfreeze the system. |
| Program Manager | Role assigned to exactly one Portfolio; governs roadmap submission and product approvals within that portfolio. |
| Product Manager | Role assigned to one or more Products via `ProductManagerAssignment` join table. Responsible for feature lifecycle, release management, and cost entry. |
| Viewer | Read-only role; cannot create, edit, submit, upload, or manage costs. |
| Cost Rollup | Automatic propagation of `actualCost` totals: Features → Products → Portfolios. |
| Audit Log | Append-only record of every significant system action with actor, IP, and field diff. |
| Resource Assignment | A record linking a User to a Product/Release for a defined period at a specified utilisation percentage. |
| Utilisation | Percentage of a resource's capacity allocated across all active assignments; > 100% indicates over-allocation. |
| SAR | Saudi Riyal — default cost currency for all portfolios unless overridden at creation. |
| JWT | JSON Web Token — stateless authentication credential issued on login with 7-day expiry. |
| RBAC | Role-Based Access Control — the permission model governing all API endpoint access. |

---

*End of Business Requirements Document — LPMS v3.0*  
*All requirements are evidence-based. Open questions in Section 12 require stakeholder resolution before sprint execution.*
