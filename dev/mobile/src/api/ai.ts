import { http } from './http';

export function getDashboardInsights() {
  return http.get('/ai/dashboard-insights');
}

export function getProcurementAdvice() {
  return http.get('/ai/procurement-advisor');
}
