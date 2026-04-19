import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Result, Button } from 'antd';

interface ProtectedRouteProps {
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermission }) => {
  const token = localStorage.getItem('token');
  const { hasPermission } = useAuth(); 

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{ padding: '50px', display: 'flex', justifyContent: 'center' }}>
        <Result
          status="403"
          title="403 - Erişim Reddedildi"
          subTitle="Üzgünüz, bu sayfayı görüntülemek için gerekli sistem yetkilerine sahip değilsiniz."
          extra={<Button type="primary" href="/dashboard">Kontrol Paneline Dön</Button>}
        />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;