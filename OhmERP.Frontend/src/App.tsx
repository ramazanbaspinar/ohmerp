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
const CategorySettings = React.lazy(() => import('./pages/CategorySettings'));
const NumaratorYonetimi = React.lazy(() => import('./pages/NumaratorYonetimi'));
const WorkCenters = React.lazy(() => import('./pages/WorkCenters'));
const BOMs = React.lazy(() => import('./pages/BOMs'));
const CostSimulation = React.lazy(() => import('./pages/CostSimulation'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TelTanimlari = React.lazy(() => import('./pages/TelTanimlari'));
const SacTanimlari = React.lazy(() => import('./pages/SacTanimlari'));
const PimTanimlari = React.lazy(() => import('./pages/PimTanimlari'));
const KumTanimlari = React.lazy(() => import('./pages/KumTanimlari'));
const KaynakGaziTanimlari = React.lazy(() => import('./pages/KaynakGaziTanimlari'));
const TapaTanimlari = React.lazy(() => import('./pages/TapaTanimlari'));
const FlansTanimlari = React.lazy(() => import('./pages/FlansTanimlari'));
const KelepceTanimlari = React.lazy(() => import('./pages/KelepceTanimlari'));
const SoketTanimlari = React.lazy(() => import('./pages/SoketTanimlari'));
const OmegaTanimlari = React.lazy(() => import('./pages/OmegaTanimlari'));
const BaglantiSaciTanimlari = React.lazy(() => import('./pages/BaglantiSaciTanimlari'));
const BaglantiTeliTanimlari = React.lazy(() => import('./pages/BaglantiTeliTanimlari'));
const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
    <Spin size="large" tip="Sistem Modülü Yükleniyor...">
      <div style={{ padding: '24px' }} />
    </Spin>
  </div>
);

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />

              <Route element={<ProtectedRoute requiredPermission="Permissions.Companies.View" />}>
                <Route path="/cari-kartlar" element={<CariKartlar />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.Items.View" />}>
                <Route path="/malzeme-kartlari" element={<MalzemeKartlari />} />
                <Route path="/tanimlar/tel-tanimlari" element={<TelTanimlari />} />
                <Route path="/tanimlar/sac-tanimlari" element={<SacTanimlari />} />
                <Route path="/tanimlar/pim-tanimlari" element={<PimTanimlari />} />
                <Route path="/tanimlar/kum-tanimlari" element={<KumTanimlari />} />
                <Route path="/tanimlar/kaynak-gazi-tanimlari" element={<KaynakGaziTanimlari />} />
                <Route path="/tanimlar/tapa-tanimlari" element={<TapaTanimlari />} />
                <Route path="/tanimlar/flans-tanimlari" element={<FlansTanimlari />} />
                <Route path="/tanimlar/kelepce-tanimlari" element={<KelepceTanimlari />} />
                <Route path="/tanimlar/soket-tanimlari" element={<SoketTanimlari />} />
                <Route path="/tanimlar/omega-tanimlari" element={<OmegaTanimlari />} />
                <Route path="/tanimlar/baglanti-saci-tanimlari" element={<BaglantiSaciTanimlari />} />
                <Route path="/tanimlar/baglanti-teli-tanimlari" element={<BaglantiTeliTanimlari />} />
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
                <Route path="/kategori-ayarlari" element={<CategorySettings />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="Permissions.AuditLogs.View" />}>
                <Route path="/loglar" element={<SistemLoglari />} />
              </Route>

              {/* Numarator Yonetimi (Admin Only normally, assuming high permission) */}
              <Route element={<ProtectedRoute requiredPermission="Permissions.Roles.View" />}>
                <Route path="/numarator-yonetimi" element={<NumaratorYonetimi />} />
              </Route>

              <Route path="/is-merkezleri" element={<WorkCenters />} />
              <Route path="/urun-receteleri" element={<BOMs />} />
              <Route path="/maliyet-simulatoru" element={<CostSimulation />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;