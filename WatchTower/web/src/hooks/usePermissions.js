import { useSelector } from 'react-redux';

export function usePermissions() {
  const user = useSelector(state => state.auth.user);
  
  const hasPermission = (permissionString) => {
    if (!user || !user.permissions) return false;
    // Ultra super admin has all permissions implicitly
    if (user.role === 'ULTRA_SUPER_ADMIN') return true;
    return user.permissions.includes(permissionString);
  };

  const hasRole = (roleArray) => {
    if (!user || !user.role) return false;
    return roleArray.includes(user.role);
  };

  const hasScopeAccess = (scopeType, idsToCheck = []) => {
    if (!user || !user.scope) return false;
    if (user.scope.type === 'GLOBAL') return true;
    if (user.scope.type !== scopeType) return false;
    
    if (idsToCheck.length > 0) {
       const userIds = user.scope.client_ids || user.scope.site_ids || [];
       return idsToCheck.some(id => userIds.includes(id));
    }
    
    return true;
  };

  return { user, hasPermission, hasRole, hasScopeAccess };
}
