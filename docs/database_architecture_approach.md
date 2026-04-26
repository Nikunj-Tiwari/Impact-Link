# ImpactLink: Database Architecture & Strategic Approach

While the `database_schema.md` provides the literal "what" of our MongoDB collections, this document explains the **"why"** and **"how"**. It outlines the strategic engineering decisions, performance optimizations, and algorithmic approaches embedded directly into our database design.

---

## 1. Why MongoDB Atlas for ImpactLink?

Disaster relief data is inherently unstructured, highly volatile, and deeply geospatial. We chose MongoDB (NoSQL) over a rigid SQL relational database for three critical reasons:
1. **Schema Flexibility**: Field reports (ingested via Gemini) have unpredictable fields. MongoDB allows us to store dynamic `customFields` directly on the `Beneficiary` documents without altering the core schema.
2. **Native Geospatial Queries**: Operations like "find nearest volunteer" or "calculate zone intersection" rely on MongoDB's native `$nearSphere` and `$geoWithin` operators, powered by `2dsphere` indexing.
3. **Array/Document Nesting**: A `Project` naturally contains hierarchical phases, zones, and supplies. Storing these as nested arrays rather than running complex SQL `JOIN`s drastically improves read performance for the mission dashboard.

---

## 2. Ingestion & Beneficiary Intelligence Approach

### The "Dark Data" to Structured Ledger Pipeline
When unstructured data (CSV, audio, photos) is processed by our Gemini pipeline, the database uses a two-tier approach:
- **`BeneficiaryDataset` (The Source)**: Acts as the immutable origin record. We store metadata about the original file, row counts, and processing stats. If the pipeline fails midway, we know exactly where it stopped.
- **`Beneficiary` (The Granular Output)**: Every row/entity becomes a standalone document. This is crucial because it allows us to assign individual severity scores, track exact geospatial coordinates, and assign each person to a specific `zoneAssignment` independent of the batch they were uploaded in.

### The Geocoding Cache Strategy
Geocoding messy addresses via Google Maps API is expensive and rate-limited. 
**Approach**: The `GeocodingCache` collection acts as an interception layer. Before hitting an external API, we check if the `normalizedAddress` exists in our cache. We utilize a MongoDB **TTL (Time-To-Live) Index** (`expireAfterSeconds: 7776000`) to automatically delete cached records after 90 days, ensuring our data stays fresh without manual cleanup scripts.

---

## 3. The Two-Pass Allocation Engine Design

Our tactical allocation isn't just code; it's baked into the data models. The `Event` and `Volunteer` collections are explicitly designed to support a deterministic algorithm.

### The Problem of "Stale" Disasters
**Approach**: The `Event` collection includes a `timeSensitivity` metric and an `urgencyWindow`. Instead of a static severity score, our engine uses these database fields to calculate **Urgency Decay**—automatically escalating "silent" crises as time passes without resource fulfillment.

### Saturation over Binary Fulfillment
**Approach**: Instead of marking an `Event` as simply "Done" or "Not Done", we use an `allocationStatus` enum (`partially_saturated`, `saturated`) and a `saturationRate` percentage. This allows the system to partially fulfill a massive resource gap (e.g., sending 50 food packets when 100 are needed) and prioritize the remaining gap in the next algorithm loop.

---

## 4. Semantic Skill Mapping (Vector Search)

Traditional skill matching uses simple keywords (e.g., `skill == 'medical'`), which fails in nuanced disaster scenarios.
**Approach**: The `Volunteer` model includes a `semanticProfile` (a raw text bio) and an `embedding` array. 
- When a volunteer signs up, we generate a high-dimensional vector representation of their skills using an AI embedding model.
- We store this vector array directly in MongoDB. 
- This allows us to perform **Semantic/Vector Search** directly at the database level. If an event requires "Pediatric Trauma Care", the database can mathematically find volunteers with similar semantic profiles, even if they only listed "Child First Aid".
- *Optimization*: The `embedding` field is marked `select: false` so it doesn't bog down standard UI queries, keeping standard dashboard reads lightning fast.

---

## 5. Security, Auditing, & Identity

### Decoupling Auth from Tactical Profiles
**Approach**: Firebase handles authentication (passwords, MFA, social logins). We store only the resulting Firebase UID in our MongoDB `User` collection. This `User` document acts as a thin routing layer, pointing to a robust `Volunteer` document via `linkedVolunteerId`. This separation of concerns ensures that if an authentication strategy changes, our tactical data remains untouched.

### HIPAA/Compliance Logging
**Approach**: Disaster data contains highly sensitive PII (Personally Identifiable Information). The `AuditLog` collection is an append-only ledger. Every time an admin views a beneficiary list or exports data, a log is written. We use a compound index (`{ timestamp: -1, action: 1 }`) on this collection to allow instantaneous generation of compliance reports.

---

### Summary
The ImpactLink database is not just a storage locker; it is the structural backbone of our algorithmic logic. By leveraging native NoSQL features (geospatial indexes, TTL caches, dynamic schemas, and vector arrays), the database actively participates in routing aid faster and more intelligently.
