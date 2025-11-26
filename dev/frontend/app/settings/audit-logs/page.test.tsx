import React from 'react';
import { render, screen } from '@testing-library/react';
import AuditLogsPage from './page';

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('AuditLogsPage', () => {
  it('renders the audit logs heading and statistics section', async () => {
    render(<AuditLogsPage />);

    const heading = await screen.findByText(/Audit Logs/i);
    expect(heading).toBeInTheDocument();

    const totalEventsLabel = await screen.findByText('Total Events');
    expect(totalEventsLabel).toBeInTheDocument();
  });
});
