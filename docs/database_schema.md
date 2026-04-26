# ImpactLink: MongoDB Atlas Architecture

This document provides a comprehensive mapping of the MongoDB Atlas database schema for ImpactLink. It defines every collection, document structure, key constraint, and cross-collection relationship based on the Mongoose models used in the Node.js backend.

---

## 1. Core Architecture Overview

The database is divided into four primary domains:
1. **Project & Resource Management**: `Project`, `Supply`
2. **Tactical Beneficiary Intelligence**: `BeneficiaryDataset`, `Beneficiary`, `Event`
3. **Human Capital & Deployment**: `User`, `Volunteer`, `MissionHistory`
4. **Geospatial & Security Infrastructure**: `Location`, `GeocodingCache`, `AuditLog`

---

## 2. Project & Resource Management

### Collection: `projects`
Manages hierarchical disaster response campaigns, regional boundaries, temporal phases, and required resources.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary identifier. |
| `name` | `String` | Required | Campaign name (e.g., "Assam Flood Relief"). |
| `description` | `String` | Optional | Narrative description. |
| `scope` | `String` | Enum | `['City', 'District', 'State', 'Global', 'Custom']`. Default: `District`. |
| `regions` | `Array[Object]`| | Array of operational zones. |
| ↳ `center.lat` | `Number` | | Latitude of the region center. |
| ↳ `center.lng` | `Number` | | Longitude of the region center. |
| ↳ `radius` | `Number` | Default: `50` | Operational radius in kilometers. |
| ↳ `name` | `String` | | Human-readable region name. |
| `timeline` | `Object` | | Project temporal boundaries. |
| ↳ `startDate` | `Date` | | Mission kick-off. |
| ↳ `endDate` | `Date` | | Mission conclusion target. |
| ↳ `phases` | `Array[Object]`| | Phase definitions (e.g., `[{name: 'Recon', durationDays: 3}]`). |
| `volunteerTargets` | `Object` | | Human capital goals. |
| ↳ `total` | `Number` | Default: `0` | Total personnel needed. |
| ↳ `local` | `Number` | Default: `0` | Local resident targets. |
| ↳ `travel` | `Number` | Default: `0` | Mobile/deployment targets. |
| ↳ `requiredSkills`| `Array[String]`| | Required capabilities (e.g., `["medical", "logistics"]`). |
| `hierarchicalSupplies`| `Array[Object]`| | Grouped resource requirements. |
| ↳ `category` | `String` | Required | e.g., "Food", "Medical". |
| ↳ `items` | `Array[Object]`| | Specific SKUs (e.g., `type`, `unit`, `targetQuantity`). |
| `operatingMode` | `String` | Enum | `['manual', 'assisted', 'autopilot']`. Default: `manual`. |
| `allocationStrategy`| `String` | Enum | `['ai', 'manual']`. Default: `ai`. |
| `assignedRoster` | `Array[Object]`| | Linked volunteers assigned to this project. |
| ↳ `volunteerId` | `ObjectId` | Ref: `Volunteer`| Foreign key to responder. |
| ↳ `regionIndex` | `Number` | | Index of the region array they are assigned to. |
| ↳ `type` | `String` | Enum | `['local', 'travel']`. |
| `beneficiaryDatasets`| `Array[Object]`| | Links to ingested datasets mapping the "Need". |
| ↳ `datasetId` | `ObjectId` | Ref: `BeneficiaryDataset`| Foreign key. |
| `beneficiarySummary`| `Object` | | Roll-up statistics for dashboard caching. |
| `metadata` | `Object` | | Workflow and notification settings. |
| `isActive` | `Boolean` | Default: `true`| Soft-delete/Archive flag. |

### Collection: `supplies`
Tracks physical inventory and distribution.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `projectId` | `ObjectId` | Ref: `Project` | Parent campaign. |
| `type` | `String` | Required | SKU/Item type matching the Project definition. |
| `quantity` | `Number` | Default: `0` | Available stock. |
| `assignedTo` | `ObjectId` | Ref: `Volunteer`| (Nullable) Responder holding the stock. |
| `location` | `String` | Default: `Warehouse`| Physical storage descriptor. |

---

## 3. Tactical Beneficiary Intelligence

### Collection: `beneficiarydatasets`
Tracks the ingestion pipelines (CSV uploads, Gemini parsing).

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required | Dataset file/batch name. |
| `uploadedBy` | `String` | Required | Firebase UID of the uploader. |
| `sourceFile` | `Object` | | Metadata of the raw ingested file. |
| ↳ `storagePath` | `String` | | File pointer. |
| ↳ `rowCount` | `Number` | | Total rows ingested. |
| `columnMapping` | `Object` | | Rules defining how CSV columns map to backend keys. |
| ↳ `name`, `phone`| `String` | | Pointer to specific CSV headers. |
| `processingStats` | `Object` | | Pipeline state (pending, processing, complete, failed). |
| ↳ `geocodedCount` | `Number` | | Successfully plotted rows. |

