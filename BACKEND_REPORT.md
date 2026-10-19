# UrineScan
## AI-Assisted Point-of-Care Urinalysis Diagnostic Engine (Backend Architecture & Clinical Intelligence Layer)

### Group Members
* **Rithvik Sharma**: 1601424001
* **Veeresh Bhat**: 16010424014

### Github repo link:
[https://github.com/veereshbhat-svu/wp2-miniproject.git](https://github.com/veereshbhat-svu/wp2-miniproject.git)

---

### Problem Statement

Design and implement a scalable, regulation-aligned backend service for **UrineScan** built with **Node.js, Express.js, and MongoDB (via Mongoose ODM)**, that transitions the platform from a simulated client-side prototype to a persistent, clinical-grade Point-of-Care (POC) diagnostic engine. The backend must replace static mock data and ephemeral `localStorage` with a robust multi-collection MongoDB database, implement an on-device computer vision colorimetry algorithm that extracts and quantifies real RGB pixel data from uploaded 10-pad reagent strips, provide an automated clinical decision-support engine that correlates chemical analytes with triage symptoms, generate cryptographically verified scannable QR codes for smartphone verification across the hospital LAN, stream real-time sensor telemetry via Server-Sent Events (SSE), and produce official hospital-branded diagnostic PDF reports.

The purpose of the backend is to establish an end-to-end medical data pipeline for hospital pathology departments (modeled after *K. J. Somaiya Hospital & Research Center*). It ensures that every urinalysis test is strictly associated with a verified patient record, automatically classifies multi-condition risks (such as Acute Bacterial UTI, Glomerular Nephropathy, and Diabetic Ketoacidosis), prevents data tampering via SHA-256 cryptographic integrity hashes, and facilitates interoperability through simulated HL7/FHIR v4 transmissions to hospital Health Information Systems (HIS).

---

### Scenario

A lab technician or pathologist interacts with UrineScan from a workstation or tablet connected to the hospital network. When the technician logs a patient's clinical presentation on the frontend, the intake data is transmitted via a `POST /api/triage/submit` request to the backend. The server evaluates patient symptoms, duration, vitals, and clinical notes through a rule-based heuristic classification pipeline, records a persistent `Triage` document in MongoDB, and returns predicted diagnostic tags and recommended test profiles.

When the technician initiates strip analysis, they can either select a calibrated benchmark or upload an actual photograph of a 10-pad test strip captured via mobile or scanner. A multipart `POST /api/reports/analyze-strip` request uploads the image buffer to the server. The backend's **Colorimetry Vision Engine (built on Jimp)** identifies the strip geometry, isolates the 10 individual reagent pad zones along the primary axis, and calculates the true average RGB and Hex color values of each pad's center region of interest. The engine then computes perception-weighted Euclidean color distances against Multistix 10-SG calibration reference tiers to determine continuous numerical concentrations for all 10 analytes: **Glucose, Protein, Bilirubin, Urobilinogen, pH, Specific Gravity, Blood, Ketones, Nitrite, and Leucocytes**.

Concurrently, the **Clinical Decision Support Engine** cross-correlates the 10 extracted analytes with the patient's triage symptoms, calculating specialized risk scores (UTI Likelihood Score, Renal Glomerular Strain Score, and Diabetic Ketoacidosis Risk Index), alongside automated pathophysiological findings and physician guidance.

To ensure compliance with clinical audit standards, the backend generates a SHA-256 cryptographic signature of the report contents and constructs a high-contrast **QR Code** that embeds a LAN-accessible URL (`http://<LAN-IP>:5000/verify/:reportId`). The complete diagnostic report is atomically saved to MongoDB, linking back to the registered `Patient` document. The technician can instantly stream live telemetry via Server-Sent Events, download a hospital-letterhead PDF report generated dynamically via `pdfkit`, or trigger a simulated encrypted HL7/FHIR transmission to the hospital HIS. Any smartphone camera scanning the QR code on the screen or paper opens a mobile verification certificate proving the record's authenticity against live MongoDB records.

---

### Functional Requirements

#### 1. Urinalysis Report & Clinical Intelligence Service (`/api/reports`)

| Requirement Category | Implementation Specification |
| :--- | :--- |
| **Architecture / Module Design** | Implemented in `controllers/reportController.js` and mounted on `routes/reportRoutes.js`. Handles complete report lifecycle, cryptographic hashing, QR synthesis, and clinical risk evaluation. |
| **REST Endpoints & Methods** | • `GET /api/reports`: Paginated list of reports with query filtering by `status` (`Normal`, `Warning`, `Abnormal`) and text `search` (matches patient name, patient ID, report ID).<br>• `GET /api/reports/:id`: Retrieves a single report by `reportId` or MongoDB `_id`, auto-generating QR code if missing.<br>• `POST /api/reports`: Persists a newly generated urinalysis report, evaluates clinical risk indices, hashes payload, and links to `Patient`.<br>• `DELETE /api/reports/:id`: Deletes a test record from MongoDB.<br>• `DELETE /api/reports/clear-all`: Clears all reports for dashboard reset. |
| **Mongoose Schema & Models** | Built upon `models/Report.js`: contains `reportId` (unique index), `patient` (ObjectId ref to `Patient`), `patientId`, `patientName`, `patientAge`, `patientGender`, `facility`, `requestedBy`, `date`, `time`, `status`, `clinicalNote`, `analytes` (strict 10-item sub-schema with exact values, units, reference intervals, flags, and hex colors), `clinicalRisk`, `verificationHash`, `qrCodeDataUrl`, and `hisSync`. |
| **Clinical Decision Support (AI Co-Pilot)** | Embedded in `utils/clinicalRuleEngine.js`: evaluates multi-analyte cross-interactions + patient symptoms.<br>• **UTI Probability (0–100%)**: Evaluates Nitrite (+) [40 pts], Leukocytes abnormal [35 pts], Hematuria [10 pts], alkaline pH > 7.4 [10 pts], plus Dysuria, Urgency, Cloudy urine, and Fever symptoms.<br>• **Renal Glomerular Strain (0–100%)**: Evaluates Proteinuria [50 pts], high Specific Gravity ≥ 1.028 [15 pts], Blood [20 pts], and Flank/Back pain.<br>• **DKA Risk (0–100%)**: Evaluates Glycosuria > 100 mg/dL [50 pts], Ketonuria > 15 mg/dL [40 pts], and Polyuria/Thirst.<br>• Auto-generates pathophysiological findings and physician guidance (e.g. urine culture & empirical antibiotic sensitivity recommendations). |
| **Security & Verification** | Generates a 256-bit cryptographic digest using Node.js `crypto.createHash('sha256')` across `{ reportId, patientId, analytes, date }`. Generates high-contrast QR code data URLs via `qrcode` embedding direct LAN mobile verification routes. |
| **Official PDF Generation** | `GET /api/reports/:id/pdf` pipes a dynamic `pdfkit` stream with hospital branding (*K. J. Somaiya Hospital & Research Center*), patient metadata, styled 10-analyte results table, risk dials, QR verification code, and pathologist digital signature lines. |
| **Hospital HIS Integration** | `POST /api/reports/:id/send-his` simulates encrypted HL7-FHIR-v4 communication, generating an auditable transaction ID (`HL7-TX-...`) and persisting transmission timestamps into MongoDB. |
| **Error Handling & Status Codes** | Returns standard HTTP status codes: `200 OK` on success, `201 Created` on new report creation, `400 Bad Request` on invalid payload / schema violation, `404 Not Found` for missing IDs, and `500 Internal Server Error` with JSON error payloads. |

---

#### 2. True-Vision Colorimetric Strip Processing (`/api/reports/analyze-strip`)

| Requirement Category | Implementation Specification |
| :--- | :--- |
| **Architecture / Module Design** | Implemented in `utils/colorimetryEngine.js` and exposed via `POST /api/reports/analyze-strip`. Replaces client-side timer simulation with real image pixel sampling. |
| **Image Ingestion & Uploads** | Uses `multer` disk storage to accept test strip images (JPEG, PNG, WebP up to 10MB) stored in `/uploads/`, or parses base64-encoded image payloads from camera snaps. |
| **Computer Vision Segmentation** | Loads image into memory via `Jimp.read()`. Evaluates aspect ratio to determine vertical vs. horizontal orientation. Slices strip geometry into 10 equidistant pad regions along the longitudinal axis with 50% center Region of Interest (ROI) margin cropping. |
| **Pixel Sampling & Color Extraction** | Iterates through center ROI pixels, accumulating Red, Green, and Blue channels to derive the true mathematical mean RGB vector `[avgR, avgG, avgB]`. Converts values to CSS hex strings (`#rrggbb`). |
| **Calibration Tier Matching** | Compares extracted RGB against pre-calibrated diagnostic color tables (Bayer/Multistix 10-SG specifications) using weighted Euclidean color distance: `sqrt(2*ΔR² + 4*ΔG² + 3*ΔB²)`. Maps each pad to its closest physiological concentration tier (exact value, unit, reference interval, and clinical flag). |
| **Live Telemetry Stream (SSE)** | `GET /api/reports/stream-telemetry` establishes an open HTTP `text/event-stream` (Server-Sent Events) connection that transmits real-time instrument calibration packets, ROI segment progress, and regression logs directly to the frontend terminal. |
| **Return Payload** | Returns `{ success: true, status, analytes: [...], boundingBoxes: [...], logs: [...], clinicalRisk: {...} }` containing extracted bounding boxes so the UI can draw live alignment overlays. |

---

#### 3. Patient History, Aggregations & Public Verification (`/api/patients`, `/api/analytics`, `/verify`)

| Requirement Category | Implementation Specification |
| :--- | :--- |
| **Architecture / Module Design** | Modularized across `controllers/patientController.js`, `controllers/analyticsController.js`, and `controllers/verifyController.js`. |
| **REST Endpoints & Methods** | • `GET /api/patients`: Lists all patients with aggregated report counts and latest screening status.<br>• `GET /api/patients/:id`: Retrieves full patient profile, chronological test history, and time-series arrays for chart rendering.<br>• `POST /api/patients`: Registers or updates patient demographics.<br>• `GET /api/analytics/dashboard`: Computes real-time dashboard KPIs.<br>• `GET /verify/:id`: Public mobile verification web portal. |
| **MongoDB Aggregation Pipelines** | Uses `$group` and `$sum` aggregation stages on `Report` collection to compute total tests, normal scans, flagged scans, and testing volume distributions in a single atomic database query. |
| **Longitudinal Time-Series Analytics** | Formats historical analyte data (chronological arrays of numerical Glucose, Protein, pH, and Leucocytes) consumed directly by frontend Recharts line graphs on the Patient page. |
| **Public Mobile Verification Portal** | Accessible by any smartphone connected to the hospital WiFi via `http://<LAN-IP>:5000/verify/:reportId`. Returns a mobile-optimized responsive HTML verification badge displaying authentic hospital credentials, patient details, 10-pad panel, risk scores, and the SHA-256 audit hash. |
| **Relational Data Integrity** | Employs Mongoose schema references (`patient: { type: ObjectId, ref: 'Patient' }`) and synchronized `patientId` string indices to guarantee relational consistency between clinical records and patient profiles. |

---

### Output & Verification Evidence

#### Fig. 1 — Backend Startup, LAN Discovery & MongoDB Auto-Seeding
```text
[DATABASE] Connecting to MongoDB at mongodb://127.0.0.1:27017/urinescan_db
[DATABASE] Connected to MongoDB successfully!
[SEED] Seeding 3 authentic hospital reports into MongoDB...
[SEED] Initial database records seeded successfully with verified QR codes!
====================================================
🚀 UrineScan Clinical Diagnostic Server is RUNNING!
📡 Local API:          http://localhost:5000
📱 LAN Verification:   http://172.17.18.70:5000/verify/:id
💻 Frontend Client:    http://localhost:5173
🏥 Facility:           K. J. Somaiya Hospital Diagnostic Core
====================================================
```
*Fig. 1 — Terminal output demonstrating Express initialization, active MongoDB v8.0.9 connection, automatic database seeding, and LAN IP network discovery.*

---

#### Fig. 2 — End-to-End API Test: Report Creation with AI Risk Scoring
```json
{
  "success": true,
  "report": {
    "reportId": "KJS-3993",
    "patientId": "P-9999",
    "patientName": "Siddharth Verma",
    "patientAge": "34 yrs",
    "patientGender": "Male",
    "status": "Abnormal",
    "clinicalRisk": {
      "utiScore": 95,
      "utiRiskLevel": "High",
      "renalRiskScore": 45,
      "renalRiskLevel": "Moderate",
      "dkaScore": 0,
      "dkaRiskLevel": "Low",
      "findings": [
        "Bacterial nitrate-reductase activity confirmed (Positive Nitrite).",
        "Significant pyuria / leukocyturia (>25 Leu/μL) indicates active immune response.",
        "Microscopic hematuria co-present, consistent with urothelial inflammation.",
        "Alkaline urine pH (>7.4) characteristic of urease-producing bacterial flora."
      ],
      "recommendations": [
        "Immediate midstream urine culture (U/C) & antibiotic sensitivity test advised.",
        "Consider first-line empirical antibiotic regimen (Nitrofurantoin 100mg BID or Fosfomycin 3g PO)."
      ]
    },
    "verificationHash": "57b3ef1d2347cb028a05e26ecf130b06b9b478d179667794354c03d27453eb26",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "deviceModel": "UrineScan Software Colorimetry Engine v2.4"
  }
}
```
*Fig. 2 — Automated REST API payload showing multi-condition clinical risk evaluation (UTI Score 95% High), SHA-256 cryptographic verification hash, and dynamic QR generation.*

---

#### Fig. 3 — Official Hospital Lab Report PDF & Mobile Verification Portal

```
┌────────────────────────────────────────────────────────────────────────┐
│               K. J. SOMAIYA HOSPITAL & RESEARCH CENTER                 │
│         DEPARTMENT OF PATHOLOGY & POINT-OF-CARE DIAGNOSTICS            │
├────────────────────────────────────────────────────────────────────────┤
│ Patient: Siddharth Verma (P-9999)     │ Report ID: KJS-3993            │
│ Age/Gender: 34 yrs / Male             │ Captured: 19 Oct 2026 03:35 PM │
│ Ordering: Dr. A. Sharma (Pathology)   │ Status: ABNORMAL URINALYSIS    │
├────────────────────────────────────────────────────────────────────────┤
│ ANALYTE PARAMETER   MEASURED VALUE     REFERENCE INTERVAL    STATUS    │
│ Glucose             18.4 mg/dL         < 30 mg/dL            NORMAL    │
│ Protein             32.0 mg/dL         < 15 mg/dL            WARNING   │
│ Bilirubin           0.12 mg/dL         Negative (< 0.2)      NORMAL    │
│ Urobilinogen        0.45 mg/dL         < 1.0 mg/dL           NORMAL    │
│ pH Level            7.80 pH            5.0 – 8.0             NORMAL    │
│ Specific Gravity    1.018              1.005 – 1.030         NORMAL    │
│ Blood               25.0 Ery/μL        Negative (< 5)        ABNORMAL  │
│ Ketones             1.2 mg/dL          Negative (< 5)        NORMAL    │
│ Nitrite             Positive           Negative              ABNORMAL  │
│ Leucocytes          110.0 Leu/μL       Negative (< 25)       ABNORMAL  │
├────────────────────────────────────────────────────────────────────────┤
│ CLINICAL RISK INDICES:                                                 │
│ • UTI Likelihood: 95% (High Risk)      • Renal Strain: 45% (Moderate)  │
│ • Physician Guidance: Immediate midstream urine culture (U/C) advised. │
├────────────────────────────────────────────────────────────────────────┤
│ [ QR CODE ]   DIGITALLY CERTIFIED BY URINESCAN ENGINE v2.4             │
│               Scan with any smartphone camera for live verification.   │
│               SHA-256: 57b3ef1d2347cb028a05e26ecf130b06b9b478d1...     │
│                                                                        │
│                                     Dr. A. Sharma, M.D. (Pathologist)  │
└────────────────────────────────────────────────────────────────────────┘
```
*Fig. 3 — High-resolution official hospital laboratory report layout generated on demand via `/api/reports/:id/pdf` with embedded smartphone QR verification and cryptographic seal.*
