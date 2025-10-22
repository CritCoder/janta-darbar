# 🔐 Test Accounts - Janta Darbar

## Database Reset Complete ✅

All database tables have been cleaned and populated with fresh test data.

---

## 👥 TEST ACCOUNTS BY ROLE

### 🔴 ADMIN ACCOUNT
**Login:** `+919999999999`
**Name:** Ramesh Patil - Admin
**Role:** Admin
**OTP:** Any 6-digit code (dev mode)

**What Admin Can See:**
- Dashboard with ALL grievances
- ⚡ Quick Create page (upload & AI assign)
- All grievances list
- Departments management
- Officers management
- Analytics
- Settings

---

### 🔵 OFFICER ACCOUNTS

#### Officer 1: Public Works Department
**Login:** `+919888888888`
**Name:** Suresh Kumar
**Role:** Officer
**Department:** Public Works Department
**OTP:** Any 6-digit code

**Assigned Grievances:**
- GRV-2025-001: Road potholes (IN_PROGRESS) ✅ Working on it

**What Officer Can See:**
- Dashboard (shows their stats)
- 📋 My Assignments page (ONLY their grievances)
- Grievances (view only)
- Settings

---

#### Officer 2: Water Resources Department
**Login:** `+919777777777`
**Name:** Anjali Deshmukh
**Role:** Officer
**Department:** Water Resources Department
**OTP:** Any 6-digit code

**Assigned Grievances:**
- GRV-2025-002: No water supply (ASSIGNED) 🆕 Not started yet

**What Officer Can See:**
- Dashboard (shows their stats)
- 📋 My Assignments page (ONLY their grievances)
- Grievances (view only)
- Settings

---

### 🟢 CITIZEN ACCOUNTS

#### Citizen 1
**Login:** `+919123456789`
**Name:** Rajesh Sharma
**Role:** Citizen
**OTP:** Any 6-digit code

**Their Grievances:**
- GRV-2025-001: Road potholes - Status: IN_PROGRESS

**What Citizen Can See:**
- Dashboard (shows their own grievances)
- Settings
- Track their complaint status

---

#### Citizen 2
**Login:** `+919234567890`
**Name:** Priya Patel
**Role:** Citizen
**OTP:** Any 6-digit code

**Their Grievances:**
- GRV-2025-002: No water supply - Status: ASSIGNED

**What Citizen Can See:**
- Dashboard (shows their own grievances)
- Settings
- Track their complaint status

---

#### Citizen 3
**Login:** `+919345678901`
**Name:** Amit Joshi
**Role:** Citizen
**OTP:** Any 6-digit code

**Their Grievances:**
- GRV-2025-003: Street lights not working - Status: NEW (not assigned yet)

**What Citizen Can See:**
- Dashboard (shows their own grievances)
- Settings
- Track their complaint status

---

## 📊 GRIEVANCES OVERVIEW

| Ticket ID | Summary | Status | Severity | Citizen | Officer | Department |
|-----------|---------|--------|----------|---------|---------|------------|
| GRV-2025-001 | रस्त्यावर मोठे खड्डे<br>Road potholes | IN_PROGRESS | HIGH | Rajesh Sharma | Suresh Kumar | Public Works |
| GRV-2025-002 | पाण्याचा पुरवठा बंद<br>No water supply | ASSIGNED | CRITICAL | Priya Patel | Anjali Deshmukh | Water Resources |
| GRV-2025-003 | स्ट्रीट लाईट नाही<br>Street lights broken | NEW | MEDIUM | Amit Joshi | - | Not assigned |

---

## 🎯 WHAT EACH USER WILL SEE

### Admin Dashboard
- **Total Grievances:** 3
- **New:** 1 (needs assignment)
- **Assigned:** 1
- **In Progress:** 1
- **See:** ALL 3 grievances
- **Can:** Assign grievance #3 to an officer

### Officer 1 Dashboard (Suresh Kumar)
- **Total Assigned:** 1
- **In Progress:** 1
- **See:** ONLY grievance GRV-2025-001
- **Can:** Mark as resolved when done

### Officer 2 Dashboard (Anjali Deshmukh)
- **Total Assigned:** 1
- **Not Started:** 1
- **See:** ONLY grievance GRV-2025-002
- **Can:** Start work, then mark as resolved

### Citizen 1 Dashboard (Rajesh Sharma)
- **My Grievances:** 1
- **See:** ONLY their own grievance GRV-2025-001
- **Status:** IN_PROGRESS (officer working on it)

### Citizen 2 Dashboard (Priya Patel)
- **My Grievances:** 1
- **See:** ONLY their own grievance GRV-2025-002
- **Status:** ASSIGNED (officer assigned but not started)

### Citizen 3 Dashboard (Amit Joshi)
- **My Grievances:** 1
- **See:** ONLY their own grievance GRV-2025-003
- **Status:** NEW (waiting for admin to assign)

---

## 🚀 HOW TO TEST

### Test Admin Workflow:
1. Login as Admin: `+919999999999`
2. Go to ⚡ Quick Create
3. Upload a complaint document (or enter manually)
4. See AI suggestions
5. One-click assign to officer

### Test Officer Workflow:
1. Login as Officer: `+919888888888` or `+919777777777`
2. Go to 📋 My Assignments
3. See ONLY your assigned grievances
4. Click "Start Work" or "Mark Resolved"

### Test Citizen Workflow:
1. Login as Citizen: `+919123456789` (or other citizen numbers)
2. See your own grievances on dashboard
3. Track status updates

### Test Public API (No Login):
```bash
curl http://localhost:5001/api/grievances/public
```
See all 3 grievances publicly!

---

## 🔄 Role-Based Access Summary

| Feature | Admin | Officer | Citizen |
|---------|-------|---------|---------|
| Dashboard (all grievances) | ✅ | ❌ | ❌ |
| Dashboard (own grievances) | - | ✅ | ✅ |
| Quick Create (AI upload) | ✅ | ❌ | ❌ |
| My Assignments | ✅ | ✅ | ❌ |
| Grievances List | ✅ | ✅ (view only) | ❌ |
| Departments | ✅ | ❌ | ❌ |
| Officers | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ✅ |

---

## 🎨 UI Differences by Role

### Admin Sees:
- ⚡ Quick Create (with NEW badge)
- All management options
- Purple role badge

### Officer Sees:
- 📋 My Assignments
- Limited grievances view
- Blue role badge

### Citizen Sees:
- Basic dashboard
- Their own complaints
- Gray role badge

---

## 📝 Quick Login Reference

```
ADMIN:    +919999999999
OFFICER1: +919888888888  (PWD - has 1 grievance IN_PROGRESS)
OFFICER2: +919777777777  (Water - has 1 grievance ASSIGNED)
CITIZEN1: +919123456789  (has road complaint)
CITIZEN2: +919234567890  (has water complaint)
CITIZEN3: +919345678901  (has electricity complaint)
```

**OTP:** Enter any 6-digit code (e.g., 123456) in development mode

---

## ✅ Verified Working

- ✅ Database cleaned and repopulated
- ✅ 6 users created (1 admin, 2 officers, 3 citizens)
- ✅ 3 departments created
- ✅ 2 officers linked to departments
- ✅ 3 grievances created with different statuses
- ✅ 2 grievances assigned to officers
- ✅ Role-based navigation ready
- ✅ Each user sees different data

---

**Go to:** http://localhost:3000/login
**Try any account above!** 🚀