### Collection: `beneficiaries`
Individual points of need mapped via AI or CSV.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `datasetId` | `ObjectId` | Ref: `BeneficiaryDataset`| Origin batch. Index: `true`. |
| `projectId` | `ObjectId` | Ref: `Project` | Campaign association. Index: `true`. |
| `name`, `phone` | `String` | | Identity data. |
| `needCategory` | `String` | Enum | `['food', 'medical', 'shelter', 'water', ...]`. |
| `severity` | `Number` | Min: `1`, Max: `10`| Derived urgency. Default: `5`. |
| `rawLocation` | `String` | | Raw text string (e.g., "Near AIIMS"). |
| `geo` | `Object` | | Structured location output. |
| ↳ `lat`, `lng` | `Number` | Geospatial | Coordinates. *Geospatial Index applied.* |
| ↳ `placeId` | `String` | | Google Places ID for deduplication. |
| ↳ `confidenceScore`| `Number` | `0.0` - `1.0` | Geocoding accuracy metric. |
| `zoneAssignment` | `Object` | | Intersection calculations against Project regions. |
| ↳ `status` | `String` | Enum | `['matched', 'out_of_zone', 'low_confidence', ...]`. |
| ↳ `assignedZoneId`| `String` | | Which project zone claims this point. |

### Collection: `events`
Dynamic, time-sensitive incidents representing localized crises. Used for the Two-Pass Allocation Engine.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `projectId` | `ObjectId` | Ref: `Project` | (Nullable). |
| `beneficiaryId` | `ObjectId` | Ref: `Beneficiary`| (Nullable). |
| `locationId` | `ObjectId` | Ref: `Location` | Spatial hierarchy parent. |
| `eventType` | `String` | | e.g., "Relief Delivery", "Utility Failure". |
| `severity` | `Number` | Min: `1`, Max: `10`| Criticality score. |
| `resourceGap` | `Number` | Required | Absolute units of need missing. |
| `frequency` | `Number` | Required | Incidence rate. |
| `timeSensitivity` | `Number` | Required | Decay factor. |
| `lat`, `lng` | `Number` | Geospatial | Point of incident. |
| `allocationStatus`| `String` | Enum | `['unassigned', 'partially_saturated', 'saturated', 'critical_unmet']`. |
| `saturationRate` | `Number` | `0.0` - `1.0` | Percentage of `resourceGap` fulfilled. |
| `assignedResponders`| `Array[ObjectId]`| Ref: `Volunteer`| Roster of deployed personnel. |
| `urgencyWindow` | `Number` | Default: `24` | Hours before algorithmic escalation. |

---

## 4. Human Capital & Deployment

### Collection: `users`
Auth layer mapping Firebase to MongoDB.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `uid` | `String` | Required, Unique| Firebase Auth UID. |
| `email` | `String` | Required | Contact email. |
| `role` | `String` | Enum | `['Volunteer', 'Administrator']`. |
| `linkedVolunteerId`| `ObjectId` | Ref: `Volunteer`| Links the auth account to a tactical responder profile. |

### Collection: `volunteers`
Tactical responder profiles for AI matching.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `projectIds` | `Array[ObjectId]`| Ref: `Project` | Active campaign enrollments. |
| `status` | `String` | Enum | `['Active', 'Deployed', 'Inactive']`. |
| `locationId` | `ObjectId` | Ref: `Location` | Home base/Hub mapping. |
| `skills` | `Array[String]`| Enum | Categorical skills (e.g., `first_aid`, `water_rescue`). |
| `availability` | `Object` | | Day/time matrix (e.g., `monday.morning: true`). |
| `vehicleType` | `String` | Enum | Transport class (`none`, `motorcycle`, `suv`, `truck`). |
| `assignmentStatus`| `String` | Enum | Lifecycle: `['unassigned', 'en_route', 'on_site', ...]`. |
| `responderType` | `String` | Enum | Allocation engine classification: `['resident', 'mobile']`. |
| `currentLoad` | `Number` | Default: `0` | Active mission count (prevents burnout/overallocation). |
| `semanticProfile` | `String` | | Flattened biographical string for AI consumption. |
| `embedding` | `Array[Number]`| | Vector representation of skills for Semantic Search. |

### Collection: `missionhistories`
Immutable ledger of completed or failed tactical assignments.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `volunteerId` | `ObjectId` | Ref: `Volunteer`| Responder tracked. |
| `missionId` | `ObjectId` | | Reference to the incident/event. |
| `status` | `String` | Enum | `['completed', 'recalled', 'incomplete']`. |
| `durationMinutes` | `Number` | | Actual time-on-target. |
| `ratingGiven` | `Number` | Min: `1`, Max: `5`| Performance or mission success metric. |

---

## 5. Geospatial & Security Infrastructure

### Collection: `locations`
Defines the spatial taxonomy of the operational theater.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required | Toponym (e.g., "Assam"). |
| `type` | `String` | Enum | `['Ward', 'Sector', 'Village', 'District']`. |
| `parentId` | `ObjectId` | Ref: `Location` | Enables tree-structure traversal (e.g., Ward -> District). |
| `lat`, `lng` | `Number` | | Polygon center. |

### Collection: `geocodingcaches`
API cost-reduction strategy. Maps messy input strings to precise outputs.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `normalizedAddress`| `String` | Unique, Index | Lowercase, whitespace-stripped input string. |
| `lat`, `lng` | `Number` | Required | Google API result. |
| `placeId` | `String` | | Unique Google Map identifier. |
| `cachedAt` | `Date` | TTL Index | Auto-expires after 90 days. |

### Collection: `auditlogs`
Security and compliance tracking (HIPAA standard logging).

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `String` | Required | Actor's Firebase UID. |
| `action` | `String` | Required | Event (e.g., `VIEW_PII`, `EXPORT_DATA`). |
| `resource` | `String` | Required | Affected collection (e.g., `BeneficiaryRecords`). |
| `targetId` | `String` | | Specific document ID touched. |
| `ipAddress` | `String` | | Tracing metric. |

---

*Generated by ImpactLink System Architecture Tools. Accurate as of current Mongoose Model definitions.*
