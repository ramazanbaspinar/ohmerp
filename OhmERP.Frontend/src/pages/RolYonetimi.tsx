import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Space, Modal, Form, Input, message, Tag, Popconfirm, Tooltip, Drawer, Switch, Typography, Row, Col, Spin, Collapse, Radio } from 'antd';
import { SafetyCertificateOutlined, PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, ExclamationCircleOutlined, SearchOutlined, KeyOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, turkishToLower } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

const { confirm } = Modal;
const { Text } = Typography;
const { Panel } = Collapse;

interface RoleType {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface Permission {
  code: string;
  name: string;
  isGranted: boolean;
}

interface ModulePermissions {
  moduleName: string;
  permissions: Permission[];
}

const SYSTEM_MODULES: ModulePermissions[] = [
  {
    moduleName: 'Cari Hesap Yönetimi (Müşteri & Tedarikçi)',
    permissions: [
      { code: 'Permissions.Companies.View', name: 'Cari Kartları Görüntüleme', isGranted: false },
      { code: 'Permissions.Companies.Create', name: 'Yeni Cari Kart Oluşturma', isGranted: false },
      { code: 'Permissions.Companies.Edit', name: 'Cari Kart Düzenleme', isGranted: false },
      { code: 'Permissions.Companies.Delete', name: 'Cari Kart Silme (Pasife Alma)', isGranted: false },
    ]
  },
  {
    moduleName: 'Rol ve Yetki Yönetimi',
    permissions: [
      { code: 'Permissions.Roles.View', name: 'Rol ve Yetkileri Görüntüleme', isGranted: false },
      { code: 'Permissions.Roles.Create', name: 'Yeni Rol Ekleme', isGranted: false },
      { code: 'Permissions.Roles.Edit', name: 'Rol Düzenleme', isGranted: false },
      { code: 'Permissions.Roles.Delete', name: 'Rol Silme', isGranted: false },
      { code: 'Permissions.Roles.AssignPermissions', name: 'Yetki Atama (Matris)', isGranted: false },
    ]
  },
  {
    moduleName: 'Sistem Kullanıcıları Yönetimi',
    permissions: [
      { code: 'Permissions.Users.View', name: 'Kullanıcıları Görüntüleme', isGranted: false },
      { code: 'Permissions.Users.Create', name: 'Yeni Personel Ekleme', isGranted: false },
      { code: 'Permissions.Users.Edit', name: 'Personel Bilgilerini Düzenleme', isGranted: false },
      { code: 'Permissions.Users.Delete', name: 'Personeli Pasife Alma', isGranted: false },
    ]
  },
  {
    moduleName: 'Sistem Logları (Audit İzleri)',
    permissions: [
      { code: 'Permissions.AuditLogs.View', name: 'Sistem İşlem Geçmişini Görüntüleme', isGranted: false },
    ]
  },
  {
    moduleName: 'İl (Şehir) Yönetimi',
    permissions: [
      { code: 'Permissions.Cities.View', name: 'İlleri Görüntüleme', isGranted: false },
      { code: 'Permissions.Cities.Create', name: 'Yeni İl Ekleme', isGranted: false },
      { code: 'Permissions.Cities.Edit', name: 'İl Bilgilerini Düzenleme', isGranted: false },
      { code: 'Permissions.Cities.Delete', name: 'İl Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'İlçe Yönetimi',
    permissions: [
      { code: 'Permissions.Districts.View', name: 'İlçeleri Görüntüleme', isGranted: false },
      { code: 'Permissions.Districts.Create', name: 'Yeni İlçe Ekleme', isGranted: false },
      { code: 'Permissions.Districts.Edit', name: 'İlçe Bilgilerini Düzenleme', isGranted: false },
      { code: 'Permissions.Districts.Delete', name: 'İlçe Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Ölçü Birimleri Yönetimi',
    permissions: [
      { code: 'Permissions.Units.View', name: 'Ölçü Birimlerini Görüntüleme', isGranted: false },
      { code: 'Permissions.Units.Create', name: 'Yeni Ölçü Birimi Ekleme', isGranted: false },
      { code: 'Permissions.Units.Edit', name: 'Ölçü Birimi Düzenleme', isGranted: false },
      { code: 'Permissions.Units.Delete', name: 'Ölçü Birimi Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Malzeme Kategorileri Yönetimi',
    permissions: [
      { code: 'Permissions.Categories.View', name: 'Kategorileri Görüntüleme', isGranted: false },
      { code: 'Permissions.Categories.Create', name: 'Yeni Kategori Ekleme', isGranted: false },
      { code: 'Permissions.Categories.Edit', name: 'Kategori Düzenleme', isGranted: false },
      { code: 'Permissions.Categories.Delete', name: 'Kategori Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Malzeme Kartları Yönetimi',
    permissions: [
      { code: 'Permissions.Materials.View', name: 'Malzeme Kartlarını Görüntüleme', isGranted: false },
      { code: 'Permissions.Materials.Create', name: 'Yeni Malzeme Kartı Ekleme', isGranted: false },
      { code: 'Permissions.Materials.Edit', name: 'Malzeme Kartı Düzenleme', isGranted: false },
      { code: 'Permissions.Materials.Delete', name: 'Malzeme Kartı Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Bağlantı Sacı Tanımları',
    permissions: [
      { code: 'Permissions.BaglantiSaci.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.BaglantiSaci.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.BaglantiSaci.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.BaglantiSaci.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Bağlantı Teli Tanımları',
    permissions: [
      { code: 'Permissions.BaglantiTeli.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.BaglantiTeli.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.BaglantiTeli.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.BaglantiTeli.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Flanş Tanımları',
    permissions: [
      { code: 'Permissions.Flans.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Flans.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Flans.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Flans.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Kaynak Gazı Tanımları',
    permissions: [
      { code: 'Permissions.KaynakGazi.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.KaynakGazi.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.KaynakGazi.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.KaynakGazi.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Kelepçe Tanımları',
    permissions: [
      { code: 'Permissions.Kelepce.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Kelepce.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Kelepce.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Kelepce.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Kum Tanımları',
    permissions: [
      { code: 'Permissions.Kum.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Kum.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Kum.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Kum.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Omega Tanımları',
    permissions: [
      { code: 'Permissions.Omega.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Omega.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Omega.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Omega.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Pim Tanımları',
    permissions: [
      { code: 'Permissions.Pim.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Pim.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Pim.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Pim.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Sac Tanımları',
    permissions: [
      { code: 'Permissions.Sac.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Sac.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Sac.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Sac.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Soket Tanımları',
    permissions: [
      { code: 'Permissions.Soket.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Soket.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Soket.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Soket.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Tapa Tanımları',
    permissions: [
      { code: 'Permissions.Tapa.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Tapa.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Tapa.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Tapa.Delete', name: 'Silme', isGranted: false },
    ]
  },
  {
    moduleName: 'Tel Tanımları',
    permissions: [
      { code: 'Permissions.Tel.View', name: 'Görüntüleme', isGranted: false },
      { code: 'Permissions.Tel.Create', name: 'Oluşturma', isGranted: false },
      { code: 'Permissions.Tel.Edit', name: 'Düzenleme', isGranted: false },
      { code: 'Permissions.Tel.Delete', name: 'Silme', isGranted: false },
    ]
  }
];

const RolYonetimi: React.FC = () => {
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  
  const [viewMode, setViewMode] = useState<'Tümü' | 'Aktifler' | 'Pasifler'>('Aktifler');
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});

  const [form] = Form.useForm();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<RoleType | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<ModulePermissions[]>([]);
  const [authSearchText, setAuthSearchText] = useState('');
  const [isAuthDirty, setIsAuthDirty] = useState(false);

  const fetchRoles = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = viewMode) => {
    setLoading(true);
    try {
      let url = `/Role?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'Aktifler') url += '&isActive=true';
      if (status === 'Pasifler') url += '&isActive=false';

      const response = await api.get(url);
      setRoles(response.data?.items ?? response.data ?? []);
      setTotalCount(response.data?.totalCount ?? response.data?.length ?? 0);
    } catch (error: any) {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        message.error('Veriler sunucudan alınamadı.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => { 
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchRoles(currentPage, pageSize, debouncedSearchText, viewMode); 
    }
  }, [fetchRoles, currentPage, pageSize, viewMode, debouncedSearchText]);

  const handleModalClose = () => {
    if (isFormDirty) {
      confirm({
        title: 'Kaydedilmemiş Değişiklikler Var!',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: 'Formda yaptığınız değişiklikleri kaydetmeden çıkmak istediğinize emin misiniz?',
        okText: 'Evet, Çık',
        cancelText: 'Hayır, Düzenlemeye Devam Et',
        onOk() { 
          setIsModalOpen(false); 
          setIsFormDirty(false); 
        },
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const openModalForCreate = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (role: RoleType) => {
    setEditingRole(role);
    form.setFieldsValue({
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive
    });
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingRole) {
        await api.put(`/Role/${editingRole.id}`, {
          code: values.code,
          name: values.name,
          description: values.description
        });

        if (editingRole.isActive !== values.isActive) {
          await api.patch(`/Role/${editingRole.id}/toggle-status`);
        }

        message.success('Rol başarıyla güncellendi.');
      } else {
        await api.post('/Role', {
          code: values.code,
          name: values.name,
          description: values.description
        });
        message.success('Yeni rol sisteme eklendi.');
      }
      setIsModalOpen(false);
      setIsFormDirty(false);
      fetchRoles(1, pageSize, searchText, viewMode);
      setCurrentPage(1);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'İşlem sırasında hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await api.delete(`/Role/${id}`);
      message.success('Rol silindi.');
      fetchRoles(currentPage, pageSize, searchText, viewMode);
    } catch (error: any) {
      message.error('Silme işlemi reddedildi.');
    }
  };

  const openAuthDrawer = async (role: RoleType) => {
    setSelectedRoleForAuth(role);
    setIsDrawerOpen(true);
    setAuthLoading(true);
    setAuthSearchText('');
    setIsAuthDirty(false);

    try {
      const response = await api.get(`/Role/${role.id}/permissions`);
      const grantedCodes: string[] = response.data;

      const currentMatrix = JSON.parse(JSON.stringify(SYSTEM_MODULES));

      currentMatrix.forEach((module: ModulePermissions) => {
        module.permissions.forEach((perm: Permission) => {
          if (grantedCodes.includes(perm.code)) {
            perm.isGranted = true;
          }
        });
      });

      setPermissionMatrix(currentMatrix);
    } catch (error) {
      message.error('Yetkiler yüklenirken bir hata oluştu.');
      setIsDrawerOpen(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const closeAuthDrawer = () => {
    if (isAuthDirty) {
      confirm({
        title: 'Kaydedilmemiş Yetki Değişiklikleri Var!',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: 'Yetki matrisinde değişiklik yaptınız ancak kaydetmediniz. Çıkmak istediğinize emin misiniz?',
        okText: 'Evet, Değişiklikleri Çöpe At ve Çık',
        cancelText: 'Hayır, İptal',
        onOk() {
          setIsDrawerOpen(false);
          setSelectedRoleForAuth(null);
          setAuthSearchText('');
          setIsAuthDirty(false);
        },
      });
    } else {
      setIsDrawerOpen(false);
      setSelectedRoleForAuth(null);
      setAuthSearchText('');
    }
  };

  const handlePermissionToggle = (moduleName: string, permCode: string, checked: boolean) => {
    const updatedMatrix = [...permissionMatrix];
    const targetModule = updatedMatrix.find(m => m.moduleName === moduleName);
    if (targetModule) {
      const targetPerm = targetModule.permissions.find(p => p.code === permCode);
      if (targetPerm) {
        targetPerm.isGranted = checked;
        setIsAuthDirty(true);
      }
    }
    setPermissionMatrix(updatedMatrix);
  };

  const savePermissions = async () => {
    if (!selectedRoleForAuth) return;

    const selectedCodes: string[] = [];
    permissionMatrix.forEach(module => {
      module.permissions.forEach(perm => {
        if (perm.isGranted) {
          selectedCodes.push(perm.code);
        }
      });
    });

    setAuthLoading(true);
    try {
      await api.post(`/Role/${selectedRoleForAuth.id}/permissions`, selectedCodes);
      message.success(`${selectedRoleForAuth.name} rolü için yetkiler başarıyla kaydedildi.`);
      setIsAuthDirty(false);
      setIsDrawerOpen(false);
      setSelectedRoleForAuth(null);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Yetkiler kaydedilemedi.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setSortedInfo(sorter);
    if (pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1); 
    }
  };

  const getExportQueryString = () => {
    let qs = `?search=${encodeURIComponent(searchText)}`;
    if (viewMode === 'Aktifler') qs += '&isActive=true';
    if (viewMode === 'Pasifler') qs += '&isActive=false';
    return qs;
  };

  const columns = [
    {
      title: 'Kodu', dataIndex: 'code', key: 'code', width: '15%',
      sorter: (a: RoleType, b: RoleType) => a.code.localeCompare(b.code),
      sortOrder: sortedInfo.columnKey === 'code' ? sortedInfo.order : null,
      render: (text: string) => <Tag color="default" style={{ fontWeight: 600 }}>{text}</Tag>
    },
    {
      title: 'Rol Adı', dataIndex: 'name', key: 'name', width: '25%',
      sorter: (a: RoleType, b: RoleType) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      render: (text: string, record: RoleType) => (
        <span style={{ fontWeight: 500, color: record.isActive ? 'inherit' : '#bfbfbf' }}>
          {text} {record.code === 'ADMIN' && <Tag color="error" style={{ marginLeft: 8 }}>SİSTEM</Tag>}
        </span>
      )
    },
    {
      title: 'Açıklama', dataIndex: 'description', key: 'description',
      ellipsis: { showTitle: false },
      render: (text: string, record: RoleType) => (
        <Tooltip placement="topLeft" title={text}>
          <span style={{ color: record.isActive ? 'inherit' : '#bfbfbf' }}>{text || '-'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '12%',
      render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'AKTİF' : 'PASİF'}</Tag>
    },
    {
      title: 'İşlemler', key: 'actions', width: '15%', align: 'right' as const,
      render: (_: any, record: RoleType) => {
        const isAdmin = record.code === 'ADMIN';
        return (
          <Space>
            {hasPermission('Permissions.Roles.AssignPermissions') && (
              <Button type="text" icon={<KeyOutlined />} onClick={() => openAuthDrawer(record)} disabled={isAdmin || !record.isActive} style={{ color: isAdmin || !record.isActive ? undefined : '#faad14' }} title="Yetkileri Yönet" />
            )}

            {hasPermission('Permissions.Roles.Edit') && (
              <Button type="text" icon={<EditOutlined />} onClick={() => openModalForEdit(record)} disabled={isAdmin} style={{ color: isAdmin ? undefined : '#1890ff' }} title="Görüntüle & Düzenle" />
            )}

            {hasPermission('Permissions.Roles.Delete') && (
              <Popconfirm title="Rolü Sil" description="Bu rolü silmek istediğinize emin misiniz?" onConfirm={() => handleDeleteRole(record.id)} okText="Evet" cancelText="İptal" disabled={isAdmin}>
                <Button type="text" danger icon={<DeleteOutlined />} disabled={isAdmin} title="Sil" />
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  const filteredMatrix = permissionMatrix.map(module => ({
    ...module,
    permissions: module.permissions.filter(p => turkishToLower(p.name).includes(turkishToLower(authSearchText)))
  })).filter(module => module.permissions.length > 0);

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="Rol Adı Ara... (En az 3 karakter)"
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }}
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchRoles(1, pageSize, value, viewMode);
              }}
              enterButton
            />
          </Col>
          <Col span={8}>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => {
                setViewMode(e.target.value);
                setCurrentPage(1);
              }} 
              buttonStyle="solid"
            >
              <Radio.Button value="Tümü">Tümü</Radio.Button>
              <Radio.Button value="Aktifler">Aktifler</Radio.Button>
              <Radio.Button value="Pasifler">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchRoles(currentPage, pageSize, searchText, viewMode)}>Yenile</Button>
              {hasPermission('Permissions.Roles.Create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openModalForCreate}>Yeni Rol Ekle</Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Rol_ve_Yetki_Listesi"
        tableTitle="Rol ve Yetki Yönetimi"
        titleIcon={<SafetyCertificateOutlined />}
        dataSource={roles}
        columns={columns}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        pagination={{ 
          current: currentPage, 
          pageSize: pageSize, 
          total: totalCount, 
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} arası gösteriliyor. Toplam: ${total} kayıt` 
        }}
        exportExcelUrl={`/Role/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/Role/export/pdf${getExportQueryString()}`}
      />

      <Modal title={editingRole ? "Rol Güncelle" : "Yeni Rol Tanımla"} open={isModalOpen} onCancel={handleModalClose} footer={null} destroyOnHidden maskClosable={false} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={() => setIsFormDirty(true)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="code" 
                label="Rol Kodu" 
                rules={[{ required: true, message: 'Rol Kodu zorunludur' }]}
              >
                <Input 
                  size="large" 
                  placeholder="Örn: SATIS_MUDURU" 
                  onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Rol Adı" rules={[{ required: true, message: 'Rol Adı zorunludur' }]}><Input size="large" /></Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Açıklama"><Input.TextArea rows={4} /></Form.Item>

          {editingRole && (
            <Form.Item name="isActive" label="Rol Durumu" valuePropName="checked">
              <Switch checkedChildren="Aktif" unCheckedChildren="Pasif (Gizli)" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              {editingRole ? "Değişiklikleri Kaydet" : "Sisteme Kaydet"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <KeyOutlined style={{ color: '#faad14' }} />
            <span>Yetki Matrisi: <Text strong>{selectedRoleForAuth?.name}</Text></span>
          </Space>
        }
        width={800}
        onClose={closeAuthDrawer}
        open={isDrawerOpen}
        styles={{ body: { paddingBottom: 80, backgroundColor: '#f5f5f5' } }}
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={savePermissions} loading={authLoading}>
            Yetkileri Kaydet
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Yetki adı ile ara..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            size="large"
            allowClear
            value={authSearchText}
            onChange={(e) => setAuthSearchText(e.target.value)}
          />
        </div>

        <Spin spinning={authLoading} tip="Yetkiler yükleniyor...">
          {filteredMatrix.length > 0 ? (
            <Collapse defaultActiveKey={['0']} style={{ backgroundColor: '#fff' }}>
              {filteredMatrix.map((module, mIndex) => (
                <Panel header={<Text strong style={{ color: '#1890ff' }}>{module.moduleName}</Text>} key={mIndex.toString()}>
                  {module.permissions.map((perm) => (
                    <Row key={perm.code} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                      <Col span={19}>
                        <Text style={{ fontSize: '14px' }}>{perm.name}</Text>
                      </Col>
                      <Col span={5} style={{ textAlign: 'right' }}>
                        <Switch
                          checked={perm.isGranted}
                          onChange={(checked) => handlePermissionToggle(module.moduleName, perm.code, checked)}
                          checkedChildren="AÇIK"
                          unCheckedChildren="KAPALI"
                        />
                      </Col>
                    </Row>
                  ))}
                </Panel>
              ))}
            </Collapse>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#bfbfbf' }}>
              Aradığınız kritere uygun yetki bulunamadı.
            </div>
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default RolYonetimi;