import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, theme, Input } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined,
  UserOutlined, LogoutOutlined, TeamOutlined, SafetyCertificateOutlined,
  GlobalOutlined, FileSearchOutlined, BankOutlined,
  AppstoreAddOutlined, DatabaseOutlined, TagsOutlined, SearchOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const { Header, Sider, Content } = Layout;

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

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState<string>('Kullanıcı');
  const [menuSearchText, setMenuSearchText] = useState('');
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();
  
  const { hasPermission } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = parseJwt(token);
      if (decodedToken) {
        const nameClaim = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.unique_name || decodedToken.name;
        if (nameClaim) {
          setUserName(nameClaim);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await api.get('/ItemCategory?pageSize=1000');
        if (response.data && response.data.items) {
           setDynamicCategories(response.data.items.filter((x: any) => x.isActive && x.showInMenu));
        }
      } catch (e) {
      }
    };
    fetchCats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profilim' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Sistemden Çıkış', onClick: handleLogout, danger: true }
    ]
  };

  const baseMenuItems = [
    {
      key: '/',
      icon: <AppstoreAddOutlined />, // Wait, maybe a different icon like DashboardOutlined
      label: 'Ana Sayfa'
    },
    hasPermission('Permissions.Companies.View') ? { 
      key: '/cari-kartlar', 
      icon: <BankOutlined />, 
      label: 'Cari Hesaplar' 
    } : null,
    
    (hasPermission('Permissions.Items.View') || hasPermission('Permissions.ItemCategories.View') || hasPermission('Permissions.UnitOfMeasures.View')) ? {
      key: 'stok_yonetimi', 
      icon: <AppstoreAddOutlined />, 
      label: 'Tanımlar',
      children: [
        {
          key: 'hammadde_tanimlari_yeni',
          icon: <AppstoreAddOutlined />,
          label: 'Hammadde Tanımları',
          children: [
            { key: '/tanimlar/tel-tanimlari', icon: <AppstoreAddOutlined />, label: 'Tel Tanımları' },
            { key: '/tanimlar/sac-tanimlari', icon: <AppstoreAddOutlined />, label: 'Sac Tanımları' }
          ]
        },
        hasPermission('Permissions.Items.View') ? { key: '/malzeme-kartlari', icon: <AppstoreAddOutlined />, label: 'Hammadde ve Malzemeler' } : null,
        hasPermission('Permissions.UnitOfMeasures.View') ? { key: '/birim-tanimlari', icon: <DatabaseOutlined />, label: 'Ölçü Birimleri' } : null,
      ].filter(Boolean)
    } : null,

    {
      key: 'uretim_yonetimi',
      icon: <SettingOutlined />,
      label: 'Üretim Yönetimi',
      children: [
        { key: '/urun-receteleri', icon: <AppstoreAddOutlined />, label: 'Ürün Reçeteleri (BOM)' },
        { key: '/is-merkezleri', icon: <AppstoreAddOutlined />, label: 'İş Merkezleri (Makineler)' }
      ]
    },

    {
      key: 'satis_teklifler',
      icon: <AppstoreAddOutlined />,
      label: 'Satış ve Teklifler',
      children: [
        { key: '/maliyet-simulatoru', icon: <AppstoreAddOutlined />, label: 'Maliyet Simülatörü' }
      ]
    },

    (hasPermission('Permissions.Users.View') || hasPermission('Permissions.Roles.View') || hasPermission('Permissions.AuditLogs.View') || hasPermission('Permissions.Cities.View') || hasPermission('Permissions.Districts.View')) ? {
      key: 'sistem', icon: <SettingOutlined />, label: 'Sistem Yönetimi',
      children: [
        hasPermission('Permissions.Users.View') ? { key: '/kullanicilar', icon: <TeamOutlined />, label: 'Sistem Kullanıcıları' } : null,
        hasPermission('Permissions.Roles.View') ? { key: '/roller', icon: <SafetyCertificateOutlined />, label: 'Rol ve Yetkiler' } : null,
        hasPermission('Permissions.Roles.View') ? { key: '/numarator-yonetimi', icon: <SettingOutlined />, label: 'Numaratör Yönetimi' } : null,
        hasPermission('Permissions.AuditLogs.View') ? { key: '/loglar', icon: <FileSearchOutlined />, label: 'Sistem Logları' } : null,
        (hasPermission('Permissions.Cities.View') || hasPermission('Permissions.Districts.View')) ? {
          key: 'lokasyon', icon: <GlobalOutlined />, label: 'Lokasyon Tanımları',
          children: [
            hasPermission('Permissions.Cities.View') ? { key: '/iller', label: 'İl Tanımları' } : null,
            hasPermission('Permissions.Districts.View') ? { key: '/ilceler', label: 'İlçe Tanımları' } : null,
          ].filter(Boolean)
        } : null
      ].filter(Boolean)
    } : null
  ].filter(Boolean); 

  const filterMenuItems = (items: any[], text: string): any[] => {
    if (!text) return items;
    return items.map(item => {
      if (!item) return null;
      if (item.label && item.label.toString().toLocaleLowerCase('tr-TR').includes(text.toLocaleLowerCase('tr-TR'))) {
        return item;
      }
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children, text);
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
      }
      return null;
    }).filter(Boolean);
  };

  const filteredMenuItems = filterMenuItems(baseMenuItems, menuSearchText);

  useEffect(() => {
    if (menuSearchText) {
      const getParentKeys = (items: any[]): string[] => {
        let keys: string[] = [];
        items.forEach(item => {
          if (item && item.children && item.children.length > 0) {
            keys.push(item.key);
            keys = keys.concat(getParentKeys(item.children));
          }
        });
        return keys;
      };
      setOpenKeys(getParentKeys(filteredMenuItems));
    } else {
      setOpenKeys([]);
    }
  }, [menuSearchText]);

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={260}>
        <div style={{ 
          height: 64, margin: '16px 16px 8px 16px', background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 8, display: 'flex', justifyContent: 'center', 
          alignItems: 'center', color: 'white', fontWeight: 700, 
          fontSize: collapsed ? 14 : 22, letterSpacing: 1
        }}>
          {collapsed ? 'ERP' : 'OhmERP'}
        </div>

        {!collapsed && (
          <div style={{ padding: '0 16px 16px' }}>
            <Input
              className="menu-search-input"
              placeholder="Menüde Ara..."
              prefix={<SearchOutlined />}
              value={menuSearchText}
              onChange={(e) => setMenuSearchText(e.target.value)}
              style={{ background: 'rgba(128,128,128,0.2)', border: 'none' }}
              allowClear
            />
          </div>
        )}
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={(e) => navigate(e.key)}
          items={filteredMenuItems as any}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: 0, background: colorBgContainer, display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', 
          paddingRight: 24, boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px', width: 64, height: 64 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', padding: '0 12px', borderRadius: 4 }} className="user-dropdown">
              <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>{userName}</span> 
            </Space>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '24px', padding: 0, minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;