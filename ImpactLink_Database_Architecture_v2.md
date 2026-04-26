# ImpactLink: Database Architecture & Strategic Approach
### Version 2.0 | Production-Grade Engineering Decisions

> While the `database_schema.md` is the *what*, this document explains the *why* and *how*. Every engineering decision here has a consequence that flows through the application — from query performance to algorithmic correctness to compliance posture. Developers must read this document before implementing any Mongoose model or MongoDB aggregation.

---

## Table of Contents

1. [Why MongoDB Atlas for ImpactLink](#1-why-mongodb-atlas-for-impactlink)
2. [Multi-Tenancy Architecture](#2-multi-tenancy-architecture)
3. [Domain Isolation Strategy](#3-domain-isolation-strategy)
4. [Identity, Auth, and the Firebase Decoupling Pattern](#4-identity-auth-and-the-firebase-decoupling-pattern)
5. [Geospatial Architecture](#5-geospatial-architecture)
6. [The Beneficiary Intelligence Pipeline](#6-the-beneficiary-intelligence-pipeline)
7. [The Geocoding Cache Strategy](#7-the-geocoding-cache-strategy)
8. [Event Urgency & Decay Model](#8-event-urgency--decay-model)
9. [The Two-Pass Allocation Engine](#9-the-two-pass-allocation-engine)
10. [DBSCAN Clustering Architecture](#10-dbscan-clustering-architecture)
11. [Semantic Volunteer Matching](#11-semantic-volunteer-matching)
12. [Supply Chain & Double-Entry Ledger](#12-supply-chain--double-entry-ledger)
13. [The Allocation Decision Ledger](#13-the-allocation-decision-ledger)
14. [Reporting & Dashboard Performance](#14-reporting--dashboard-performance)
15. [AI Layer Governance](#15-ai-layer-governance)
16. [Security, Compliance, and PII Architecture](#16-security-compliance-and-pii-architecture)
17. [Indexing Philosophy](#17-indexing-philosophy)
18. [Data Lifecycle & Retention](#18-data-lifecycle--retention)
19. [What Is Never Stored](#19-what-is-never-stored)
20. [Future Scalability Provisions](#20-future-scalability-provisions)

---

## 1. Why MongoDB Atlas for ImpactLink

Disaster relief data violates the assumptions that make relational databases optimal. We chose MongoDB for reasons baked into the nature of the problem, not developer familiarity.

### Schema Volatility

Field reports from disaster zones arrive via Gemini's ETL pipeline. A report from a flood might contain fields that a conflict report never has: `waterLevelMeters`, `structuralIntegrity`, `evacuationRoute`. A rigid SQL schema cannot accommodate this without migration cycles. MongoDB's `customFields` map on `Beneficiary` and `Event` documents absorbs this volatility without schema changes.

### Native Geospatial Operations

The allocation engine's core question — *which volunteers are within X km of this event?* — is answered with a single `$nearSphere` query on a 2dsphere index. Replicating this in SQL requires the Haversine formula implemented as a stored procedure or application-layer post-filtering. MongoDB's native operators handle this at the index level: sub-millisecond on millions of points.

### Document Nesting for Dashboard Performance

A `Project` document carries its `beneficiarySummary`, `volunteerTargets`, and `coverageMap` as embedded subdocuments. Reading the project dashboard requires one document fetch — no JOIN across four tables. This is the correct trade-off for a command-center application where admins reload dashboards frequently under high-stress conditions.

### Array Operations for Multi-Enrollment

A volunteer can be enrolled in multiple projects simultaneously (`volunteer.projectIds: [ObjectId]`). MongoDB's multi-key index on this array enables bidirectional queries: *all volunteers in Project A* and *all projects for Volunteer B* — both answered without a junction table.

---

## 2. Multi-Tenancy Architecture

ImpactLink is a multi-tenant SaaS platform. Each NGO, government body, or agency is an `Organization`. All data in every collection is scoped to an `organizationId`.

### Tenant Isolation Pattern

Every collection that contains operational data carries an `organizationId` field. This is not optional — it is a hard architectural constraint. Every API query, without exception, must include `organizationId` in its filter. Queries that omit `organizationId` are bugs, not features.

```
Rule: No application query may access data without scoping by organizationId.
Enforcement: Middleware injects organizationId from the authenticated user's JWT claims.
             Route handlers never accept organizationId from the request body.
```

This pattern — sometimes called "shared database, shared schema with tenant column" — is the standard for early-to-mid scale SaaS. It allows a single MongoDB Atlas cluster to serve all tenants while preventing cross-tenant data leakage at the query level.

### Denormalization of organizationId

Every child collection that references a `Project` or `User` carries a denormalized `organizationId` field even though this could theoretically be derived by following the reference. This is intentional: it prevents multi-hop lookups for the most critical security check and allows compound indexes to enforce tenant isolation without joins.

### Plan Limits Enforcement

The `Organization.limits` object — `maxProjects`, `maxVolunteers`, `maxBeneficiaries`, `aiCallsPerMonth` — is enforced at the service layer, not the database layer. Before any `Project.create()` or `Volunteer.create()` call, the service checks the current count against the limit. This keeps enforcement logic centralized and auditable.

---

## 3. Domain Isolation Strategy

The twelve data domains in ImpactLink are not arbitrary groupings. They reflect the principle that a team working on volunteer allocation should never need to read the schema for notifications or reporting to do their work.

### Why Zones Are a Separate Collection

The original design embedded zones as an array inside the `Project` document (`Project.regions[]`). This was changed to a standalone `zones` collection for three reasons:

1. **Radius mutations during beneficiary resolution.** When an admin expands a zone radius to absorb out-of-zone beneficiaries, this change must be tracked with a history log. Mutating an array inside a project document is not auditable without additional complexity.

2. **Zone-level querying.** The allocation engine needs to ask: *which zones are covered by this project, and which have unsaturated volunteer capacity?* This query is efficient as a collection scan with a `projectId` index. It is awkward as a `$elemMatch` on a project array.

3. **Zone-level reporting.** Reports like "beneficiary coverage per zone" and "volunteer density per zone" require zones as first-class queryable entities.

### Why MissionHistory Is Append-Only

`MissionHistory` documents are created exactly once — when a volunteer marks a mission complete. They are never edited. If a data correction is needed (e.g., wrong duration recorded), a new document is created with a `supersedes` reference, and the original is flagged `isSuperseded: true`. This preserves an unbroken audit chain and enables compliance-grade reporting.

### Why BeneficiaryZoneAssignment Is a Separate Collection

Zone assignment for a beneficiary is project-scoped. The same beneficiary record (from a reused dataset) may be MATCHED in Project A (whose zones cover their location) but OUT_OF_ZONE in Project B (which covers a different geography). Storing zone assignment inside the `Beneficiary` document would make the last-written project overwrite previous assignments. The separate `BeneficiaryZoneAssignment` collection with a compound unique index on `(beneficiaryId, projectId)` correctly handles this.

---

## 4. Identity, Auth, and the Firebase Decoupling Pattern

### Architecture

```
Firebase Auth  →  users (MongoDB)  →  volunteers (MongoDB)
    (uid)           (routing)          (tactical profile)
```

Firebase Authentication owns passwords, MFA, social logins, and session tokens. MongoDB owns everything else. The `User` document is a thin routing layer: it receives the Firebase UID, stores the user's role, and points to the full tactical `Volunteer` document via `linkedVolunteerId`.

### Why This Separation Matters

If ImpactLink migrates from Firebase to AWS Cognito in three years, the tactical database is untouched. All `Volunteer` and `MissionHistory` documents remain valid. Only the `User` collection's UID format changes. Authentication strategy changes are isolated.

Conversely, if the volunteer data model needs to be extended — new fields, new indexes, structural changes — Firebase is untouched. The auth system does not need to be retested.

### Volunteer Code Linking System

When an administrator creates a `Volunteer` record in advance (common for pre-registered relief workers), the system generates a 6-character alphanumeric `volunteerCode` (e.g., `HX72KP`). This code is shared out-of-band with the volunteer. When the volunteer creates a Firebase account and completes onboarding, they enter this code — the backend finds the matching `Volunteer` document, sets `User.linkedVolunteerId`, and nulls the code (single-use). The code is stored with a sparse unique index: only volunteer-facing users have this field.

### Role Escalation Prevention

A user's `role` field is set once during onboarding and can only be changed by an Administrator. The API layer enforces this: `PATCH /api/users/me` does not accept `role` in its whitelist. Any attempt to self-elevate a role is silently ignored at the route level and logged in `AuditLog` with action `ATTEMPTED_ROLE_ESCALATION`.

---

## 5. Geospatial Architecture

### Index Types by Use Case

| Operation | Index Type | Collection | Example Query |
|:---|:---|:---|:---|
| Find volunteers near event | 2dsphere on `homeGeo` | `volunteers` | `$nearSphere` with `$maxDistance` |
| Zone intersection test | Haversine (application) | `zones` | Distance from centroid < radiusKm |
| DBSCAN clustering | 2dsphere on `geo` | `events` | `$geoWithin` on cluster bbox |
| Beneficiary in zone | 2dsphere on `geo` | `beneficiaries` | `$geoWithin` `$centerSphere` |
| Admin. hierarchy traversal | Materialized path | `locations` | `$in` on `ancestors` array |

### The Zone Intersection Decision: Application vs. Database

Zone intersection (is this beneficiary inside this zone?) is implemented in application code using the Haversine formula, not as a MongoDB `$geoWithin` query against zone circles. This is a deliberate choice.

MongoDB's `$geoWithin $centerSphere` can answer this query, but it requires zones to be stored as GeoJSON geometries — not as `{center, radius}` pairs. Converting zones to GeoJSON circles for the database while keeping the UI in `{center, radius}` format introduces a synchronization bug surface area. The Haversine implementation is 8 lines of JavaScript, runs in microseconds per record, and is free of this risk.

For large datasets (>10,000 beneficiaries), the pipeline pre-filters candidates using a bounding box query before running Haversine, limiting the expensive calculation to records within `±radiusKm` of the zone center.

### The Location Hierarchy: Materialized Path Pattern

The `Location` collection models India's 8-level administrative hierarchy (Country → State → Division → District → SubDistrict → Block → Village → Ward). Naive tree traversal with a `parentId` reference requires N recursive queries to climb or descend the tree.

The materialized path pattern stores all ancestors in an array: a Village document has `ancestors: [countryId, stateId, divisionId, districtId, subDistrictId, blockId]`. Finding all locations in a district is a single `$in` query on the `ancestors` array with a multi-key index — one round trip regardless of tree depth.

---

## 6. The Beneficiary Intelligence Pipeline

### Architecture: Two-Tier Separation

The pipeline uses a two-tier design:

**Tier 1 — `BeneficiaryDataset`:** The immutable source of truth for a data ingestion batch. It records the original file metadata, column mapping decisions, processing configuration, and job status. If the pipeline fails midway, the dataset document shows exactly how many rows were processed and where it stopped. Re-runs continue from the last processed row index.

**Tier 2 — `Beneficiary`:** The granular output. Each row becomes an independent document. This separation is mandatory at scale — a dataset with 50,000 records cannot be a single MongoDB document (16MB BSON limit) and cannot be loaded into memory for the admin to paginate. Individual documents allow:
- Filtered queries: "show all out-of-zone records for this project"
- Partial re-processing: "re-geocode only the failed rows"
- Independent service tracking: each beneficiary's `serviceStatus` evolves independently

### Streaming Parse, Never Full Load

The file parser reads CSV and XLSX files as streams. At no point is the entire file loaded into application memory. For CSV: `csv-parser` yields one row object per event. For XLSX: the `xlsx` package converts the sheet to CSV in memory (max ~5MB for a 50,000 row file), then streams rows. The pipeline processes records in batches of 50 — matching the Google Geocoding API's practical request rate.

### Zone Assignment Is Project-Scoped

When a dataset is reused across multiple projects (a common pattern — an organization builds a beneficiary database once, then runs multiple relief projects from it), zone assignment is computed independently per project. The `BeneficiaryZoneAssignment` junction collection, keyed by `(beneficiaryId, projectId)`, is the storage for this. Calling the zone intersection pipeline for a new project never overwrites zone assignments from previous projects.

---

## 7. The Geocoding Cache Strategy

### Cost and Rate Context

The Google Geocoding API charges approximately USD 5 per 1,000 requests. A 10,000-row beneficiary dataset without caching costs USD 50 per upload. With caching, subsequent uploads of similar datasets (common in ongoing relief operations where addresses repeat across batches) approach zero marginal cost.

### Cache Architecture

The `GeocodingCache` collection intercepts every geocoding request:

```
normalizeAddress(rawInput)
  → check GeocodingCache by normalizedAddress
    → HIT:  use cached lat/lng/placeId, increment hitCount
    → MISS: call Google API → cache result → use result
```

The normalization step is the key: "MG Road, Bengaluru" and "M.G. Road, Bangalore" both normalize to `mg road bangalore india` and hit the same cache entry. The normalization pipeline applies: lowercase, remove punctuation, expand common abbreviations (`rd → road`, `nagar → nagar`), strip noise words (`near`, `opp`, `behind`), append `india` if absent.

### TTL Strategy

A TTL index on `cachedAt` with `expireAfterSeconds: 7776000` (90 days) automatically purges stale entries. This is preferred over a manual cleanup job because MongoDB's TTL background thread runs continuously, purging entries approximately every 60 seconds, without application involvement. 90 days is chosen because Indian addresses (building numbers, landmark-based addresses) rarely change within this window.

### Deduplication via PlaceId

The `placeId` field from Google's API is stored in both `GeocodingCache` and `Beneficiary.geo`. If two different address strings geocode to the same Google Places ID, they are the same physical location. This allows the system to detect when two beneficiary records represent the same household (identical placeId, same need category) and flag them for deduplication review — preventing double-delivery of resources.

---

## 8. Event Urgency & Decay Model

### The Problem of Static Severity

A severity score of 8 assigned at incident creation becomes misleading over time. An event that was critical 48 hours ago but has received partial resource fulfillment is less urgent than a newly reported severity-7 incident with no response. A static severity score makes the allocation engine myopic to history.

### The Urgency Decay Formula

```
urgencyScore(t) = clusterDensity
                × avgSeverity
                × (1 − saturationRate)
                × e^(−λ × hoursElapsed)
                × (1 + timeSensitivity × escalationMultiplier)
```

Where:
- `λ` (lambda) = urgency decay constant. Default: `0.02` (50% decay in ~35 hours). Configurable per project type — conflict zones use `0.005` (slow decay), flood rescue uses `0.05` (fast decay).
- `saturationRate` = proportion of resourceGap already fulfilled (0 to 1).
- `escalationMultiplier` = 1.0 normally; spikes to 2.5 if the event's `urgencyWindow` has elapsed with no assignment.

### Decay Recalculation Schedule

`urgencyScore` is NOT computed in real-time on every API read (this would be expensive at scale). Instead:
- A scheduled job runs every 15 minutes and updates `urgencyScore` for all `allocationStatus !== 'saturated'` events.
- The result is stored in `Event.urgencyScore` and `Event.urgencyScoreUpdatedAt`.
- When the allocation engine runs, it reads the pre-computed score.
- This gives near-real-time behavior (max 15-minute staleness) at minimal compute cost.

### Escalation Logging

Every time `urgencyScore` crosses a defined threshold or `allocationStatus` changes to `critical_unmet`, an `EventEscalation` document is created. This is the notification trigger, the admin alert source, and the compliance record in one. The escalation log answers the question: "Why did the system alert on this event at 3:47am?" — a question that matters deeply in post-disaster reviews.

---

## 9. The Two-Pass Allocation Engine

### Philosophy: Deterministic First, Probabilistic Second

The engine does not use a single optimization pass because optimization at global scale has two failure modes: it produces unstable results (small input changes → very different assignments) and it is not explainable to non-technical administrators who need to trust the system during a crisis.

Instead, the engine is split:

**Pass 1 (Deterministic):** Resident volunteers are assigned using a greedy algorithm that is fully deterministic given the same inputs. Every assignment can be explained as: "This volunteer was closest, had the right skills, and had available capacity." No randomness.

**Pass 2 (Probabilistic):** Mobile volunteers are ranked by a composite score, but the engine selects from the top-3 candidates using weighted random selection (not always the #1 candidate). This prevents convoy clustering — where every mobile volunteer assignment goes to a single hotspot because it scores marginally higher. Probabilistic selection distributes mobile volunteers across similarly-scored missions.

### Saturation States — Not Binary Completion

Events use three saturation states instead of done/not-done:
- `unassigned` (0% gap met)
- `partially_saturated` (1%–79% gap met)
- `saturated` (≥80% gap met)
- `critical_unmet` (urgencyWindow elapsed, still <40% met)

The 80% threshold for "saturated" (not 100%) is intentional. Requiring 100% fulfillment before removing an event from the allocation queue causes the system to hold mobile volunteers in reserve for the last few resource units of a large event while new high-severity events go unaddressed. 80% is operationally "handled" — the remaining gap is tracked but deprioritized.

### Overload Prevention

`Volunteer.currentLoad` tracks active concurrent mission assignments. `Volunteer.maxConcurrentLoad` is the upper bound (default: 1). The allocation engine skips any volunteer whose `currentLoad >= maxConcurrentLoad`. This prevents a high-performing volunteer from being assigned all missions while others sit idle — a real failure mode of pure performance-ranked greedy algorithms.

### Explainability — The Scoring Factors Ledger

Every `AllocationDecision` document stores the `scoringFactors` object: each component score (skillMatch, distance, performance, availability, payload, ETA) and the final composite. This serves two purposes:
1. Admin review: "Why was this volunteer chosen over that one?" — answered by reading the scoring factors.
2. Algorithm improvement: the scoring factors provide training signal for future AI-powered allocation runs.

---

## 10. DBSCAN Clustering Architecture

### Why DBSCAN over K-Means

K-Means requires specifying the number of clusters in advance — unknown for a disaster that is still unfolding. DBSCAN discovers cluster count from the data. It also handles noise (isolated incidents far from any group) naturally by assigning them to no cluster, whereas K-Means forces every point into a cluster, including isolated false alarms.

DBSCAN's epsilon (neighborhood radius, in km) and minPoints (minimum density) are stored as `StrategicMission.clusterParameters` because they must be tunable per disaster type. Urban flood: small epsilon (0.5 km), low minPoints (2). Rural conflict: large epsilon (5 km), higher minPoints (4).

### When Clustering Runs

DBSCAN does not run on every event creation — this would be computationally expensive and produce unstable clusters (a single new event would reshape the entire cluster map). Instead:
- A scheduled run occurs every 30 minutes for active projects.
- An on-demand run is triggered when an admin clicks "Re-analyze" in the Strategic Missions panel.
- The run is recorded as an `AIAnalysisRun` document with `runType: 'dbscan_clustering'`.

### Cluster Stability

New clustering runs do not delete old `StrategicMission` documents. Instead:
- Existing missions are matched to new clusters by centroid proximity.
- If a new cluster closely matches an existing mission (centroid within 1 km), the existing mission is updated (event IDs, priority score recalculated).
- If a new cluster has no matching existing mission, a new `StrategicMission` is created.
- If an existing mission has no matching cluster in the new run (events resolved/merged), it is marked `isActive: false`.

This preserves historical mission documents and prevents the allocation engine from losing track of in-progress assignments when clustering re-runs.

---

## 11. Semantic Volunteer Matching

### The Keyword Matching Failure Mode

Standard skill matching — `volunteer.skills.includes('medical')` — fails in nuanced scenarios. A field reports that a cluster of incidents requires "Geriatric psychological support for flood survivors." No volunteer has this exact skill tag. A keyword search returns zero matches. A semantic search finds volunteers with `mental_health_counseling` + `elderly_care` who are close enough.

### Vector Embedding Architecture

When a volunteer completes their profile, their `semanticProfile` string is assembled: a concatenation of their skills, certifications, occupation, and self-written bio. This string is passed to Google's `text-embedding-004` model, which returns a 768-dimensional vector. This vector is stored in `Volunteer.embedding`.

The field is marked `select: false` in Mongoose — it is excluded from every standard query response. This prevents 768-float arrays from appearing in the volunteer list API, reducing response payloads by ~12KB per volunteer.

### Semantic Search Query Pattern

When the allocation engine needs to find semantically matching volunteers for a mission description:

1. Generate an embedding for the mission description using the same model.
2. Query MongoDB Atlas Vector Search: `$vectorSearch` on the `embedding` field with `numCandidates: 150` and `limit: 20`.
3. Post-filter results by availability, zone proximity, and current load.

Atlas Vector Search uses Hierarchical Navigable Small World (HNSW) indexing — sub-millisecond approximate nearest-neighbor search at scale, running directly in MongoDB without a separate vector database.

### Embedding Refresh Policy

Embeddings become stale when a volunteer updates their skills or bio. The `embeddingUpdatedAt` field is compared to `Volunteer.updatedAt` — if the volunteer profile was updated after the last embedding generation, a background job queues an embedding refresh. This prevents the semantic layer from using outdated volunteer profiles.

---

## 12. Supply Chain & Double-Entry Ledger

### The Three-Layer Supply Model

```
Supply (SKU at a hub)
  │
  ├── SupplyAllocation (committed to a mission — in transit or pending)
  │
  └── SupplyTransaction (immutable ledger entry for every quantity change)
```

Every time `Supply.availableQuantity` changes — whether due to dispatch, receipt, return, or damage write-off — a `SupplyTransaction` document is created first. The transaction records `quantityBefore`, `quantityChanged`, and `quantityAfter`. The `Supply` document is then updated atomically.

This double-entry pattern means: if there is ever a discrepancy between the `Supply.availableQuantity` and what the transaction ledger says it should be, the ledger is the source of truth. Auditors can replay all transactions from zero and arrive at the correct current quantity.

### Atomic Supply Operations

Supply dispatches must be atomic: decrement `Supply.availableQuantity`, increment `Supply.allocatedQuantity`, create the `SupplyTransaction`, and create the `SupplyAllocation` — all in a single MongoDB session transaction. If any step fails, all are rolled back. A partial supply dispatch (e.g., quantity decremented but allocation not created) would cause phantom stock — quantity that shows as unavailable but has no allocation tracking it.

```javascript
// Pseudocode for atomic supply dispatch
session.withTransaction(async () => {
  const supply = await Supply.findOneAndUpdate(
    { _id, availableQuantity: { $gte: unitsDispatched } },
    { $inc: { availableQuantity: -unitsDispatched, allocatedQuantity: +unitsDispatched } },
    { session, new: true }
  );
  if (!supply) throw new Error('Insufficient stock'); // triggers rollback
  await SupplyTransaction.create([transactionDoc], { session });
  await SupplyAllocation.create([allocationDoc], { session });
});
```

The `Supply.findOneAndUpdate` query includes `availableQuantity: { $gte: unitsDispatched }` in its filter — this is a compare-and-swap at the database level, preventing race conditions when two allocation runs simultaneously try to dispatch from the same supply.

---

## 13. The Allocation Decision Ledger

### Every Decision Is Immutable

`AllocationDecision` documents are created by the allocation engine and never modified. If an admin overrides a decision (manually changes which volunteer is assigned), a new `AllocationDecision` is created with `decisionType: 'manual_override'`, and the original decision is updated only to set `overriddenBy` and `overriddenAt`. The original scoring factors remain intact.

This creates an audit chain that answers: "What did the algorithm recommend, and what did the admin do instead?" — critical for post-disaster learning and system improvement.

### Volunteer Response Tracking

When a volunteer is assigned via the two-pass engine, their `AllocationDecision` starts in `status: 'pending_accept'`. The volunteer must explicitly accept (via the volunteer dashboard) or decline. If no response is received within the event's `urgencyWindow / 4` hours (configurable), the decision expires and the next candidate in the hold-reserve list is automatically promoted to `pending_accept`. This cascading reserve system means the allocation never blocks on an unresponsive volunteer.

---

## 14. Reporting & Dashboard Performance

### The Snapshot Pattern

MongoDB aggregation pipelines for dashboard metrics — "total beneficiaries per zone," "volunteer completion rate by skill," "resource gap by category" — are expensive on large datasets. Running them on every dashboard load introduces P95 latency that makes the command center feel sluggish during crisis operations.

The `DashboardSnapshot` collection stores pre-computed aggregation results with a `validUntil` timestamp. The API serves the cached snapshot if it is still valid. A background job regenerates stale snapshots every 5 minutes for active projects. This gives near-real-time data with sub-10ms read latency.

The TTL index on `DashboardSnapshot.validUntil` automatically removes expired snapshots, preventing stale data from accumulating.

### Report Generation — Async, Never Synchronous

Generated reports (PDF, XLSX, DOCX) can take 10–60 seconds to produce for large projects. Report generation is always asynchronous:
1. API receives request → creates `GeneratedReport` with `status: 'queued'` → responds with `reportId`.
2. Background worker picks up the job → generates file → uploads to Cloud Storage → updates `GeneratedReport.status` to `'complete'` and sets `downloadUrl`.
3. Client polls `GET /api/reports/:reportId` every 5 seconds → when status is `'complete'`, shows download link.

This pattern prevents HTTP timeouts and keeps the command center responsive during report generation.

### The `AllocationRun.allocationEfficiencyPct` Metric

The primary KPI for the system — the ratio of addressed events to total events — is stored on the `AllocationRun` document, not computed on the fly. After each run completes, the efficiency is calculated and stored. This makes trend analysis (is our allocation efficiency improving over time?) a simple `find()` query on `AllocationRun` documents, not an expensive cross-collection aggregation.

---

## 15. AI Layer Governance

### Gemini Model Selection by Operation

| Operation | Model | Reason |
|:---|:---|:---|
| Field report ETL (real-time) | `gemini-2.5-flash` | Low latency, high volume, structured extraction |
| Strategic analysis, anomaly detection | `gemini-2.5-pro` | Complex reasoning, runs on schedule not per-request |
| Volunteer semantic embedding | `text-embedding-004` | Dedicated embedding model, higher quality than Gemini general |
| Image/photo analysis from field | `gemini-2.5-flash` | Vision capability, low latency |

Flash is never used for strategic analysis. Pro is never used for per-request ETL. Model assignment is stored in `AIAnalysisRun.model` so that outputs can be attributed to the model version that produced them — essential when model updates change behavior.

### Prompt Versioning

`GeminiExtraction.promptVersion` records which version of the ETL prompt was used for each extraction. When a prompt is improved, historical extractions are not retroactively invalidated — they are tagged with the old version. Admins can filter `GeminiExtraction` records by `promptVersion` to compare extraction quality before and after a prompt change.

### Human-in-the-Loop for Extractions

Every `GeminiExtraction` has `wasAccepted: false` by default. An admin must explicitly accept an extraction before the resulting `Event` is included in the allocation queue. This prevents hallucinated or miscategorized AI outputs from triggering volunteer dispatch. High-confidence extractions (confidence > 0.9) can be configured for auto-acceptance at the organization level — opt-in, not default.

### AI Call Budgeting

`Organization.limits.aiCallsPerMonth` is tracked against `AIAnalysisRun` counts per organization per month. When 80% of the monthly budget is reached, a warning notification is sent. At 100%, new AI analysis runs are blocked and admins are alerted. This prevents cost overruns from runaway automated triggers.

---

## 16. Security, Compliance, and PII Architecture

### PII Classification

Data in ImpactLink is classified into three tiers:

**Tier 1 — Operational PII** (beneficiary name, phone, address): Encrypted at the application layer before storage. Never logged in `AuditLog.changesBefore/After`. Never included in exported reports by default — requires explicit admin opt-in with audit log entry.

**Tier 2 — Identity PII** (volunteer national ID, date of birth): Encrypted at application layer. Only accessible to `Administrator` role. Every access generates an `AuditLog` entry with `action: 'VIEW_PII'`.

**Tier 3 — Operational Metadata** (zone assignments, event types, resource counts): Unencrypted. This is the data the system primarily operates on. Losing this data is a mission failure; exposing it is not a privacy violation.

### The AuditLog — Append-Only by Design

The `AuditLog` collection has no `UPDATE` or `DELETE` routes in the API, period. The MongoDB user account used by the application has `read` and `insert` on this collection only — not `update` or `delete`. Even if an attacker gains application-level access, they cannot tamper with the audit log without direct MongoDB admin credentials (a separate, more tightly controlled access layer).

The compound index `{ organizationId: 1, createdAt: -1 }` enables instantaneous generation of compliance reports: all actions by this organization in the past 30 days — one index scan, no collection scan.

### India DPDP Act Compliance

The `DataExportRequest` collection handles Digital Personal Data Protection Act obligations:
- Data access requests must be fulfilled within 30 days (`dueDate` = `createdAt + 30 days`).
- Data deletion requests are tracked through to completion.
- Consent is recorded on the `User` document: `consentGiven`, `consentGivenAt`, `consentVersion`. Withdrawing consent nulls PII fields — the structural document remains (to maintain relational integrity for mission histories) but PII is zeroed.

### Communication Log PII Handling

`CommunicationLog.recipientPhone` and `recipientEmail` are stored as hashes (SHA-256), not plaintext. This allows the system to answer: "Did we send a notification to this person?" without storing the phone number in the log. The original phone is accessible only from the `Volunteer` document, which is behind proper PII access controls.

---

## 17. Indexing Philosophy

### The Core Rule

An index is only valuable if the query it supports runs more than once per second in production, or if its absence causes a query to scan more than 10,000 documents. Every index has a write-amplification cost: every insert or update on an indexed field must also update the index. Over-indexing slows writes in a system that writes constantly (field reports, allocation decisions, audit logs).

### Index Prioritization

Indexes are prioritized in this order:

1. **Security-critical:** `organizationId` compound indexes. Every query is tenant-scoped; these must hit an index.
2. **Algorithm-critical:** Allocation engine queries — `{ projectId, allocationStatus, urgencyScore: -1 }` on events. This runs every 15 minutes and on every manual allocation trigger.
3. **User-facing latency:** Dashboard reads — `{ projectId, status }` on projects, `{ volunteerId, createdAt: -1 }` on missionhistories.
4. **Background jobs:** Geocoding cache lookup, embedding update detection. These can tolerate higher latency.

### TTL Indexes — The Maintenance-Free Strategy

Four collections use TTL indexes instead of scheduled cleanup jobs:
- `GeocodingCache` — 90 days
- `Invitations` — 72 hours
- `DashboardSnapshots` — variable (set per snapshot)
- `Notifications` — configurable (default 90 days)

MongoDB's TTL background thread handles deletion continuously. This eliminates a class of operational burden: no cron jobs to monitor, no cleanup scripts to maintain, no "the cache table is full" incidents.

---

## 18. Data Lifecycle & Retention

### Project Archival

When a project's `status` changes to `concluded`, a background job after 24 hours:
1. Sets `Project.isActive: false`.
2. Moves heavy collections (`Beneficiary`, `Event`) to Atlas Online Archive (cold storage, queryable but slower).
3. Retains `MissionHistory`, `AllocationDecision`, `AuditLog` in hot storage indefinitely — these are compliance documents.
4. Sends `DashboardSnapshot` documents to archival.

After `Organization.settings.dataRetentionDays` (default 730 days / 2 years), archived project data is permanently deleted, with a `GeneratedReport` PDF of the final project summary created and stored as the permanent record.

### Volunteer Deactivation

When a volunteer is deactivated (`isActive: false`):
- Their `Volunteer` document is retained in full.
- Their `MissionHistory` documents are retained — performance records are organizational assets.
- Their PII fields (`nationalId`, `phone`, `address`) are flagged for erasure if a data deletion request is received.
- They are removed from all `Project.assignedRoster` arrays in a background cleanup.

---

## 19. What Is Never Stored

These categories of data must never appear in any MongoDB document, regardless of developer convenience:

| What | Why | Alternative |
|:---|:---|:---|
| Firebase Authentication passwords | Firebase owns auth | Never touch this |
| Derived aggregations (gap_delta, coverage_pct) | Go stale immediately | Compute in aggregation pipeline |
| Duplicate beneficiary zone assignments | Creates conflicting data | Use BeneficiaryZoneAssignment junction |
| Volunteer `embedding` in standard query projections | 768 floats × 1000 volunteers = 768KB per request | `select: false` in Mongoose |
| Raw CSV rows in standard beneficiary queries | Large, PII-heavy | `Beneficiary.rawRow` with `select: false` |
| Cleartext national IDs or phone numbers in logs | DPDP Act violation | Hash in logs; encrypt in source |
| Redundant role checks client-side | Client can be tampered | Server-side `checkRole()` middleware always |
| Timestamps computed from other timestamps | Brittle and redundant | Store both raw timestamps; compute delta in query |

---

## 20. Future Scalability Provisions

The schema includes several fields that are not used in V1 but are included to prevent a migration crisis at scale.

### Real-Time GPS Tracking

`MissionHistory.routeGeojson` (GeoJSON LineString) is defined but optional. When the mobile app gains GPS tracking capability, volunteer movement data writes here — no schema migration required. The field is already indexed via the collection's geospatial context.

### Multi-Language Support

`Location.nameHindi` is included for all location documents. A future localization pass populates this field. The `User.preferredLanguage` field drives notification language selection. The infrastructure for i18n is present; the translations are V2 work.

### Atlas Search Integration

`Event.description` and `GeminiExtraction.rawInput` are the natural targets for full-text search (admin searching for "all flood reports mentioning road blockage"). Atlas Search indexes can be added to these fields without schema changes — they are already stored as strings.

### Horizontal Sharding Readiness

Every collection carries `organizationId` as a top-level field and is indexed on it. If the database grows to require sharding, `organizationId` is the natural shard key — it distributes data by tenant and ensures all queries by a single tenant hit a single shard (locality of reference). No schema changes are required to shard on this key.

### Event Source API (Webhooks)

`Event.source` includes `'api_webhook'` as an enum value. The infrastructure for external systems (NDMA alerts, weather APIs, social media listening) to push events directly into ImpactLink is anticipated. The source field allows the system to track data provenance and apply different trust levels per source.

---

## Summary

The ImpactLink database is not a passive storage layer — it is a structural participant in the platform's intelligence. The key architectural decisions can be summarized in five principles:

1. **Tenant-first.** Every query is scoped by `organizationId`. This is non-negotiable and enforced at the middleware level.

2. **Immutability for accountability.** `MissionHistory`, `SupplyTransaction`, `AllocationDecision`, and `AuditLog` are write-once. Crisis response platforms must be auditable — reconstruction of what happened and why depends on an unbroken historical record.

3. **Compute at the right time.** Urgency scores are pre-computed every 15 minutes. Dashboard snapshots are pre-computed every 5 minutes. API responses are served from pre-computed results, not from expensive real-time aggregations. This is the only way a command-center UI can feel fast during a crisis.

4. **Separate concerns that scale differently.** Zone assignments are project-scoped. Beneficiary records are dataset-scoped. These are different scales that must evolve independently. Mixing them in the same document creates data conflicts at scale.

5. **PII at the perimeter.** Personal identifiable information is encrypted at the application layer, hash-only in logs, excluded from standard query projections, and governed by explicit access controls. The system is designed to function fully — allocate volunteers, track missions, generate reports — without ever exposing PII in the hot path.

---

*ImpactLink Database Architecture v2.0 — This document governs all data model decisions. Any deviation requires a recorded Architecture Decision Record (ADR).*
