import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Login = React.lazy(() => import('./pages/Login'));
const KullaniciYonetimi = React.lazy(() => import('./pages/KullaniciYonetimi'));
const RolYonetimi = React.lazy(() => import('./pages/RolYonetimi'));
const IlYonetimi = React.lazy(() => import('./pages/IlYonetimi'));
const IlceYonetimi = React.lazy(() => import('./pages/IlceYonetimi'));
const SistemLoglari = React.lazy(() => import('./pages/SistemLoglari'));
const CariKartlar = React.lazy(() => import('./pages/CariKartlar'));
const MalzemeKartlari = React.lazy(() => import('./pages/MalzemeKartlari'));
const BirimTanimlari = React.lazy(() => import('./pages/BirimTanimlari'));
const KategoriTanimlari = React.lazy(() => import('./pages/KategoriTanimlari'));
const NumaratorYonetimi = React.lazy(() => import('./pages/NumaratorYonetimi'));

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
    <Spin size="large" tip="Sistem Modülü Yükleniyor..." />
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/kullanicilar" replace />} />

              <Route element={<ProtectedRoute requiredPermission="Permissions.Companies.View" />}>
                <Route path="/cari-kartlar" element={<CariKartlar />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Items.View" />}>
                <Route path="/malzeme-kartlari" element={<MalzemeKartlari />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Users.View" />}>
                <Route path="/kullanicilar" element={<KullaniciYonetimi />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Roles.View" />}>
                <Route path="/roller" element={<RolYonetimi />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Cities.View" />}>
                <Route path="/iller" element={<IlYonetimi />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Districts.View" />}>
                <Route path="/ilceler" element={<IlceYonetimi />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.UnitOfMeasures.View" />}>
                <Route path="/birim-tanimlari" element={<BirimTanimlari />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.ItemCategories.View" />}>
                <Route path="/malzeme-kategorileri" element={<KategoriTanimlari />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.AuditLogs.View" />}>
                <Route path="/loglar" element={<SistemLoglari />} />
              </Route>

              {/* Numarator Yonetimi (Admin Only normally, assuming high permission) */}
              <Route element={<ProtectedRoute requiredPermission="Permissions.Roles.View" />}>
                <Route path="/numarator-yonetimi" element={<NumaratorYonetimi />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/kullanicilar" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;