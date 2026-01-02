// Role-based module and capability mapping for mobile app

export function getModulesForRole(role: string): string[] {
  const executiveRoles = ['SUPER_ADMIN', 'CEO', 'CFO'];
  const managementRoles = ['DEPARTMENT_HEAD', 'OPERATIONS_MANAGER', 'IT_MANAGER', 'HR_MANAGER'];
  
  const baseModules = ['notifications', 'tasks'];
  const workModules = ['approvals'];
  const coreModules = ['inventory', 'safety', 'employees', 'leave', 'expenses', 'projects', 'documents'];
  const procurementModules = ['procurement', 'requisitions', 'receiving'];
  const fleetModules = ['fleet'];
  const financeModules = ['finance'];
  
  if (executiveRoles.includes(role)) {
    return [...baseModules, ...workModules, ...coreModules, ...procurementModules, ...fleetModules, ...financeModules];
  }
  
  if (managementRoles.includes(role)) {
    return [...baseModules, ...workModules, ...coreModules, ...procurementModules, ...fleetModules];
  }
  
  switch (role) {
    case 'PROCUREMENT_OFFICER':
      return [...baseModules, ...workModules, 'inventory', 'documents', ...procurementModules];
    
    case 'WAREHOUSE_MANAGER':
      return [...baseModules, 'inventory', 'safety', 'documents', 'receiving', 'requisitions'];
    
    case 'ACCOUNTANT':
      return [...baseModules, ...workModules, 'expenses', 'documents', ...financeModules];
    
    case 'SAFETY_OFFICER':
      return [...baseModules, 'safety', 'employees', 'documents', 'tasks'];
    
    case 'EMPLOYEE':
      return [...baseModules, 'safety', 'employees', 'leave', 'expenses', 'documents', 'tasks'];
    
    default:
      return baseModules;
  }
}

export function getCapabilitiesForRole(role: string): Record<string, boolean> {
  const executiveRoles = ['SUPER_ADMIN', 'CEO', 'CFO'];
  const managementRoles = ['DEPARTMENT_HEAD', 'OPERATIONS_MANAGER', 'IT_MANAGER', 'HR_MANAGER'];
  const approverRoles = [...executiveRoles, ...managementRoles, 'PROCUREMENT_OFFICER', 'ACCOUNTANT'];
  
  return {
    // Approvals
    canViewApprovals: approverRoles.includes(role),
    canApprove: approverRoles.includes(role),
    canReject: approverRoles.includes(role),
    
    // Tasks
    canViewTasks: true,
    canUpdateTasks: true,
    canCreateTasks: managementRoles.includes(role) || executiveRoles.includes(role),
    
    // Inventory & Receiving
    canViewInventory: role !== 'VENDOR',
    canReceiveStock: ['WAREHOUSE_MANAGER', 'PROCUREMENT_OFFICER', ...managementRoles, ...executiveRoles].includes(role),
    canAdjustStock: ['WAREHOUSE_MANAGER', ...executiveRoles].includes(role),
    
    // Safety
    canCreateIncident: true,
    canViewAllIncidents: ['SAFETY_OFFICER', ...managementRoles, ...executiveRoles].includes(role),
    canCreateInspection: ['SAFETY_OFFICER', ...managementRoles, ...executiveRoles].includes(role),
    
    // Fleet
    canCreateFleetInspection: ['OPERATIONS_MANAGER', ...executiveRoles].includes(role),
    canLogFuel: ['OPERATIONS_MANAGER', 'EMPLOYEE', ...executiveRoles].includes(role),
    canReportBreakdown: true,
    
    // Procurement
    canCreateRequisition: role !== 'VENDOR',
    canViewAllRequisitions: ['PROCUREMENT_OFFICER', 'WAREHOUSE_MANAGER', ...managementRoles, ...executiveRoles].includes(role),
    
    // Documents
    canUploadDocuments: true,
    canShareDocuments: [...managementRoles, ...executiveRoles].includes(role),
    
    // HR
    canViewAllEmployees: ['HR_MANAGER', ...managementRoles, ...executiveRoles].includes(role),
    canApproveLeave: [...managementRoles, ...executiveRoles, 'HR_MANAGER'].includes(role),
    
    // Expenses
    canApproveExpenses: [...managementRoles, ...executiveRoles, 'ACCOUNTANT'].includes(role),
  };
}
