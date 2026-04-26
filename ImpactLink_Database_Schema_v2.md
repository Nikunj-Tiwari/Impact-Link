# ImpactLink: MongoDB Atlas — Comprehensive Database Schema
### Version 2.0 | Production-Grade | Market-Ready

> This document defines every MongoDB collection, field, type, constraint, index, and cross-collection relationship in the ImpactLink platform. It is the single source of truth for all Mongoose model implementations. No field may be silently omitted in implementation — if a field exists here, it must exist in the Mongoose schema.

---

## Table of Contents

1. [Domain Overview](#1-domain-overview)
2. [Domain I — Identity & Access Management](#2-domain-i--identity--access-management)
   - [Collection: `users`](#21-collection-users)
   - [Collection: `organizations`](#22-collection-organizations)
   - [Collection: `invitations`](#23-collection-invitations)
3. [Domain II — Project & Operations Management](#3-domain-ii--project--operations-management)
   - [Collection: `projects`](#31-collection-projects)
   - [Collection: `projectphases`](#32-collection-projectphases)
   - [Collection: `zones`](#33-collection-zones)
4. [Domain III — Volunteer & Human Capital](#4-domain-iii--volunteer--human-capital)
   - [Collection: `volunteers`](#41-collection-volunteers)
   - [Collection: `volunteeravailability`](#42-collection-volunteeravailability)
   - [Collection: `missionhistories`](#43-collection-missionhistories)
   - [Collection: `volunteerratings`](#44-collection-volunteerratings)
5. [Domain IV — Tactical Beneficiary Intelligence](#5-domain-iv--tactical-beneficiary-intelligence)
   - [Collection: `beneficiarydatasets`](#51-collection-beneficiarydatasets)
   - [Collection: `beneficiaries`](#52-collection-beneficiaries)
   - [Collection: `beneficiaryzoneassignments`](#53-collection-beneficiaryzoneassignments)
6. [Domain V — Events & Incident Management](#6-domain-v--events--incident-management)
   - [Collection: `events`](#61-collection-events)
   - [Collection: `eventescalations`](#62-collection-eventescalations)
   - [Collection: `strategicmissions`](#63-collection-strategicmissions)
7. [Domain VI — Resource & Logistics Management](#7-domain-vi--resource--logistics-management)
   - [Collection: `supplies`](#71-collection-supplies)
   - [Collection: `supplyallocations`](#72-collection-supplyallocations)
   - [Collection: `supplytransactions`](#73-collection-supplytransactions)
8. [Domain VII — Allocation Engine](#8-domain-vii--allocation-engine)
   - [Collection: `allocationruns`](#81-collection-allocationruns)
   - [Collection: `allocationdecisions`](#82-collection-allocationdecisions)
9. [Domain VIII — Geospatial & Location Infrastructure](#9-domain-viii--geospatial--location-infrastructure)
   - [Collection: `locations`](#91-collection-locations)
   - [Collection: `geocodingcaches`](#92-collection-geocodingcaches)
10. [Domain IX — Intelligence & AI Layer](#10-domain-ix--intelligence--ai-layer)
    - [Collection: `aianalysisruns`](#101-collection-aianalysisruns)
    - [Collection: `geminiextractions`](#102-collection-geminiextractions)
11. [Domain X — Notifications & Communications](#11-domain-x--notifications--communications)
    - [Collection: `notifications`](#111-collection-notifications)
    - [Collection: `communicationlogs`](#112-collection-communicationlogs)
12. [Domain XI — Reporting & Analytics](#12-domain-xi--reporting--analytics)
    - [Collection: `reporttemplates`](#121-collection-reporttemplates)
    - [Collection: `generatedreports`](#122-collection-generatedreports)
    - [Collection: `dashboardsnapshots`](#123-collection-dashboardsnapshots)
13. [Domain XII — Security & Compliance](#13-domain-xii--security--compliance)
    - [Collection: `auditlogs`](#131-collection-auditlogs)
    - [Collection: `dataexportrequests`](#132-collection-dataexportrequests)
14. [Cross-Collection Index Reference](#14-cross-collection-index-reference)
15. [Field Naming Conventions](#15-field-naming-conventions)

---

## 1. Domain Overview

The ImpactLink database is organized into twelve functional domains. Each domain owns a set of collections with clearly defined responsibilities. No collection spans two domains.

| Domain | Collections | Primary Purpose |
|:---|:---|:---|
| I. Identity & Access | `users`, `organizations`, `invitations` | Auth, roles, multi-tenancy |
| II. Project & Ops | `projects`, `projectphases`, `zones` | Campaign lifecycle management |
| III. Human Capital | `volunteers`, `volunteeravailability`, `missionhistories`, `volunteerratings` | Responder profiles and performance |
| IV. Beneficiary Intel | `beneficiarydatasets`, `beneficiaries`, `beneficiaryzoneassignments` | Need-side data ingestion and mapping |
| V. Events & Incidents | `events`, `eventescalations`, `strategicmissions` | Crisis tracking and DBSCAN clusters |
| VI. Resource & Logistics | `supplies`, `supplyallocations`, `supplytransactions` | Inventory, dispatch, and tracking |
| VII. Allocation Engine | `allocationruns`, `allocationdecisions` | Algorithmic decision ledger |
| VIII. Geospatial | `locations`, `geocodingcaches` | Spatial taxonomy and address resolution |
| IX. Intelligence & AI | `aianalysisruns`, `geminiextractions` | Gemini pipeline outputs |
| X. Notifications | `notifications`, `communicationlogs` | Alerts and message tracking |
| XI. Reporting | `reporttemplates`, `generatedreports`, `dashboardsnapshots` | Analytics and exports |
| XII. Security | `auditlogs`, `dataexportrequests` | Compliance and PII governance |

---

## 2. Domain I — Identity & Access Management

### 2.1 Collection: `users`

The thin authentication bridge between Firebase Auth and the tactical database. Every user in the system has exactly one `users` document. Role-specific data lives in domain-specific collections (`volunteers`), not here.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | Primary key |
| `uid` | `String` | Required, Unique, Index | Firebase Auth UID — immutable |
| `email` | `String` | Required, Lowercase | Contact and login email |
| `displayName` | `String` | Required | Full name as entered during onboarding |
| `avatarUrl` | `String` | Optional | Profile image URL (Firebase Storage or external) |
| `role` | `String` | Enum: `Administrator`, `Volunteer`, `Analyst`, `Observer` | System role. `null` until onboarding complete |
| `organizationId` | `ObjectId` | Ref: `Organization` | Multi-tenancy parent. Required for Administrators |
| `linkedVolunteerId` | `ObjectId` | Ref: `Volunteer`, Nullable | Set when role = Volunteer |
| `volunteerCode` | `String` | Unique, Sparse | 6-char single-use code linking user to volunteer record. Nulled after use |
| `onboardingComplete` | `Boolean` | Default: `false` | Must be `true` before accessing core features |
| `onboardingStep` | `Number` | Default: `0` | Wizard step reached during onboarding |
| `isActive` | `Boolean` | Default: `true` | Soft-delete / deactivation flag |
| `isSuspended` | `Boolean` | Default: `false` | Temporary access block by admin |
| `suspensionReason` | `String` | Optional | Reason for suspension, admin-facing |
| `lastLoginAt` | `Date` | Optional | Timestamp of most recent Firebase sign-in |
| `lastActiveAt` | `Date` | Optional | Timestamp of most recent API call |
| `fcmTokens` | `Array[String]` | Default: `[]` | Firebase Cloud Messaging tokens (multiple devices) |
| `preferredLanguage` | `String` | Default: `en` | ISO 639-1 code. Drives notification localization |
| `timezone` | `String` | Default: `Asia/Kolkata` | IANA timezone for display formatting |
| `notificationPreferences` | `Object` | | Per-channel notification opt-ins |
| ↳ `email` | `Boolean` | Default: `true` | |
| ↳ `push` | `Boolean` | Default: `true` | |
| ↳ `sms` | `Boolean` | Default: `false` | |
| `twoFactorEnabled` | `Boolean` | Default: `false` | Handled at Firebase layer; stored for UI state |
| `passwordLastChangedAt` | `Date` | Optional | For security policy enforcement |
| `consentGiven` | `Boolean` | Default: `false` | DPDP Act consent — required before data is processed |
| `consentGivenAt` | `Date` | Optional | Timestamp of consent |
| `consentVersion` | `String` | Optional | Version of privacy policy accepted |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Indexes:**
- `{ uid: 1 }` — unique
- `{ email: 1 }` — unique
- `{ organizationId: 1, role: 1 }` — compound for admin user listing
- `{ volunteerCode: 1 }` — sparse unique (only on volunteer users)

---

### 2.2 Collection: `organizations`

Supports multi-tenancy. An organization is an NGO, government body, or relief agency. All projects and volunteers belong to one organization.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | Primary key |
| `name` | `String` | Required | Official organization name |
| `shortCode` | `String` | Required, Unique, Uppercase | 3–6 char identifier (e.g., `PRDN`, `REDCR`) |
| `type` | `String` | Enum: `ngo`, `government`, `corporate_csr`, `inter_agency`, `research` | Organization classification |
| `registrationNumber` | `String` | Optional | Legal registration ID |
| `country` | `String` | Default: `IN` | ISO 3166-1 alpha-2 |
| `state` | `String` | Optional | Primary state of operation |
| `address` | `Object` | | Registered address |
| ↳ `line1` | `String` | | |
| ↳ `line2` | `String` | | |
| ↳ `city` | `String` | | |
| ↳ `state` | `String` | | |
| ↳ `pin` | `String` | | PIN/ZIP code |
| `contactEmail` | `String` | Required | Primary contact |
| `contactPhone` | `String` | Optional | |
| `website` | `String` | Optional | |
| `logoUrl` | `String` | Optional | |
| `plan` | `String` | Enum: `free`, `professional`, `enterprise` | Subscription tier |
| `planExpiresAt` | `Date` | Optional | |
| `limits` | `Object` | | Plan-based feature limits |
| ↳ `maxProjects` | `Number` | Default: `5` | |
| ↳ `maxVolunteers` | `Number` | Default: `100` | |
| ↳ `maxBeneficiaries` | `Number` | Default: `10000` | |
| ↳ `aiCallsPerMonth` | `Number` | Default: `500` | Gemini API quota |
| `settings` | `Object` | | Org-wide configuration |
| ↳ `defaultAllocationStrategy` | `String` | Enum: `ai`, `manual` | |
| ↳ `requireVolunteerApproval` | `Boolean` | Default: `true` | |
| ↳ `defaultTimezone` | `String` | Default: `Asia/Kolkata` | |
| ↳ `dataRetentionDays` | `Number` | Default: `730` | Auto-archive after N days |
| `isVerified` | `Boolean` | Default: `false` | Verified by ImpactLink team |
| `isActive` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

### 2.3 Collection: `invitations`

Tracks pending invitations for both administrators inviting new admins and the volunteer code system.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `invitedBy` | `String` | Firebase UID | Who sent the invitation |
| `inviteeEmail` | `String` | Required | Target email |
| `role` | `String` | Enum: `Administrator`, `Volunteer`, `Analyst`, `Observer` | Intended role |
| `linkedVolunteerId` | `ObjectId` | Ref: `Volunteer`, Optional | Pre-links invitation to existing volunteer record |
| `token` | `String` | Required, Unique | Secure random token (UUID v4) |
| `status` | `String` | Enum: `pending`, `accepted`, `expired`, `revoked` | Default: `pending` |
| `expiresAt` | `Date` | Required | Default: 72 hours from creation |
| `acceptedAt` | `Date` | Optional | |
| `acceptedByUid` | `String` | Optional | Firebase UID of user who accepted |
| `message` | `String` | Optional | Personal message from inviter |
| `createdAt` | `Date` | Auto | |

**Indexes:**
- `{ token: 1 }` — unique
- `{ inviteeEmail: 1, status: 1 }` — for checking pending invitations
- `{ expiresAt: 1 }` — TTL Index (`expireAfterSeconds: 0`) for automatic cleanup

---

## 3. Domain II — Project & Operations Management

### 3.1 Collection: `projects`

The central operational container. Every mission, volunteer, beneficiary, and resource belongs to a project. The project wizard writes to this collection across all 7 stages.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Required | Tenant isolation |
| `createdBy` | `String` | Firebase UID, Required | |
| `name` | `String` | Required | Mission name (e.g., "Assam Flood Relief 2026") |
| `slug` | `String` | Unique per org | URL-safe identifier |
| `description` | `String` | Optional | Full narrative description |
| `shortSummary` | `String` | Optional | Max 160 chars, for dashboard cards |
| `disasterType` | `String` | Enum: `flood`, `earthquake`, `drought`, `conflict`, `epidemic`, `industrial_accident`, `landslide`, `cyclone`, `fire`, `other` | Drives AI recommendation engine |
| `scope` | `String` | Enum: `Village`, `Block`, `District`, `State`, `Multi-State`, `National`, `International` | Geographic scale |
| `status` | `String` | Enum: `draft`, `active`, `paused`, `concluded`, `archived` | Lifecycle state |
| `wizardState` | `Object` | | Tracks project wizard completion |
| ↳ `currentStage` | `Number` | Default: `1` | Stages 1–7 |
| ↳ `completedStages` | `Array[Number]` | Default: `[]` | Which stages have been completed |
| ↳ `lastSavedAt` | `Date` | | Auto-save timestamp |
| `operatingMode` | `String` | Enum: `manual`, `assisted`, `autopilot` | AI involvement level |
| `allocationStrategy` | `String` | Enum: `ai`, `manual`, `hybrid` | Responder dispatch method |
| `coverageMap` | `Object` | | Aggregated geographic summary (Stage 2 output) |
| ↳ `totalZones` | `Number` | | |
| ↳ `totalRadiusCoveredKm2` | `Number` | | Sum of zone areas |
| ↳ `boundingBox` | `Object` | | `{ north, south, east, west }` — for map viewport |
| `volunteerTargets` | `Object` | | Stage 5 (Human Capital) output |
| ↳ `total` | `Number` | Default: `0` | |
| ↳ `resident` | `Number` | Default: `0` | Local/fixed volunteers |
| ↳ `mobile` | `Number` | Default: `0` | Travel/deployment volunteers |
| ↳ `requiredSkills` | `Array[String]` | | Skill enum values |
| ↳ `skillBreakdown` | `Array[Object]` | | `[{ skill, minCount, priority }]` |
| `beneficiarySummary` | `Object` | | Stage 3 output — cached aggregation |
| ↳ `totalCount` | `Number` | Default: `0` | |
| ↳ `perZone` | `Array[Object]` | | `[{ zoneId, zoneName, count, needBreakdown }]` |
| ↳ `outOfZoneCount` | `Number` | Default: `0` | |
| ↳ `unresolvedCount` | `Number` | Default: `0` | |
| ↳ `needBreakdown` | `Object` | | `{ food: N, medical: N, shelter: N, ... }` |
| ↳ `lastUpdated` | `Date` | | |
| `resourceRequirements` | `Array[Object]` | | Stage 7 (Resource Architecture) |
| ↳ `category` | `String` | | e.g., "Medical" |
| ↳ `items` | `Array[Object]` | | `[{ type, unit, targetQuantity, currentStock, priority }]` |
| `assignedRoster` | `Array[Object]` | | Volunteers explicitly assigned to project |
| ↳ `volunteerId` | `ObjectId` | Ref: `Volunteer` | |
| ↳ `zoneId` | `ObjectId` | Ref: `Zone` | |
| ↳ `type` | `String` | Enum: `resident`, `mobile` | |
| ↳ `assignedAt` | `Date` | | |
| ↳ `assignedBy` | `String` | Firebase UID | |
| `beneficiaryDatasets` | `Array[Object]` | | Stage 3 — linked datasets |
| ↳ `datasetId` | `ObjectId` | Ref: `BeneficiaryDataset` | |
| ↳ `linkedAt` | `Date` | | |
| ↳ `recordsLinked` | `Number` | | Matched + resolved records for this project |
| `tags` | `Array[String]` | | Searchable labels |
| `externalId` | `String` | Optional | External system reference (e.g., NDMA project code) |
| `fundingSource` | `String` | Optional | Donor or agency name |
| `budgetInr` | `Number` | Optional | Total sanctioned budget |
| `reportingFrequency` | `String` | Enum: `daily`, `weekly`, `milestone` | Drives automated report scheduling |
| `isPublic` | `Boolean` | Default: `false` | Public dashboard visibility |
| `isActive` | `Boolean` | Default: `true` | |
| `concludedAt` | `Date` | Optional | |
| `conclusionNotes` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Indexes:**
- `{ organizationId: 1, status: 1 }` — primary dashboard query
- `{ organizationId: 1, createdAt: -1 }` — recent projects list
- `{ slug: 1, organizationId: 1 }` — unique compound

---

### 3.2 Collection: `projectphases`

Temporal planning sub-documents extracted into their own collection for queryability and reporting.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | Denormalized for tenant isolation |
| `name` | `String` | Required | e.g., "Initial Assessment", "Active Relief", "Recovery" |
| `description` | `String` | Optional | |
| `order` | `Number` | Required | Sequence within project (1, 2, 3...) |
| `status` | `String` | Enum: `upcoming`, `active`, `completed`, `skipped` | Default: `upcoming` |
| `plannedStartDate` | `Date` | Required | |
| `plannedEndDate` | `Date` | Required | |
| `actualStartDate` | `Date` | Optional | Set when phase becomes `active` |
| `actualEndDate` | `Date` | Optional | Set when phase becomes `completed` |
| `milestones` | `Array[Object]` | | Key deliverables within phase |
| ↳ `name` | `String` | | |
| ↳ `dueDate` | `Date` | | |
| ↳ `isComplete` | `Boolean` | Default: `false` | |
| ↳ `completedAt` | `Date` | | |
| `volunteerTargetForPhase` | `Number` | Optional | Headcount needed in this phase |
| `resourceTargetForPhase` | `Array[Object]` | | Phase-specific supply requirements |
| `notes` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

### 3.3 Collection: `zones`

Extracted from the nested `Project.regions` array into a standalone collection. This enables zone-level querying, independent zone radius updates (during beneficiary resolution), and per-zone reporting.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | Denormalized |
| `name` | `String` | Required | Human-readable (e.g., "North Delhi Hub", "Bhopal Central") |
| `description` | `String` | Optional | |
| `order` | `Number` | Required | Display sequence within project |
| `center` | `Object` | Required | |
| ↳ `lat` | `Number` | Required | Decimal degrees |
| ↳ `lng` | `Number` | Required | Decimal degrees |
| `radiusKm` | `Number` | Required, Min: `1` | Operational radius |
| `radiusHistory` | `Array[Object]` | Default: `[]` | Audit log of radius changes (e.g., beneficiary resolution expansion) |
| ↳ `previousRadiusKm` | `Number` | | |
| ↳ `newRadiusKm` | `Number` | | |
| ↳ `changedAt` | `Date` | | |
| ↳ `changedBy` | `String` | Firebase UID | |
| ↳ `reason` | `String` | | e.g., "beneficiary_resolution_expand" |
| `locationId` | `ObjectId` | Ref: `Location`, Optional | Links zone to administrative hierarchy |
| `hubType` | `String` | Enum: `primary`, `secondary`, `forward_operating`, `staging` | |
| `hubAddress` | `String` | Optional | Physical hub address |
| `geoPolygon` | `Object` | Optional | GeoJSON polygon if zone is non-circular |
| ↳ `type` | `String` | `"Polygon"` | |
| ↳ `coordinates` | `Array` | | GeoJSON coordinate array |
| `assignedResidentCount` | `Number` | Default: `0` | Denormalized count of resident volunteers |
| `assignedMobileCount` | `Number` | Default: `0` | |
| `beneficiaryCount` | `Number` | Default: `0` | Denormalized from beneficiarySummary |
| `isActive` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Indexes:**
- `{ projectId: 1, order: 1 }` — zone list for a project
- `{ 'center.lat': 1, 'center.lng': 1 }` — geospatial proximity queries
- `{ projectId: 1, isActive: 1 }` — active zone filtering

---

## 4. Domain III — Volunteer & Human Capital

### 4.1 Collection: `volunteers`

The full tactical responder profile. This is the most field-rich collection in the system. The `embedding` field is excluded from standard queries for performance.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Required, Index | |
| `linkedUserId` | `ObjectId` | Ref: `User`, Nullable, Index | Set when user account is linked |
| `volunteerCode` | `String` | Unique, Sparse | 6-char activation code (cleared after user links) |
| **Personal Information** | | | |
| `firstName` | `String` | Required | |
| `lastName` | `String` | Required | |
| `displayName` | `String` | Required | First + Last, denormalized for queries |
| `gender` | `String` | Enum: `male`, `female`, `non_binary`, `prefer_not_to_say` | Optional |
| `dateOfBirth` | `Date` | Optional | For age-based filtering |
| `nationalId` | `String` | Encrypted | Aadhaar / Voter ID for verification |
| `nationalIdType` | `String` | Enum: `aadhaar`, `voter_id`, `passport`, `driving_license` | |
| `profilePhotoUrl` | `String` | Optional | |
| **Contact** | | | |
| `primaryPhone` | `String` | Required | Mobile number with country code |
| `alternatePhone` | `String` | Optional | |
| `email` | `String` | Optional | May differ from `User.email` |
| `whatsappEnabled` | `Boolean` | Default: `false` | Can receive WhatsApp alerts |
| `address` | `Object` | | Current residential address |
| ↳ `line1` | `String` | | |
| ↳ `line2` | `String` | | |
| ↳ `city` | `String` | | |
| ↳ `district` | `String` | | |
| ↳ `state` | `String` | | |
| ↳ `pin` | `String` | | |
| ↳ `country` | `String` | Default: `IN` | |
| `homeGeo` | `Object` | | Home location for proximity calculations |
| ↳ `lat` | `Number` | | |
| ↳ `lng` | `Number` | | |
| ↳ `geocodedAt` | `Date` | | |
| **Emergency Contact** | | | |
| `emergencyContact` | `Object` | | |
| ↳ `name` | `String` | Required | |
| ↳ `relation` | `String` | | e.g., "Spouse", "Parent" |
| ↳ `phone` | `String` | Required | |
| ↳ `alternatePhone` | `String` | Optional | |
| **Skills & Qualifications** | | | |
| `skills` | `Array[String]` | Enum (see below) | Categorical skill set |
| `certifications` | `Array[Object]` | | |
| ↳ `name` | `String` | | e.g., "ACLS Certified", "NSS Certificate" |
| ↳ `issuingBody` | `String` | | |
| ↳ `issueDate` | `Date` | | |
| ↳ `expiryDate` | `Date` | | |
| ↳ `documentUrl` | `String` | | Uploaded certificate |
| `languages` | `Array[String]` | | ISO 639-1 codes |
| `educationLevel` | `String` | Enum: `none`, `primary`, `secondary`, `graduate`, `postgraduate`, `professional` | |
| `occupation` | `String` | Optional | Day-job for context |
| `priorDisasterExperience` | `Boolean` | Default: `false` | |
| `priorMissionsCount` | `Number` | Default: `0` | Lifetime external mission count (self-reported at onboarding) |
| **Transport & Logistics** | | | |
| `vehicleType` | `String` | Enum: `none`, `bicycle`, `motorcycle`, `car`, `suv`, `van`, `minivan`, `truck`, `boat`, `other` | |
| `vehicleRegistration` | `String` | Optional, Encrypted | For verification |
| `vehicleCapacityKg` | `Number` | Default: `0` | Payload in kilograms |
| `vehiclePassengerCapacity` | `Number` | Default: `0` | People capacity |
| `hasFuelReserve` | `Boolean` | Default: `false` | Can operate during fuel shortages |
| `travelRadiusKm` | `Number` | Default: `20`, Min: `1`, Max: `1000` | Max operational distance from home base |
| **Operational Status** | | | |
| `status` | `String` | Enum: `Active`, `Deployed`, `Unavailable`, `Inactive`, `Pending_Approval`, `Suspended` | Default: `Pending_Approval` |
| `responderType` | `String` | Enum: `resident`, `mobile` | Allocation engine classification |
| `assignmentStatus` | `String` | Enum: `unassigned`, `pending_accept`, `accepted`, `en_route`, `on_site`, `completed` | Default: `unassigned` |
| `currentAssignmentId` | `ObjectId` | Ref: `AllocationDecision`, Nullable | |
| `currentProjectId` | `ObjectId` | Ref: `Project`, Nullable | |
| `currentZoneId` | `ObjectId` | Ref: `Zone`, Nullable | |
| `currentLoad` | `Number` | Default: `0` | Active concurrent mission count |
| `maxConcurrentLoad` | `Number` | Default: `1` | Upper limit for current load |
| `assignmentAcceptedAt` | `Date` | Optional | |
| `deployedAt` | `Date` | Optional | |
| `locationId` | `ObjectId` | Ref: `Location`, Optional | Administrative home base |
| `homeZoneId` | `ObjectId` | Ref: `Zone`, Optional | Primary zone assignment |
| `projectIds` | `Array[ObjectId]` | Ref: `Project` | Active project enrollments |
| **Performance Metrics** | | | |
| `totalMissionsCompleted` | `Number` | Default: `0` | Lifetime within ImpactLink |
| `totalMissionsRecalled` | `Number` | Default: `0` | |
| `totalMissionsIncomplete` | `Number` | Default: `0` | |
| `completionRate` | `Number` | Default: `0`, Min: `0`, Max: `100` | Percentage — system-computed only |
| `averageRating` | `Number` | Default: `0`, Min: `0`, Max: `5` | Rolling average |
| `totalRatingsReceived` | `Number` | Default: `0` | |
| `performanceScore` | `Number` | Default: `50`, Min: `0`, Max: `100` | Composite AI-computed score |
| `performanceScoreUpdatedAt` | `Date` | Optional | |
| `responseTimeAvgMinutes` | `Number` | Default: `0` | Avg time from assignment to acceptance |
| **AI / Semantic Layer** | | | |
| `semanticProfile` | `String` | Optional | Flattened bio for AI consumption |
| `embedding` | `Array[Number]` | Optional, `select: false` | Vector representation for semantic search |
| `embeddingModel` | `String` | Optional | Model version that generated the embedding |
| `embeddingUpdatedAt` | `Date` | Optional | |
| **Administrative** | | | |
| `approvedBy` | `String` | Firebase UID, Optional | Admin who approved the volunteer |
| `approvedAt` | `Date` | Optional | |
| `rejectionReason` | `String` | Optional | If approval was denied |
| `adminNotes` | `String` | Optional, `select: false` | Internal admin-only field |
| `tags` | `Array[String]` | | Custom labels (e.g., "medical_lead", "district_coordinator") |
| `isActive` | `Boolean` | Default: `true` | |
| `deactivatedAt` | `Date` | Optional | |
| `deactivationReason` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Skills enum values:**
`first_aid`, `advanced_medical`, `nursing`, `surgery_assist`, `mental_health_counseling`, `search_rescue`, `swift_water_rescue`, `fire_suppression`, `structural_assessment`, `logistics_coordination`, `supply_chain`, `heavy_vehicle_driving`, `boat_operation`, `communication_systems`, `radio_operation`, `translation_hindi`, `translation_english`, `translation_regional`, `food_preparation`, `shelter_construction`, `child_protection`, `elderly_care`, `disability_support`, `data_collection`, `photography_documentation`, `legal_aid`, `financial_literacy`, `community_mobilization`, `it_support`, `drone_operation`

**Indexes:**
- `{ organizationId: 1, status: 1 }` — volunteer roster queries
- `{ organizationId: 1, assignmentStatus: 1 }` — dispatch queries
- `{ 'homeGeo.lat': 1, 'homeGeo.lng': 1 }` — proximity queries
- `{ projectIds: 1 }` — multi-key index for project roster
- `{ volunteerCode: 1 }` — sparse unique
- `{ linkedUserId: 1 }` — sparse

---

### 4.2 Collection: `volunteeravailability`

Extracted from the volunteer document to allow independent scheduling queries without loading the full volunteer profile.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`, Required, Unique | One document per volunteer |
| `organizationId` | `ObjectId` | Ref: `Organization` | Denormalized |
| `weeklySchedule` | `Object` | | 7-day × 3-slot grid |
| ↳ `monday` | `Object` | | `{ morning, afternoon, night }` — all Boolean |
| ↳ `tuesday` | `Object` | | |
| ↳ `wednesday` | `Object` | | |
| ↳ `thursday` | `Object` | | |
| ↳ `friday` | `Object` | | |
| ↳ `saturday` | `Object` | | |
| ↳ `sunday` | `Object` | | |
| `slotDefinitions` | `Object` | | Time boundaries for each slot (org-configurable) |
| ↳ `morningStart` | `String` | Default: `06:00` | HH:MM |
| ↳ `morningEnd` | `String` | Default: `12:00` | |
| ↳ `afternoonStart` | `String` | Default: `12:00` | |
| ↳ `afternoonEnd` | `String` | Default: `18:00` | |
| ↳ `nightStart` | `String` | Default: `18:00` | |
| ↳ `nightEnd` | `String` | Default: `06:00` | |
| `blackoutDates` | `Array[Object]` | | Specific unavailable dates |
| ↳ `date` | `Date` | | |
| ↳ `reason` | `String` | Optional | |
| `emergencyAvailable` | `Boolean` | Default: `false` | Can be called during off-hours for critical events |
| `maxHoursPerWeek` | `Number` | Default: `20` | Self-declared upper limit |
| `updatedAt` | `Date` | Auto | |

---

### 4.3 Collection: `missionhistories`

Immutable append-only ledger. Records are written on mission completion. Never edited — only created.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `zoneId` | `ObjectId` | Ref: `Zone` | |
| `eventId` | `ObjectId` | Ref: `Event`, Optional | If assigned to specific incident |
| `strategicMissionId` | `ObjectId` | Ref: `StrategicMission`, Optional | If part of cluster |
| `allocationDecisionId` | `ObjectId` | Ref: `AllocationDecision` | The decision that dispatched this volunteer |
| `missionType` | `String` | Enum: `relief_delivery`, `medical_response`, `evacuation`, `shelter_setup`, `search_rescue`, `community_outreach`, `logistics`, `assessment`, `other` | |
| `missionSummary` | `String` | Optional | Brief description of what was done |
| `resourcesCarried` | `Array[Object]` | | What the volunteer transported |
| ↳ `supplyId` | `ObjectId` | Ref: `Supply` | |
| ↳ `type` | `String` | | |
| ↳ `quantityCarried` | `Number` | | |
| ↳ `quantityDelivered` | `Number` | | |
| ↳ `quantityReturned` | `Number` | | |
| `beneficiariesServed` | `Number` | Default: `0` | Count of beneficiaries contacted |
| `startedAt` | `Date` | Required | When volunteer accepted assignment |
| `completedAt` | `Date` | Optional | |
| `durationMinutes` | `Number` | Optional | Computed: `completedAt - startedAt` |
| `distanceTravelledKm` | `Number` | Optional | Self-reported or GPS-derived |
| `routeGeojson` | `Object` | Optional | GeoJSON LineString if GPS tracking enabled |
| `status` | `String` | Enum: `completed`, `recalled`, `incomplete`, `abandoned` | |
| `incompleteReason` | `String` | Optional | If not completed |
| `volunteerNotes` | `String` | Optional | Field notes from volunteer |
| `adminNotes` | `String` | Optional | |
| `photosSubmitted` | `Array[String]` | | URLs to submitted field photos |
| `ratingGivenToMission` | `Number` | Min: `1`, Max: `5`, Optional | Volunteer rates the mission experience |
| `ratingComment` | `String` | Optional | |
| `createdAt` | `Date` | Auto | Immutable — this is the completion timestamp |

**Indexes:**
- `{ volunteerId: 1, createdAt: -1 }` — volunteer history list
- `{ projectId: 1, status: 1 }` — project completion reporting
- `{ organizationId: 1, createdAt: -1 }` — org-wide reporting

---

### 4.4 Collection: `volunteerratings`

Separate from missionhistories to allow two-way rating (admin rates volunteer; volunteer rates mission) without circular coupling.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`, Required, Index | |
| `missionHistoryId` | `ObjectId` | Ref: `MissionHistory`, Required, Unique | One rating per mission |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `ratedBy` | `String` | Firebase UID | Admin or project lead |
| `overallRating` | `Number` | Required, Min: `1`, Max: `5` | |
| `dimensions` | `Object` | | Granular performance assessment |
| ↳ `punctuality` | `Number` | Min: `1`, Max: `5` | |
| ↳ `communication` | `Number` | Min: `1`, Max: `5` | |
| ↳ `taskCompletion` | `Number` | Min: `1`, Max: `5` | |
| ↳ `teamwork` | `Number` | Min: `1`, Max: `5` | |
| ↳ `resourceHandling` | `Number` | Min: `1`, Max: `5` | |
| `comment` | `String` | Optional | Qualitative feedback |
| `isSharedWithVolunteer` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |

---

## 5. Domain IV — Tactical Beneficiary Intelligence

### 5.1 Collection: `beneficiarydatasets`

Immutable origin record of each data ingestion batch. The processing pipeline reads from this, writes results to `beneficiaries`.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Required, Index | |
| `name` | `String` | Required | User-given name for this dataset |
| `description` | `String` | Optional | |
| `tags` | `Array[String]` | | Searchable labels |
| `uploadedBy` | `String` | Firebase UID, Required | |
| `sourceFile` | `Object` | | |
| ↳ `originalName` | `String` | | Original filename |
| ↳ `storagePath` | `String` | | GCS/S3 path |
| ↳ `mimeType` | `String` | | `text/csv` or `application/vnd...xlsx` |
| ↳ `sizeBytes` | `Number` | | |
| ↳ `rowCount` | `Number` | | Total rows including header |
| ↳ `dataRowCount` | `Number` | | Rows minus header |
| ↳ `uploadedAt` | `Date` | | |
| `columnMapping` | `Object` | | How CSV columns map to beneficiary fields |
| ↳ `name` | `String` | | CSV column → beneficiary name |
| ↳ `phone` | `String` | | |
| ↳ `address` | `String` | | Raw address column |
| ↳ `lat` | `String` | | Latitude column (if coordinates present) |
| ↳ `lng` | `String` | | Longitude column |
| ↳ `needCategory` | `String` | | |
| ↳ `severity` | `String` | | |
| ↳ `customFields` | `Array[Object]` | | `[{ csvColumn, mappedTo }]` |
| ↳ `locationInputType` | `String` | Enum: `address`, `coordinates`, `mixed` | |
| ↳ `firstRowIsHeader` | `Boolean` | Default: `true` | |
| `geocodingOptions` | `Object` | | Options set during ingestion |
| ↳ `appendIndia` | `Boolean` | Default: `true` | |
| ↳ `confidenceThreshold` | `Number` | Default: `0.6` | |
| ↳ `skipEmptyLocations` | `Boolean` | Default: `true` | |
| `processingStats` | `Object` | | Pipeline progress |
| ↳ `status` | `String` | Enum: `pending`, `processing`, `complete`, `failed`, `cancelled` | Default: `pending` |
| ↳ `jobStartedAt` | `Date` | | |
| ↳ `jobCompletedAt` | `Date` | | |
| ↳ `processingTimeMs` | `Number` | | |
| ↳ `totalRows` | `Number` | Default: `0` | |
| ↳ `processedRows` | `Number` | Default: `0` | |
| ↳ `geocodedCount` | `Number` | Default: `0` | |
| ↳ `directCoordinatesCount` | `Number` | Default: `0` | |
| ↳ `cacheHitCount` | `Number` | Default: `0` | Rows resolved from geocoding cache |
| ↳ `failedCount` | `Number` | Default: `0` | |
| ↳ `lowConfidenceCount` | `Number` | Default: `0` | |
| ↳ `errorLog` | `Array[String]` | | Non-fatal pipeline errors |
| `linkedProjects` | `Array[ObjectId]` | Ref: `Project` | Projects that have imported this dataset |
| `isArchived` | `Boolean` | Default: `false` | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

### 5.2 Collection: `beneficiaries`

One document per individual beneficiary. Scale: potentially millions of records. Designed for efficient geospatial querying.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `datasetId` | `ObjectId` | Ref: `BeneficiaryDataset`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Index | |
| `rowIndex` | `Number` | Required | Original CSV row number (1-based, excluding header) |
| **Identity** | | | |
| `name` | `String` | Optional | May be a household head name |
| `householdSize` | `Number` | Default: `1` | Number of people this record represents |
| `phone` | `String` | Optional, Encrypted | |
| `alternatePhone` | `String` | Optional, Encrypted | |
| `gender` | `String` | Enum: `male`, `female`, `other`, `unknown` | Optional |
| `ageGroup` | `String` | Enum: `child`, `adult`, `elderly`, `unknown` | Optional |
| `hasDisability` | `Boolean` | Default: `false` | |
| `disabilityType` | `String` | Optional | |
| `isPregnantOrLactating` | `Boolean` | Default: `false` | |
| **Need Classification** | | | |
| `needCategory` | `String` | Enum: `food`, `water`, `medical`, `shelter`, `clothing`, `sanitation`, `evacuation`, `psychosocial`, `legal`, `financial`, `communication`, `other` | Required |
| `needSubcategory` | `String` | Optional | More specific need |
| `severity` | `Number` | Min: `1`, Max: `10`, Default: `5` | Urgency score |
| `isUrgent` | `Boolean` | Default: `false` | Flags requiring immediate response |
| `estimatedResourceUnits` | `Number` | Optional | How many units needed (e.g., food packets) |
| `specialRequirements` | `String` | Optional | Notes on specific needs |
| **Location** | | | |
| `rawLocation` | `String` | Optional | Original text from CSV |
| `geo` | `Object` | | Geocoded result |
| ↳ `lat` | `Number` | Optional | |
| ↳ `lng` | `Number` | Optional | |
| ↳ `formattedAddress` | `String` | | Google's normalized address |
| ↳ `locality` | `String` | | Neighborhood/area name |
| ↳ `district` | `String` | | |
| ↳ `state` | `String` | | |
| ↳ `postalCode` | `String` | | |
| ↳ `placeId` | `String` | | Google Places ID |
| ↳ `geocodeMethod` | `String` | Enum: `direct_coordinates`, `geocoded`, `manual_override`, `unresolved` | |
| ↳ `confidenceScore` | `Number` | Min: `0`, Max: `1` | |
| ↳ `locationType` | `String` | | Google's `location_type` value |
| ↳ `geocodedAt` | `Date` | | |
| **Service Tracking** | | | |
| `serviceStatus` | `String` | Enum: `unserved`, `partially_served`, `served`, `unreachable` | Default: `unserved` |
| `lastServedAt` | `Date` | Optional | |
| `servingVolunteerId` | `ObjectId` | Ref: `Volunteer`, Optional | Current assignment |
| `serviceHistory` | `Array[Object]` | | |
| ↳ `volunteerId` | `ObjectId` | | |
| ↳ `missionHistoryId` | `ObjectId` | | |
| ↳ `servedAt` | `Date` | | |
| ↳ `itemsDelivered` | `Object` | | |
| **Custom Data** | | | |
| `customFields` | `Map[String, String]` | | Pass-through of unmapped CSV columns |
| `rawRow` | `Object` | Optional, `select: false` | Complete original CSV row (for audit) |
| `isActive` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Indexes:**
- `{ datasetId: 1 }` — primary
- `{ organizationId: 1, needCategory: 1 }` — need-based queries
- `{ 'geo.lat': 1, 'geo.lng': 1 }` — geospatial
- `{ datasetId: 1, 'geo.placeId': 1 }` — deduplication

---

### 5.3 Collection: `beneficiaryzoneassignments`

Junction table: zone assignment is **project-scoped**. The same beneficiary record can be MATCHED in Project A but OUT_OF_ZONE in Project B. Storing this separately is mandatory.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `beneficiaryId` | `ObjectId` | Ref: `Beneficiary`, Required, Index | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `datasetId` | `ObjectId` | Ref: `BeneficiaryDataset` | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `status` | `String` | Enum: `matched`, `out_of_zone`, `low_confidence`, `geocode_failed`, `malformed`, `missing_location`, `excluded` | Required |
| `assignedZoneId` | `ObjectId` | Ref: `Zone`, Optional | Set when status = `matched` |
| `nearestZoneId` | `ObjectId` | Ref: `Zone`, Optional | Set when status = `out_of_zone` |
| `distanceFromZoneCenterKm` | `Number` | Optional | |
| `overshootKm` | `Number` | Optional | How far beyond the zone's radius |
| `resolvedBy` | `String` | Enum: `auto`, `admin_expand`, `admin_reassign`, `admin_exclude` | Default: `auto` |
| `resolvedByUid` | `String` | Firebase UID, Optional | Admin who resolved |
| `resolvedAt` | `Date` | Optional | |
| `resolutionNotes` | `String` | Optional | |
| `computedAt` | `Date` | Required | When zone intersection was calculated |

**Indexes:**
- `{ beneficiaryId: 1, projectId: 1 }` — unique compound
- `{ projectId: 1, status: 1 }` — resolution UI queries
- `{ projectId: 1, assignedZoneId: 1 }` — per-zone counts

---

## 6. Domain V — Events & Incident Management

### 6.1 Collection: `events`

Time-sensitive, localized incidents. The atomic unit processed by the allocation engine.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Index | Optional — events can exist outside a project during triage |
| `organizationId` | `ObjectId` | Ref: `Organization`, Index | |
| `beneficiaryId` | `ObjectId` | Ref: `Beneficiary`, Optional | Linked individual |
| `locationId` | `ObjectId` | Ref: `Location`, Optional | Administrative area parent |
| `zoneId` | `ObjectId` | Ref: `Zone`, Optional | Assigned operational zone |
| `strategicMissionId` | `ObjectId` | Ref: `StrategicMission`, Optional | DBSCAN cluster assignment |
| `reportedBy` | `String` | Firebase UID or `system` | |
| `source` | `String` | Enum: `field_report`, `gemini_extraction`, `csv_import`, `api_webhook`, `admin_manual`, `community_alert` | |
| `title` | `String` | Optional | Short description |
| `description` | `String` | Optional | Full field report text |
| `eventType` | `String` | Enum: `relief_delivery_needed`, `medical_emergency`, `evacuation_required`, `shelter_needed`, `search_rescue`, `utility_failure`, `supply_disruption`, `crowd_control`, `other` | |
| `needCategory` | `String` | Enum — same as Beneficiary.needCategory | |
| `severity` | `Number` | Required, Min: `1`, Max: `10` | |
| `resourceGap` | `Number` | Required | Absolute units of need |
| `resourceUnit` | `String` | Optional | e.g., "food_packets", "medical_kits" |
| `frequency` | `Number` | Default: `1` | Incidence rate |
| `timeSensitivity` | `Number` | Required, Min: `1`, Max: `10` | Rate of urgency escalation |
| `urgencyWindow` | `Number` | Default: `24` | Hours before algorithmic escalation |
| `urgencyScore` | `Number` | Default: `0` | Computed: decayed urgency score (system-managed) |
| `urgencyScoreUpdatedAt` | `Date` | Optional | |
| `geo` | `Object` | | |
| ↳ `lat` | `Number` | Required | |
| ↳ `lng` | `Number` | Required | |
| ↳ `formattedAddress` | `String` | Optional | |
| ↳ `accuracy` | `String` | Enum: `exact`, `approximate`, `district` | |
| `allocationStatus` | `String` | Enum: `unassigned`, `partially_saturated`, `saturated`, `critical_unmet` | Default: `unassigned` |
| `saturationRate` | `Number` | Default: `0`, Min: `0`, Max: `1` | Proportion of resourceGap fulfilled |
| `assignedResponders` | `Array[ObjectId]` | Ref: `Volunteer` | Currently assigned |
| `attachments` | `Array[Object]` | | Field photos, voice memos |
| ↳ `type` | `String` | Enum: `photo`, `audio`, `video`, `document` | |
| ↳ `url` | `String` | | |
| ↳ `uploadedAt` | `Date` | | |
| `geminiAnalysisId` | `ObjectId` | Ref: `GeminiExtraction`, Optional | If parsed by AI |
| `isVerified` | `Boolean` | Default: `false` | Admin-verified incident |
| `verifiedBy` | `String` | Firebase UID, Optional | |
| `verifiedAt` | `Date` | Optional | |
| `isClosed` | `Boolean` | Default: `false` | |
| `closedAt` | `Date` | Optional | |
| `closureReason` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

**Indexes:**
- `{ projectId: 1, allocationStatus: 1 }` — allocation engine queries
- `{ projectId: 1, severity: -1 }` — priority sorting
- `{ 'geo.lat': 1, 'geo.lng': 1 }` — geospatial (2dsphere)
- `{ strategicMissionId: 1 }` — cluster membership

---

### 6.2 Collection: `eventescalations`

Immutable log of every urgency escalation — when an event's urgency score crosses a threshold and an action was taken or needed.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `eventId` | `ObjectId` | Ref: `Event`, Required, Index | |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `escalationType` | `String` | Enum: `urgency_threshold_crossed`, `saturation_dropped`, `responder_withdrew`, `time_window_expired`, `manual_admin` | |
| `previousUrgencyScore` | `Number` | | |
| `newUrgencyScore` | `Number` | | |
| `previousStatus` | `String` | | `allocationStatus` before escalation |
| `newStatus` | `String` | | `allocationStatus` after |
| `triggeredAt` | `Date` | Required | |
| `triggeredBy` | `String` | `"system"` or Firebase UID | |
| `actionTaken` | `String` | Enum: `requeued_allocation`, `notification_sent`, `admin_alerted`, `none` | |
| `notes` | `String` | Optional | |

---

### 6.3 Collection: `strategicmissions`

DBSCAN-generated clusters of events representing a geographically and tactically coherent mission area.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `zoneId` | `ObjectId` | Ref: `Zone`, Optional | Zone this mission falls within |
| `name` | `String` | Optional | Auto-generated or admin-set name |
| `clusterAlgorithm` | `String` | Default: `DBSCAN` | Algorithm used |
| `clusterParameters` | `Object` | | Parameters used in clustering run |
| ↳ `epsilon` | `Number` | | DBSCAN epsilon (km) |
| ↳ `minPoints` | `Number` | | DBSCAN minPts |
| ↳ `runId` | `ObjectId` | Ref: `AIAnalysisRun` | |
| `centroid` | `Object` | | Geographic center of the cluster |
| ↳ `lat` | `Number` | | |
| ↳ `lng` | `Number` | | |
| `eventIds` | `Array[ObjectId]` | Ref: `Event` | Member events |
| `eventCount` | `Number` | | Denormalized count |
| `totalResourceGap` | `Number` | | Sum of member event gaps |
| `avgSeverity` | `Number` | | |
| `maxSeverity` | `Number` | | |
| `priorityScore` | `Number` | | Computed: density × severity × urgency_decay × (1 − saturation) |
| `priorityScoreUpdatedAt` | `Date` | | |
| `allocationStatus` | `String` | Enum: `unassigned`, `partially_allocated`, `fully_allocated`, `critical_unmet` | |
| `saturationRate` | `Number` | Default: `0` | |
| `assignedVolunteers` | `Array[ObjectId]` | Ref: `Volunteer` | |
| `isActive` | `Boolean` | Default: `true` | Set to false when all events closed |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

## 7. Domain VI — Resource & Logistics Management

### 7.1 Collection: `supplies`

Physical inventory items. One document per SKU per hub/location.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `zoneId` | `ObjectId` | Ref: `Zone`, Optional | Hub location of this stock |
| `name` | `String` | Required | e.g., "Ready-to-Eat Food Pack" |
| `sku` | `String` | Optional | Stock-keeping unit identifier |
| `category` | `String` | Enum: `food`, `water`, `medical`, `shelter`, `clothing`, `sanitation`, `communication`, `tools`, `transport`, `other` | |
| `subcategory` | `String` | Optional | |
| `unit` | `String` | Required | e.g., `packet`, `litre`, `kit`, `kg` |
| `totalQuantity` | `Number` | Default: `0` | Total registered |
| `availableQuantity` | `Number` | Default: `0` | In stock, unallocated |
| `allocatedQuantity` | `Number` | Default: `0` | Committed to missions (in transit or pending) |
| `deliveredQuantity` | `Number` | Default: `0` | Confirmed delivered |
| `thresholdMin` | `Number` | Default: `0` | Alert below this level |
| `thresholdCritical` | `Number` | Default: `0` | Critical alert level |
| `weightKgPerUnit` | `Number` | Optional | For transport capacity calculations |
| `volumeLitresPerUnit` | `Number` | Optional | |
| `expiryDate` | `Date` | Optional | For perishables |
| `batchNumber` | `String` | Optional | |
| `donorName` | `String` | Optional | |
| `valuationInr` | `Number` | Optional | Per-unit monetary value |
| `integrityStatus` | `String` | Enum: `verified`, `damaged`, `expired`, `unknown`, `quarantined` | Default: `unknown` |
| `lastAuditedAt` | `Date` | Optional | |
| `lastAuditedBy` | `String` | Firebase UID, Optional | |
| `storageLocation` | `String` | Optional | Physical location descriptor |
| `notes` | `String` | Optional | |
| `isActive` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

### 7.2 Collection: `supplyallocations`

Junction between supplies and missions. One document per dispatch.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `supplyId` | `ObjectId` | Ref: `Supply`, Required, Index | |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `zoneId` | `ObjectId` | Ref: `Zone` | Source zone |
| `eventId` | `ObjectId` | Ref: `Event`, Optional | Target incident |
| `strategicMissionId` | `ObjectId` | Ref: `StrategicMission`, Optional | |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`, Optional | Carrier |
| `allocationDecisionId` | `ObjectId` | Ref: `AllocationDecision`, Optional | |
| `unitsRequested` | `Number` | Required | |
| `unitsDispatched` | `Number` | Default: `0` | |
| `unitsDelivered` | `Number` | Default: `0` | Confirmed |
| `unitsReturned` | `Number` | Default: `0` | |
| `status` | `String` | Enum: `pending`, `approved`, `in_transit`, `delivered`, `partially_delivered`, `recalled`, `cancelled` | Default: `pending` |
| `approvedBy` | `String` | Firebase UID, Optional | |
| `approvedAt` | `Date` | Optional | |
| `dispatchedAt` | `Date` | Optional | |
| `estimatedArrival` | `Date` | Optional | ETA |
| `deliveredAt` | `Date` | Optional | |
| `deliveryConfirmedBy` | `String` | Firebase UID or `volunteer_self_report` | |
| `deliveryPhotoUrl` | `String` | Optional | Proof of delivery |
| `notes` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |
| `updatedAt` | `Date` | Auto | |

---

### 7.3 Collection: `supplytransactions`

Double-entry ledger for every stock movement. Immutable audit trail.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `supplyId` | `ObjectId` | Ref: `Supply`, Required, Index | |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `transactionType` | `String` | Enum: `receipt`, `dispatch`, `return`, `damage_write_off`, `expiry_write_off`, `audit_adjustment`, `transfer_in`, `transfer_out` | |
| `quantityBefore` | `Number` | Required | Stock before transaction |
| `quantityChanged` | `Number` | Required | Positive = inflow, Negative = outflow |
| `quantityAfter` | `Number` | Required | Stock after transaction |
| `referenceId` | `ObjectId` | Optional | Ref to SupplyAllocation or other source doc |
| `performedBy` | `String` | Firebase UID | |
| `notes` | `String` | Optional | |
| `createdAt` | `Date` | Auto | Immutable |

---

## 8. Domain VII — Allocation Engine

### 8.1 Collection: `allocationruns`

Records every time the allocation algorithm executes — whether manual, scheduled, or AI-triggered.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `triggeredBy` | `String` | Firebase UID or `system` | |
| `triggerReason` | `String` | Enum: `manual`, `scheduled`, `new_incident`, `volunteer_status_change`, `ai_recommendation` | |
| `algorithm` | `String` | Enum: `two_pass_greedy`, `ai_probabilistic`, `manual_override` | |
| `scope` | `String` | Enum: `full_project`, `zone_specific`, `single_event` | |
| `scopeTargetId` | `ObjectId` | Optional | Zone or Event ID if scoped |
| `status` | `String` | Enum: `running`, `completed`, `failed`, `cancelled` | |
| `pass1Stats` | `Object` | | Resident allocation results |
| ↳ `volunteersEvaluated` | `Number` | | |
| ↳ `volunteersAssigned` | `Number` | | |
| ↳ `eventsAddressed` | `Number` | | |
| `pass2Stats` | `Object` | | Mobile allocation results |
| ↳ `volunteersEvaluated` | `Number` | | |
| ↳ `volunteersAssigned` | `Number` | | |
| ↳ `eventsAddressed` | `Number` | | |
| `decisionsGenerated` | `Number` | | Total AllocationDecision documents created |
| `allocationEfficiencyPct` | `Number` | | (events addressed / total events) × 100 |
| `executionTimeMs` | `Number` | | |
| `errorLog` | `Array[String]` | | Non-fatal errors during run |
| `startedAt` | `Date` | | |
| `completedAt` | `Date` | | |
| `createdAt` | `Date` | Auto | |

---

### 8.2 Collection: `allocationdecisions`

Immutable ledger of each individual assignment decision made by the allocation engine. The authoritative record for what the algorithm decided and why.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `allocationRunId` | `ObjectId` | Ref: `AllocationRun`, Required, Index | |
| `projectId` | `ObjectId` | Ref: `Project`, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`, Required, Index | |
| `eventId` | `ObjectId` | Ref: `Event`, Optional | |
| `strategicMissionId` | `ObjectId` | Ref: `StrategicMission`, Optional | |
| `zoneId` | `ObjectId` | Ref: `Zone` | |
| `pass` | `Number` | Enum: `1`, `2` | Which allocation pass generated this |
| `decisionType` | `String` | Enum: `assign`, `hold_reserve`, `skip_overloaded`, `skip_unavailable`, `skip_skill_mismatch` | |
| `scoringFactors` | `Object` | | Explainability — why this volunteer was chosen |
| ↳ `skillMatchScore` | `Number` | | |
| ↳ `distanceScore` | `Number` | | |
| ↳ `performanceScore` | `Number` | | |
| ↳ `availabilityScore` | `Number` | | |
| ↳ `payloadFitScore` | `Number` | | |
| ↳ `etaScore` | `Number` | | |
| ↳ `compositeScore` | `Number` | | Weighted final score |
| `distanceKm` | `Number` | | Volunteer home to event |
| `estimatedEta` | `Date` | | |
| `status` | `String` | Enum: `proposed`, `pending_accept`, `accepted`, `rejected`, `completed`, `recalled`, `expired` | Default: `proposed` |
| `volunteerResponse` | `String` | Enum: `accepted`, `declined`, `no_response`, Optional | |
| `volunteerResponseAt` | `Date` | Optional | |
| `declinedReason` | `String` | Optional | |
| `overriddenBy` | `String` | Firebase UID, Optional | If admin manually overrode |
| `overriddenAt` | `Date` | Optional | |
| `overrideReason` | `String` | Optional | |
| `createdAt` | `Date` | Auto | Immutable |

---

## 9. Domain VIII — Geospatial & Location Infrastructure

### 9.1 Collection: `locations`

India-specific administrative hierarchy. Enables tree-traversal queries (village → block → district → state).

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `name` | `String` | Required | Official name |
| `nameHindi` | `String` | Optional | Hindi transliteration |
| `type` | `String` | Enum: `Country`, `State`, `Division`, `District`, `SubDistrict_Tehsil`, `Block`, `Village`, `Ward`, `Pincode_Area` | |
| `parentId` | `ObjectId` | Ref: `Location`, Nullable | Null for country-level |
| `ancestors` | `Array[ObjectId]` | | Materialized path for efficient tree queries |
| `level` | `Number` | | 0=Country, 1=State, 2=Division, 3=District, etc. |
| `lgdCode` | `String` | Optional | India's Local Government Directory code |
| `codeType` | `String` | Optional | e.g., `LGD`, `Census`, `ISO` |
| `externalCode` | `String` | Optional | |
| `lat` | `Number` | | Administrative centroid |
| `lng` | `Number` | | |
| `boundingBox` | `Object` | | `{ north, south, east, west }` |
| `polygon` | `Object` | Optional | GeoJSON polygon |
| ↳ `type` | `String` | `"Polygon"` | |
| ↳ `coordinates` | `Array` | | |
| `population` | `Number` | Optional | Census data |
| `areaKm2` | `Number` | Optional | |
| `isActive` | `Boolean` | Default: `true` | |

**Indexes:**
- `{ parentId: 1, type: 1 }` — hierarchy traversal
- `{ type: 1, name: 1 }` — name search
- `{ lgdCode: 1 }` — sparse
- `{ ancestors: 1 }` — multi-key for materialized path

---

### 9.2 Collection: `geocodingcaches`

API cost-reduction layer. Queries here before calling Google Geocoding API.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `normalizedAddress` | `String` | Required, Unique, Index | Lowercase, whitespace-stripped |
| `originalInput` | `String` | | For debugging |
| `lat` | `Number` | Required | |
| `lng` | `Number` | Required | |
| `formattedAddress` | `String` | | Google's canonical address |
| `placeId` | `String` | | Google Places ID |
| `locationType` | `String` | | Google's `location_type` |
| `addressComponents` | `Array[Object]` | | Parsed components from Google |
| `confidenceScore` | `Number` | | Computed on ingest |
| `country` | `String` | | ISO 3166-1 |
| `state` | `String` | | |
| `district` | `String` | | |
| `hitCount` | `Number` | Default: `1` | How many times this cache entry was used |
| `lastHitAt` | `Date` | | |
| `cachedAt` | `Date` | Auto | |

**Indexes:**
- `{ normalizedAddress: 1 }` — unique
- `{ cachedAt: 1 }` — TTL Index (`expireAfterSeconds: 7776000`) — auto-purge after 90 days
- `{ placeId: 1 }` — sparse, for deduplication

---

## 10. Domain IX — Intelligence & AI Layer

### 10.1 Collection: `aianalysisruns`

Records every AI operation — DBSCAN clustering, urgency recalculation, semantic analysis.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `runType` | `String` | Enum: `dbscan_clustering`, `urgency_recalculation`, `semantic_matching`, `anomaly_detection`, `resource_recommendation`, `volunteer_embedding_update` | |
| `triggeredBy` | `String` | Firebase UID or `system` | |
| `model` | `String` | | e.g., `gemini-2.5-flash`, `gemini-2.5-pro`, `text-embedding-004` |
| `status` | `String` | Enum: `running`, `completed`, `failed` | |
| `inputSummary` | `Object` | | What was fed in |
| `outputSummary` | `Object` | | What was produced |
| `executionTimeMs` | `Number` | | |
| `tokensUsed` | `Number` | Optional | For billing tracking |
| `errorMessage` | `String` | Optional | |
| `startedAt` | `Date` | | |
| `completedAt` | `Date` | | |
| `createdAt` | `Date` | Auto | |

---

### 10.2 Collection: `geminiextractions`

Output of every Gemini ETL run on unstructured field report text.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `aiAnalysisRunId` | `ObjectId` | Ref: `AIAnalysisRun` | |
| `projectId` | `ObjectId` | Ref: `Project` | |
| `sourceEventId` | `ObjectId` | Ref: `Event`, Optional | If extraction created or enriched an event |
| `rawInput` | `String` | | The unstructured input text (field report) |
| `rawOutput` | `String` | | Full Gemini response |
| `extractedFields` | `Object` | | Structured extraction result |
| ↳ `eventType` | `String` | | |
| ↳ `needCategory` | `String` | | |
| ↳ `severity` | `Number` | | |
| ↳ `resourceGap` | `Number` | | |
| ↳ `locationText` | `String` | | |
| ↳ `urgencySignals` | `Array[String]` | | Keywords that indicate urgency |
| ↳ `confidence` | `Number` | | Gemini's self-assessed confidence |
| `anomaliesDetected` | `Array[Object]` | | |
| ↳ `type` | `String` | | |
| ↳ `description` | `String` | | |
| `wasAccepted` | `Boolean` | Default: `false` | Did admin accept this extraction |
| `acceptedBy` | `String` | Firebase UID, Optional | |
| `acceptedAt` | `Date` | Optional | |
| `rejectionReason` | `String` | Optional | |
| `model` | `String` | | Gemini model version used |
| `promptVersion` | `String` | | For tracking prompt engineering iterations |
| `createdAt` | `Date` | Auto | |

---

## 11. Domain X — Notifications & Communications

### 11.1 Collection: `notifications`

Every in-app and push notification generated by the system.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `recipientUid` | `String` | Firebase UID, Required, Index | |
| `recipientVolunteerId` | `ObjectId` | Ref: `Volunteer`, Optional | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `projectId` | `ObjectId` | Ref: `Project`, Optional | |
| `type` | `String` | Enum: `new_assignment`, `assignment_update`, `mission_complete`, `urgency_escalation`, `supply_low`, `supply_critical`, `project_update`, `system_alert`, `approval_required`, `report_ready` | |
| `title` | `String` | Required | |
| `body` | `String` | Required | |
| `data` | `Object` | Optional | Deep-link context `{ screen, params }` |
| `priority` | `String` | Enum: `low`, `normal`, `high`, `critical` | Default: `normal` |
| `channels` | `Array[String]` | | Which channels were used: `in_app`, `push`, `email`, `sms` |
| `isRead` | `Boolean` | Default: `false` | |
| `readAt` | `Date` | Optional | |
| `pushStatus` | `String` | Enum: `pending`, `sent`, `failed`, `not_applicable` | |
| `pushSentAt` | `Date` | Optional | |
| `pushError` | `String` | Optional | |
| `expiresAt` | `Date` | Optional | |
| `createdAt` | `Date` | Auto | |

**Indexes:**
- `{ recipientUid: 1, isRead: 1, createdAt: -1 }` — notification feed query
- `{ expiresAt: 1 }` — TTL Index for auto-cleanup

---

### 11.2 Collection: `communicationlogs`

Tracks every external communication (SMS, email, WhatsApp) for compliance and debugging.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `recipientUid` | `String` | Firebase UID, Optional | |
| `recipientPhone` | `String` | Optional | Hashed for PII |
| `recipientEmail` | `String` | Optional | Hashed |
| `channel` | `String` | Enum: `sms`, `email`, `whatsapp`, `push` | |
| `provider` | `String` | e.g., `twilio`, `sendgrid`, `firebase_fcm` | |
| `messageType` | `String` | | Template or notification type |
| `status` | `String` | Enum: `queued`, `sent`, `delivered`, `failed`, `bounced` | |
| `providerMessageId` | `String` | Optional | External message ID |
| `sentAt` | `Date` | Optional | |
| `deliveredAt` | `Date` | Optional | |
| `failureReason` | `String` | Optional | |
| `createdAt` | `Date` | Auto | |

---

## 12. Domain XI — Reporting & Analytics

### 12.1 Collection: `reporttemplates`

Pre-defined report formats available for generation.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Optional | `null` = system template |
| `name` | `String` | Required | e.g., "Daily Situation Report", "Volunteer Performance Review" |
| `description` | `String` | Optional | |
| `reportType` | `String` | Enum: `situation_report`, `volunteer_performance`, `resource_utilization`, `beneficiary_coverage`, `mission_summary`, `financial_summary`, `donor_report`, `compliance_report` | |
| `format` | `String` | Enum: `pdf`, `xlsx`, `docx`, `json`, `csv` | Default: `pdf` |
| `schedule` | `Object` | Optional | Auto-generation schedule |
| ↳ `frequency` | `String` | Enum: `daily`, `weekly`, `monthly`, `on_milestone` | |
| ↳ `dayOfWeek` | `Number` | | 0=Sunday for weekly |
| ↳ `timeUtc` | `String` | | HH:MM |
| `sections` | `Array[String]` | | Which data sections to include |
| `filters` | `Object` | | Default filters for this template |
| `isSystem` | `Boolean` | Default: `false` | Cannot be deleted |
| `isActive` | `Boolean` | Default: `true` | |
| `createdAt` | `Date` | Auto | |

---

### 12.2 Collection: `generatedreports`

Record of every report generated, with storage path for download.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `templateId` | `ObjectId` | Ref: `ReportTemplate`, Optional | |
| `projectId` | `ObjectId` | Ref: `Project`, Optional | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Required | |
| `generatedBy` | `String` | Firebase UID or `system` | |
| `reportType` | `String` | Same enum as template | |
| `format` | `String` | | |
| `title` | `String` | Required | |
| `periodStart` | `Date` | Optional | Data period covered |
| `periodEnd` | `Date` | Optional | |
| `filters` | `Object` | | Filters applied |
| `storagePath` | `String` | Optional | GCS/S3 path |
| `downloadUrl` | `String` | Optional | Signed URL |
| `downloadUrlExpiresAt` | `Date` | Optional | |
| `sizeBytes` | `Number` | Optional | |
| `status` | `String` | Enum: `queued`, `generating`, `complete`, `failed` | |
| `errorMessage` | `String` | Optional | |
| `generatedAt` | `Date` | Optional | |
| `createdAt` | `Date` | Auto | |

---

### 12.3 Collection: `dashboardsnapshots`

Point-in-time caches of dashboard aggregations. Prevents expensive aggregations on every page load.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `projectId` | `ObjectId` | Ref: `Project`, Required, Index | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `snapshotType` | `String` | Enum: `project_summary`, `zone_summary`, `volunteer_summary`, `resource_summary`, `beneficiary_summary` | |
| `data` | `Object` | | The cached aggregation result |
| `validUntil` | `Date` | | When this snapshot should be regenerated |
| `generatedAt` | `Date` | | |
| `createdAt` | `Date` | Auto | |

**Indexes:**
- `{ projectId: 1, snapshotType: 1 }` — unique compound
- `{ validUntil: 1 }` — TTL Index

---

## 13. Domain XII — Security & Compliance

### 13.1 Collection: `auditlogs`

Append-only. No updates or deletes ever permitted. Every sensitive data operation is logged.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization`, Index | |
| `actorUid` | `String` | Firebase UID, Required | Who performed the action |
| `actorRole` | `String` | | Role at time of action |
| `actorIp` | `String` | | IP address |
| `actorUserAgent` | `String` | | Browser/app identifier |
| `action` | `String` | Required | e.g., `VIEW_PII`, `EXPORT_BENEFICIARY_DATA`, `DELETE_VOLUNTEER`, `MODIFY_ROLE` |
| `resource` | `String` | Required | Collection name |
| `targetId` | `String` | Optional | Document ID affected |
| `projectId` | `ObjectId` | Ref: `Project`, Optional | |
| `changesBefore` | `Object` | Optional, `select: false` | State before change (sensitive — PII-free snapshot) |
| `changesAfter` | `Object` | Optional, `select: false` | State after change |
| `outcome` | `String` | Enum: `success`, `denied`, `error` | |
| `denialReason` | `String` | Optional | |
| `sessionId` | `String` | Optional | Firebase session identifier |
| `createdAt` | `Date` | Auto, Index | Immutable |

**Indexes:**
- `{ organizationId: 1, createdAt: -1 }` — org audit log
- `{ actorUid: 1, createdAt: -1 }` — user activity
- `{ action: 1, createdAt: -1 }` — action-type queries
- `{ createdAt: -1 }` — general time-series

---

### 13.2 Collection: `dataexportrequests`

Tracks DPDP Act / GDPR data export requests from individuals.

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `_id` | `ObjectId` | Auto | |
| `organizationId` | `ObjectId` | Ref: `Organization` | |
| `requestType` | `String` | Enum: `data_access`, `data_deletion`, `data_correction`, `data_portability` | |
| `requestedBy` | `String` | Firebase UID | |
| `subjectType` | `String` | Enum: `user_self`, `beneficiary`, `volunteer` | Whose data is being requested |
| `subjectId` | `String` | | The subject's ID or UID |
| `status` | `String` | Enum: `pending`, `in_review`, `fulfilled`, `denied`, `partial` | |
| `reviewedBy` | `String` | Firebase UID, Optional | |
| `reviewedAt` | `Date` | Optional | |
| `fulfilledAt` | `Date` | Optional | |
| `responseNotes` | `String` | Optional | |
| `exportPath` | `String` | Optional | GCS/S3 path if data was exported |
| `legalBasis` | `String` | Optional | Why request was granted or denied |
| `dueDate` | `Date` | | 30 days from request per DPDP Act |
| `createdAt` | `Date` | Auto | |

---

## 14. Cross-Collection Index Reference

The following compound indexes are critical for application performance and must be created at database initialization.

| Collection | Index | Type | Purpose |
|:---|:---|:---|:---|
| `users` | `{ uid: 1 }` | Unique | Firebase auth lookup |
| `users` | `{ email: 1 }` | Unique | Login lookup |
| `volunteers` | `{ organizationId: 1, status: 1, assignmentStatus: 1 }` | Compound | Allocation engine Pass 1 & 2 filter |
| `volunteers` | `{ 'homeGeo.lat': 1, 'homeGeo.lng': 1 }` | 2dsphere | Proximity dispatch |
| `beneficiaries` | `{ datasetId: 1, 'geo.placeId': 1 }` | Compound | Deduplication |
| `beneficiaryzoneassignments` | `{ beneficiaryId: 1, projectId: 1 }` | Unique | Prevents duplicate zone assignments |
| `events` | `{ projectId: 1, allocationStatus: 1, urgencyScore: -1 }` | Compound | Allocation queue sort |
| `events` | `{ 'geo.lat': 1, 'geo.lng': 1 }` | 2dsphere | DBSCAN input |
| `strategicmissions` | `{ projectId: 1, priorityScore: -1 }` | Compound | Mission priority dashboard |
| `supplies` | `{ projectId: 1, category: 1, availableQuantity: 1 }` | Compound | Gap engine query |
| `auditlogs` | `{ organizationId: 1, createdAt: -1 }` | Compound | Compliance reporting |
| `geocodingcaches` | `{ cachedAt: 1 }` | TTL | 90-day auto-expiry |
| `notifications` | `{ expiresAt: 1 }` | TTL | Auto-cleanup |
| `invitations` | `{ expiresAt: 1 }` | TTL | 72-hour auto-expiry |

---

## 15. Field Naming Conventions

All Mongoose models must adhere to these conventions without exception:

| Convention | Rule | Example |
|:---|:---|:---|
| **Fields** | `camelCase` | `linkedVolunteerId`, `totalMissionsCompleted` |
| **Collections** | `lowercase`, `plural` | `volunteers`, `missionhistories` |
| **Enums** | `snake_case` values | `'first_aid'`, `'pending_accept'` |
| **Foreign keys** | suffix `Id` | `projectId`, `volunteerId` |
| **Booleans** | prefix `is` or `has` | `isActive`, `hasDisability` |
| **Timestamps** | suffix `At` | `createdAt`, `approvedAt` |
| **Counts** | suffix `Count` | `totalMissionsCompleted`, `eventCount` |
| **Percentages** | suffix `Pct` or `Rate` | `completionRate`, `saturationRate` |
| **Coordinates** | `lat`, `lng` (not `lon`) | |
| **Encrypted PII** | note in comments | `nationalId`, `phone` — encrypt at app layer |
| **Admin-only fields** | `select: false` | `embedding`, `adminNotes`, `rawRow` |
| **Derived fields** | never stored | `gap_delta`, `coverage_pct` — compute in aggregation |

---

*ImpactLink Database Schema v2.0 — Production Grade. All collections must be implemented in full. Partial implementations will cause application failures.*
