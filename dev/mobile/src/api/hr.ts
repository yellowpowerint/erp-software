import { http } from './http';

export function listLeaveRequests() {
  return http.get('/hr/leave-requests');
}

export function listAttendance() {
  return http.get('/hr/attendance');
}

export function listJobPostings() {
  return http.get('/hr/recruitment/jobs');
}

export function listCandidates() {
  return http.get('/hr/recruitment/candidates');
}
