import { useState, useEffect } from 'react';

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const useAuth = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        let userPermissions = decoded.Permission || [];
        if (typeof userPermissions === 'string') {
          userPermissions = [userPermissions];
        }
        setPermissions(userPermissions);

        let roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || [];
        if (typeof roles === 'string') roles = [roles];
        
        setIsAdmin(roles.includes('ADMIN'));
      }
    }
  }, []);

  const hasPermission = (permissionCode: string) => {
    return isAdmin || permissions.includes(permissionCode);
  };

  return { hasPermission, isAdmin, permissions };
};