# Janta Darbar - 3-Tier Grievance System Implementation Guide

## 🎯 System Overview

**Three-Role Workflow:**
1. **Citizen** - Person with complaint (visits admin office)
2. **Admin** - Politician's office staff (processes complaint, uses OCR, assigns to officer)
3. **Officer** - Department staff (receives assignment, resolves issue)

**Data Flow:**
```
Citizen → Admin Office → [OCR Processing] → Admin Creates Record →
Assigns to Officer → Officer Updates → Citizen Notified
```

---

## ✅ Completed Implementation

### 1. Database Schema ✅
- **Added `role` to `users` table**: 'citizen', 'admin', 'officer'
- **Added to `grievances` table**:
  - `ocr_processed` - Flag for OCR completion
  - `ocr_data` - JSON with extracted data
  - `raw_file_url` - Original uploaded file
- **Status Flow**: NEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

### 2. OCR Service with Google Gemini ✅
**File**: `server/services/ocrService.js`

**Features:**
- Processes images (JPEG, PNG) and PDFs
- Uses Google Gemini 1.5 Flash AI
- Extracts in Marathi/Hindi/English:
  - Summary & Description
  - Category (water, road, electricity, etc.)
  - Severity (low, medium, high, critical)
  - Location & Pincode
  - Citizen details (name, phone)
  - Suggested Department

**Example Output:**
```json
{
  "summary": "पाण्याचा पुरवठा बंद",
  "description": "गेल्या 3 दिवसांपासून पाणी येत नाही",
  "category": "water",
  "severity": "high",
  "location": "Pune, Maharashtra",
  "pincode": "411001",
  "citizen_name": "राजेश पाटील",
  "phone": "+919876543210",
  "suggested_department": "Water Resources"
}
```

### 3. Upload Endpoint ✅
**File**: `server/routes/upload.js`

**New Endpoint**: `POST /api/upload/ocr-grievance`
- No authentication (public)
- Accepts: JPEG, PNG, PDF (max 10MB)
- Returns: File URL + OCR extracted data
- Saves files to `server/uploads/public/`

### 4. Authentication System ✅
**File**: `server/middleware/auth.js`

**Updated Features:**
- Returns user `role` in JWT
- Role-based middleware:
  - `requireAdmin` - Admin only
  - `requireOfficer` - Officer + Admin
  - `requireCitizen` - All roles

**Test Users Created:**
```
Admin:   +919999999999  (role: admin)
Citizens: Various test users (role: citizen)
```

### 5. Auth Routes Updated ✅
**File**: `server/routes/auth.js`

- Login/OTP verification now includes `role` in response
- New users default to `citizen` role

---

## 📋 Pending Implementation

### 1. Admin Dashboard (Frontend)
**What's Needed:**
- View all grievances (with filters):
  - NEW (not yet assigned)
  - ASSIGNED (to officers)
  - In Progress
  - Resolved
- Assign grievance to department/officer
- View OCR results and edit if needed
- Dashboard showing statistics

### 2. Officer Dashboard (Frontend)
**What's Needed:**
- View assigned grievances only
- Update grievance status
- Add notes/progress updates
- Mark as resolved

### 3. Public Submission Form (Frontend)
**What's Needed:**
- File upload (image/PDF)
- OR Text input
- Show OCR results for review
- Admin confirms and assigns

### 4. Notification System (Backend)
**What's Needed:**
- WhatsApp notifications via Interakt API
- Email notifications
- Notify on:
  - Citizen: Complaint assigned, Status updates, Resolved
  - Officer: New assignment
  - Admin: Officer updates

### 5. Enhanced Grievance Routes (Backend)
**What's Needed:**
- `/api/grievances/pending` - For admin (unassigned)
- `/api/grievances/my-assignments` - For officers
- `/api/grievances/:id/assign` - Assign to officer
- `/api/grievances/:id/update-progress` - Officer updates

---

## 🚀 Setup Instructions

### Step 1: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Get API Key"**
4. Copy the API key

### Step 2: Configure Environment

```bash
cd /Users/papapudge/Documents/Real\ Projects/janta-darbar/server
nano .env
```

Update this line with your actual key:
```env
GOOGLE_GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### Step 3: Install Dependencies

```bash
# Google Gemini SDK already installed
cd server
npm install

cd ../client
npm install
```

### Step 4: Restart Server

```bash
# Kill existing process
pkill -f "node.*server"

# Start server
cd /Users/papapudge/Documents/Real\ Projects/janta-darbar/server
npm start
```

Server should be running on: `http://localhost:5001`

### Step 5: Test OCR Endpoint

Create a test image with Marathi/Hindi text about a complaint, then:

```bash
curl -X POST http://localhost:5001/api/upload/ocr-grievance \
  -F "file=@/path/to/complaint.jpg"
```

Expected response:
```json
{
  "message": "File uploaded and processed successfully",
  "file_url": "/uploads/public/abc123.jpg",
  "ocr_data": {
    "summary": "Extracted summary",
    "category": "water",
    "severity": "high",
    ...
  }
}
```

---

## 🔐 User Roles & Access

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Citizen** | View own complaints | Admin/Officer dashboards |
| **Admin** | All grievances, Assign to officers | N/A (full access) |
| **Officer** | Assigned grievances only | Other officer's assignments |

---

## 📊 Status Flow

```
NEW
  ↓ (Admin assigns)
ASSIGNED
  ↓ (Officer starts work)
IN_PROGRESS
  ↓ (Officer resolves)
RESOLVED
  ↓ (Admin closes)
CLOSED
```

Alternative path: **REJECTED** (if complaint invalid)

---

## 🛠️ Next Steps for Full Implementation

1. **Immediate**:
   - Get Gemini API key
   - Test OCR endpoint
   - Verify role-based auth works

2. **Frontend Development**:
   - Admin Dashboard component
   - Officer Dashboard component
   - File upload component with OCR preview

3. **Backend Enhancements**:
   - Role-specific endpoints
   - Notification service
   - Assignment logic

4. **Testing**:
   - Test complete flow end-to-end
   - Test notifications
   - Load testing with real Marathi/Hindi documents

---

## 📞 Communication Channels

All three roles receive notifications via:
- **WhatsApp** (Primary) - via Interakt API
- **Email** (Secondary) - via Postmark

**Notification Triggers:**
| Event | Citizen | Admin | Officer |
|-------|---------|-------|---------|
| Complaint Created | ✓ | ✓ | - |
| Assigned to Officer | ✓ | - | ✓ |
| Status Updated | ✓ | ✓ | - |
| Resolved | ✓ | ✓ | - |

---

## 📝 Sample Data Created

**Admin User:**
- Phone: `+919999999999`
- Name: "Admin - Shambhuraje Office"
- Role: admin

**Test Grievances:** 10 sample grievances with various statuses

**Departments:** 27 departments already in database

---

## 🎨 UI/UX Considerations

**Admin View:**
- Tabs: Pending | Assigned | In Progress | Resolved | All
- Bulk assignment capability
- OCR results editable before assignment

**Officer View:**
- My Assignments only
- Quick status update buttons
- Add photos/notes for resolution

**Citizen View:**
- Track complaint status
- View timeline of updates
- Contact officer/admin

---

Would you like me to:
1. Continue implementing the Admin Dashboard next?
2. Continue implementing Officer Dashboard?
3. Build the file upload component with OCR?

Let me know which part to focus on next!
