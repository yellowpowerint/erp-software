import { getRoleBasedStats } from '../get-role-stats';
import { UserRole } from '@/types/auth';

describe('getRoleBasedStats', () => {
  it('returns role-specific stats for CEO', () => {
    const stats = getRoleBasedStats(UserRole.CEO);

    expect(stats).toHaveLength(4);
    expect(stats[0]).toEqual(
      expect.objectContaining({
        name: 'Pending Approvals',
      }),
    );
  });

  it('falls back to default stats for EMPLOYEE', () => {
    const stats = getRoleBasedStats(UserRole.EMPLOYEE);

    expect(stats).toHaveLength(4);
    expect(stats[0]).toEqual(
      expect.objectContaining({
        name: 'My Tasks',
      }),
    );
  });
});
