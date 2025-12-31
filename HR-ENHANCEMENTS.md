# HR Module Enhancement Plan

## Current Status
- ✅ Employees page - Has CSV import/export
- ❌ Attendance - Missing CSV
- ❌ Leave Requests - Missing CSV  
- ❌ Performance Reviews - Missing CSV
- ❌ Recruitment pages - Missing CSV

## Pages to Enhance

### 1. Attendance (`/hr/attendance`)
**CSV Columns:** employeeId, date, status, checkIn, checkOut, notes
**Sample:**
```csv
employeeId,date,status,checkIn,checkOut
EMP001,2025-01-15,PRESENT,08:00,17:00
EMP002,2025-01-15,LATE,09:30,17:30
```

### 2. Leave Requests (`/hr/leave-requests`)
**CSV Columns:** employeeId, leaveType, startDate, endDate, reason
**Sample:**
```csv
employeeId,leaveType,startDate,endDate,reason
EMP001,ANNUAL,2025-02-01,2025-02-05,Vacation
EMP002,SICK,2025-01-20,2025-01-22,Medical
```

### 3. Performance Reviews (`/hr/performance`)
**CSV Columns:** employeeId, reviewPeriod, reviewDate, reviewerId, overallRating, technicalSkills, communication
**Sample:**
```csv
employeeId,reviewPeriod,reviewDate,reviewerId,overallRating,technicalSkills
EMP001,Q4 2024,2025-01-10,MGR001,EXCELLENT,5
```

### 4. Recruitment - Job Postings
**CSV Columns:** jobCode, title, department, location, employmentType, experienceLevel
**Sample:**
```csv
jobCode,title,department,location,employmentType,experienceLevel
JOB001,Mining Engineer,Operations,Accra,FULL_TIME,SENIOR
```

## Additional Enhancements

1. **Payroll Module** - Add salary processing, deductions, bonuses
2. **Training & Development** - Track employee training, certifications
3. **Employee Documents** - Store contracts, certifications, IDs
4. **Shift Management** - Schedule shifts, track rotations
5. **Benefits Management** - Health insurance, pension, allowances
6. **Exit Management** - Resignation, termination, exit interviews
7. **Disciplinary Actions** - Warnings, suspensions tracking
8. **Employee Self-Service** - Portal for leave requests, payslips
9. **Org Chart** - Visual hierarchy and reporting structure
10. **HR Analytics** - Turnover rates, hiring metrics, performance trends

## Priority Implementation Order
1. Add CSV to Attendance (High - daily use)
2. Add CSV to Leave Requests (High - frequent use)
3. Add CSV to Performance Reviews (Medium)
4. Add Payroll Module (High - critical)
5. Add Training Module (Medium)
6. Add Employee Self-Service (High - reduces HR workload)


---------

cd /var/www/mining-erp
git pull origin main

# Backend
cd dev/backend
npm ci && npm run build && npx prisma generate
pm2 restart erp-backend

# Frontend  
cd ../frontend
npm ci && npm run build
pm2 restart erp-frontend

pm2 status