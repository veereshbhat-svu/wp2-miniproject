# UrineScan POC Urinalysis Engine — API Routes Documentation

**Hospital & Laboratory System:** K. J. Somaiya Hospital & Research Center  
**Backend Framework:** Node.js / Express (Port 5000)  
**Database:** MongoDB (`urinescan_db`) via Mongoose  
**Base URL:** `http://localhost:5000` (or `http://<LAN_IP>:5000` for mobile network verification)  

---

## 1. Diagnostic Reports (`/api/reports`)

Endpoints for creating, managing, and exporting urinalysis test records.

### `GET /api/reports`
* **Description:** Retrieves all generated urinalysis reports with support for filtering, search, and pagination.
* **Query Parameters:**
  * `status` *(optional)*: Filter by classification (`Normal`, `Warning`, `Abnormal`, or `all`).
  * `search` *(optional)*: Case-insensitive search matching `reportId`, `patientId`, or `patientName`.
  * `page` *(optional, default: 1)*: Page number.
  * `limit` *(optional, default: 50)*: Number of reports per page.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "total": 12,
    "page": 1,
    "reports": [
      {
        "reportId": "KJS-8219",
        "patientId": "P-8219",
        "patientName": "Rahul Sharma",
        "patientAge": "42 yrs",
        "patientGender": "Male",
        "status": "Abnormal",
        "date": "2 Nov 2026",
        "time": "10:30 AM",
        "analytes": [...],
        "clinicalRisk": {...}
      }
    ]
  }
  ```

---

### `POST /api/reports`
* **Description:** Saves a new diagnostic report into MongoDB. Automatically calculates clinical risk scores, generates a SHA-256 integrity hash, creates a verification QR code, and links or registers the patient.
* **Request Body (JSON):**
  ```json
  {
    "patientId": "P-8219",
    "patientName": "Rahul Sharma",
    "patientAge": "42 yrs",
    "patientGender": "Male",
    "facility": "K. J. Somaiya Hospital & Research Center",
    "requestedBy": "Dr. A. Sharma (Pathology)",
    "status": "Abnormal",
    "clinicalNote": "Suspected acute UTI.",
    "analytes": [
      { "name": "Glucose", "exact": "18.4", "unit": "mg/dL", "ref": "< 30 mg/dL", "status": "normal", "hexColor": "#82b932", "padIndex": 0 },
      { "name": "Protein", "exact": "34.8", "unit": "mg/dL", "ref": "< 15 mg/dL", "status": "warning", "hexColor": "#78b969", "padIndex": 1 },
      ...
    ]
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "report": { ... }
  }
  ```

---

### `POST /api/reports/analyze-strip`
* **Description:** Ingests a photograph of a 10-pad urine dipstick. Auto-segments the 10 reagent zones using Jimp/OpenCV, samples RGB/CIELAB color vectors, maps them to calibrated Multistix 10-SG tiers, and runs clinical decision rules.
* **Content-Type:** `multipart/form-data` OR `application/json`
* **Request Options:**
  * Multipart Form Data: File field named `stripImage` (PNG/JPEG).
  * JSON Body: `{ "imageBase64": "data:image/png;base64,...", "triageData": { ... } }`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "Abnormal",
    "analytes": [ ...10 quantified pads... ],
    "boundingBoxes": [ ...coordinates for each pad... ],
    "logs": [ ...processing sequence logs... ],
    "clinicalRisk": {
      "utiScore": 85,
      "utiRiskLevel": "High",
      "renalRiskScore": 25,
      "renalRiskLevel": "Low",
      "findings": [ ... ],
      "recommendations": [ ... ]
    }
  }
  ```

---

### `GET /api/reports/:id`
* **Description:** Retrieves a single report by its Hospital Report ID (e.g., `KJS-8219`) or MongoDB ObjectId.
* **URL Parameters:** `:id` — Report Identifier.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "report": { ... }
  }
  ```

---

### `DELETE /api/reports/:id`
* **Description:** Permanently removes a report from MongoDB.
* **URL Parameters:** `:id` — Report Identifier.
* **Response (200 OK):**
  ```json
  { "success": true, "message": "Report deleted successfully" }
  ```

---

### `DELETE /api/reports/clear-all`
* **Description:** Deletes all report records in the database (used for demo reset).
* **Response (200 OK):**
  ```json
  { "success": true, "message": "All reports cleared" }
  ```

---

### `GET /api/reports/:id/pdf`
* **Description:** Dynamically generates and downloads an official, hospital-branded laboratory report in **PDF** format (built with PDFKit). Includes hospital header, patient demographics, 10-analyte results table, clinical decision findings, and a verified QR code.
* **URL Parameters:** `:id` — Report Identifier.
* **Response:** Binary Stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename=Urinalysis_Report_<id>.pdf`).

---

