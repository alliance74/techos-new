// Helper function to get the correct route for a role
export function getRoleRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    'ceo': '/ceo',
    'cto': '/cto',
    'ciso': '/ciso',
    'finance': '/finance',
    'software_engineer': '/software-engineer',
    'ui_ux_designer': '/ui-ux-designer',
    'customer_support': '/customer-support',
  };
  
  return roleRoutes[role] || '/login';
}