### `POST /api/reports/:id/send-his`
* **Description:** Simulates an encrypted HL7/FHIR v4 telemetry transmission dispatching the report to the Hospital Information System (HIS).
* **URL Parameters:** `:id` — Report Identifier.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Encrypted report successfully transmitted to K. J. Somaiya Hospital HIS!",
    "hisSync": {
      "transmitted": true,
      "transmittedAt": "2026-11-02T10:00:00.000Z",
      "transactionId": "HL7-TX-1762076400000-4821",
      "protocol": "HL7-FHIR-v4-Encrypted",
      "destination": "K. J. Somaiya Hospital HIS Core (Ward Telemetry)"
    }
  }
  ```

---

### `GET /api/reports/stream-telemetry`
* **Description:** Opens a persistent **Server-Sent Events (SSE)** connection that streams live computer vision segmentation progress (0% to 100%) to connected clients.
* **Headers:** `Content-Type: text/event-stream`

---

## 2. Clinical Triage (`/api/triage`)

Endpoints for patient pre-intake, symptom logging, and heuristic AI classification.

### `GET /api/triage/presets`
* **Description:** Returns selectable clinical symptom tags and pre-configured sample cases (*Acute UTI*, *Diabetic Follow-up*, *Healthy Routine*).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "symptoms": [
      "Dysuria / Burning Micturition",
      "Frequent Urgency",
      "Cloudy / Turbid Urine",
      "Fever & Chills",
      "Flank / Lower Back Pain",
      "Excessive Thirst & Polyuria",
      "Microscopic / Gross Hematuria",
      "Pelvic Discomfort"
    ],
    "triagePresets": [ ...preset patient profiles... ]
  }
  ```

---

### `POST /api/triage/submit`
* **Description:** Ingests patient demographics, vitals, selected symptoms, and clinical notes. Executes keyword-based NLP risk classification to predict the underlying condition and recommend a test scenario.
* **Request Body (JSON):**
  ```json
  {
    "name": "Rahul Sharma",
    "patientId": "P-8219",
    "age": 42,
    "gender": "Male",
    "phone": "9876543210",
    "bloodGroup": "B+",
    "duration": "1-3 days",
    "temp": "100.4",
    "symptoms": ["Dysuria / Burning Micturition", "Frequent Urgency", "Cloudy / Turbid Urine", "Fever & Chills"],
    "notes": "Patient reports severe burning sensation during urination for 2 days."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "triage": { ...saved triage record... },
    "prediction": {
      "condition": "Suspected Acute Urinary Tract Infection (UTI)",
      "suggestedProfile": "uti",
      "riskScore": 88
    }
  }
  ```

---

## 3. Patient Management (`/api/patients`)

Endpoints for patient demographic records and longitudinal medical histories.

### `GET /api/patients`
* **Description:** Lists all registered hospital patients along with their total completed urinalysis count, latest test date, and latest clinical status.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "patients": [
      {
        "patientId": "P-8219",
        "name": "Rahul Sharma",
        "age": 42,
        "gender": "Male",
        "phone": "9876543210",
        "bloodGroup": "B+",
        "reportCount": 3,
        "latestStatus": "Abnormal",
        "latestDate": "2 Nov 2026"
      }
    ]
  }
  ```

---

### `GET /api/patients/:id`
* **Description:** Retrieves single patient details, all past urinalysis lab reports, and formatted chronological **trend data** ready for Recharts line charts (Glucose, Protein, pH, Leucocytes).
* **URL Parameters:** `:id` — Patient Hospital ID (e.g., `P-8219`).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "patient": { ...patient details... },
    "reports": [ ...past reports array... ],
    "trendData": [
      {
        "date": "1 Oct 2026 10:00 AM",
        "glucose": 18.4,
        "protein": 8.2,
        "ph": 6.2,
        "leucocytes": 8.5,
        "testId": "KJS-1024",
        "status": "Normal"
      },
      {
        "date": "2 Nov 2026 10:30 AM",
        "glucose": 22.1,
        "protein": 34.8,
        "ph": 7.85,
        "leucocytes": 128.4,
        "testId": "KJS-8219",
        "status": "Abnormal"
      }
    ]
  }
  ```

---

### `POST /api/patients`
* **Description:** Creates or updates (upserts) a patient demographic record.
* **Request Body (JSON):**
  ```json
  {
    "patientId": "P-8219",
    "name": "Rahul Sharma",
    "age": 42,
    "gender": "Male",
    "phone": "9876543210",
    "bloodGroup": "B+",
    "medicalHistory": ["Type-2 Diabetes", "Recurrent UTIs"]
  }
  ```
* **Response (200 OK):**
  ```json
  { "success": true, "patient": { ... } }
  ```

---

## 4. Dashboard & Analytics (`/api/analytics`)

High-performance real-time analytics using MongoDB Aggregation Pipelines.

### `GET /api/analytics/dashboard`
* **Description:** Computes live key performance indicators (KPIs) and hospital throughput stats for the Dashboard.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "stats": {
      "totalScans": 24,
      "normalScans": 14,
      "warningScans": 4,
      "abnormalScans": 6,
      "flaggedScans": 10,
      "totalPatients": 18
    },
    "timeline": [
      { "time": "08:00", "tests": 0 },
      { "time": "10:00", "tests": 7 },
      { "time": "12:00", "tests": 16 },
      { "time": "14:00", "tests": 24 }
    ],
    "recentReports": [ ...10 most recent tests... ]
  }
  ```

---

## 5. Verification & System Utilities

### `GET /verify/:id`
* **Description:** **Public Mobile QR Verification Portal**. When a physical lab report's QR code is scanned by any smartphone camera, this endpoint renders a secure, authentic mobile card displaying the verified lab results, timestamp, and SHA-256 seal.
* **URL Parameters:** `:id` — Report Identifier (e.g. `KJS-8219`).
* **Format:** Returns authenticated Mobile HTML (or JSON if request header `Accept: application/json` is passed).

---

### `GET /`
* **Description:** API root directory listing service endpoints and hospital details.

---

### `GET /uploads/:filename`
* **Description:** Static file-serving route for uploaded urine test strip images.
