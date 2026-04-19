import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Space, Modal, Form, Input, Select, message, Tag, Row, Col, Switch, Radio } from 'antd';
import { UserAddOutlined, EditOutlined, ReloadOutlined, ExclamationCircleOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { useAuth } from '../hooks/useAuth';
import { filterOptionTurkish, turkishToLower } from '../utils/turkishSearch';

const { Option } = Select;
const { confirm } = Modal;

interface UserType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleIds: string[];
  status: boolean;
}

interface RoleType {
  id: string;
  name: string;
}

const KullaniciYonetimi: React.FC = () => {
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'Tümü' | 'Aktifler' | 'Pasifler'>('Aktifler');
  const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});
  
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const response = await api.get(`/User?page=${page}&pageSize=${size}`); 
      setUsers(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error: any) {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        message.error('Kullanıcılar yüklenirken hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/Role/lookup'); 
      setRoles(response.data);
    } catch (error) {
      message.error('Roller çekilemedi.');
    }
  };

  useEffect(() => { 
    fetchUsers(currentPage, pageSize); 
    fetchRoles();
  }, [currentPage, pageSize, fetchUsers]);

  const handleModalClose = () => {
    if (isFormDirty) {
      confirm({
        title: 'Kaydedilmemiş Değişiklikler Var!',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }}/>,
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

  const openModalForEdit = (user: UserType) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleIds: user.roleIds || [], 
      password: '',
      status: user.status 
    });
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return; 
    }

    setFormLoading(true);
    try {
      if (editingUser) {
        await api.put(`/User/${editingUser.id}`, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          roleIds: values.roleIds, 
          password: values.password 
        });

        if (editingUser.status !== values.status) {
             await api.delete(`/User/${editingUser.id}`); 
        }

        message.success('Personel bilgileri başarıyla güncellendi.');
      } else {
        await api.post('/User', {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          roleIds: values.roleIds 
        });
        message.success('Yeni personel başarıyla sisteme kaydedildi.');
        setViewMode('Aktifler');
      }

      setIsModalOpen(false);
      setIsFormDirty(false);
      fetchUsers(); 
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail 
                  || error?.response?.data?.message 
                  || 'İşlem sırasında sunucu kaynaklı bir hata oluştu.';
      message.error(errMsg);
    } finally {
      setFormLoading(false);
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

  const filteredUsers = useMemo(() => {
    return Array.isArray(users) ? users.filter(user => {
      const searchLower = turkishToLower(searchText);
      const matchesSearch = 
        turkishToLower(user.firstName).includes(searchLower) || 
        turkishToLower(user.lastName).includes(searchLower) ||
        turkishToLower(user.email).includes(searchLower);
        
      const matchesRole = selectedRole ? user.role?.includes(selectedRole) : true;
      
      const matchesStatus = 
        viewMode === 'Tümü' ? true : 
        viewMode === 'Aktifler' ? user.status === true : 
        user.status === false;

      return matchesSearch && matchesRole && matchesStatus;
    }) : [];
  }, [users, searchText, selectedRole, viewMode]);

  const columns = [
    { 
      title: 'Ad', dataIndex: 'firstName', key: 'firstName',
      sorter: (a: UserType, b: UserType) => a.firstName.localeCompare(b.firstName),
      sortOrder: sortedInfo.columnKey === 'firstName' ? sortedInfo.order : null,
    },
    { 
      title: 'Soyad', dataIndex: 'lastName', key: 'lastName',
      sorter: (a: UserType, b: UserType) => a.lastName.localeCompare(b.lastName),
      sortOrder: sortedInfo.columnKey === 'lastName' ? sortedInfo.order : null,
    },
    { 
      title: 'E-posta', dataIndex: 'email', key: 'email',
    },
    { 
      title: 'Departmanlar / Roller', dataIndex: 'role', key: 'role',
      render: (role: string) => (
        <>
          {role ? role.split(', ').map(r => (
            <Tag color="blue" key={r} style={{ marginBottom: '4px' }}>{r}</Tag>
          )) : <Tag color="default">Rol Atanmamış</Tag>}
        </>
      )
    },
    {
      title: 'Durum', dataIndex: 'status', key: 'status', width: '12%',
      render: (status: boolean) => <Tag color={status ? 'success' : 'error'}>{status ? 'AKTİF' : 'PASİF'}</Tag>
    },
    {
      title: 'İşlemler', key: 'actions', width: '10%', align: 'right' as const,
      render: (_: any, record: UserType) => {
        return (
          <Space>
            {hasPermission('Permissions.Users.Edit') && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => openModalForEdit(record)}
                title="Görüntüle & Düzenle"
              />
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input.Search
              placeholder="Ad, Soyad veya E-posta..."
              allowClear
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Departman Filtresi"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={filterOptionTurkish}
              onChange={(value) => setSelectedRole(value)}
              options={roles.map(r => ({ label: r.name, value: r.name }))}
            />
          </Col>
          <Col span={7}>
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
              <Radio.Button value="Tümü">Tümü</Radio.Button>
              <Radio.Button value="Aktifler">Aktifler</Radio.Button>
              <Radio.Button value="Pasifler">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(currentPage, pageSize)}>Yenile</Button>
                {hasPermission('Permissions.Users.Create') && (
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />} 
                    onClick={() => {
                      fetchRoles(); 
                      setEditingUser(null);
                      form.resetFields();
                      form.setFieldsValue({ status: true });
                      setIsFormDirty(false);
                      setIsModalOpen(true);
                    }}
                  >
                    Yeni Personel
                  </Button>
                )}
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Kullanici_Listesi"
        tableTitle="Sistem Kullanıcıları"
        titleIcon={<TeamOutlined />}
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        exportExcelUrl="/User/export/excel" 
        exportPdfUrl="/User/export/pdf"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} arası gösteriliyor. Toplam: ${total} kayıt`
        }}
      />

      <Modal
        title={editingUser ? "Personel Kartı" : "Yeni Personel Tanımla"}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        maskClosable={false}
        destroyOnClose
        width={700} 
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          onValuesChange={() => setIsFormDirty(true)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="Ad" rules={[{ required: true, message: 'Ad zorunludur' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Soyad" rules={[{ required: true, message: 'Soyad zorunludur' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="E-posta Adresi" rules={[{ required: true, type: 'email', message: 'Geçerli e-posta giriniz' }]}>
                <Input size="large" disabled={!!editingUser} /> 
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roleIds" label="Departmanlar / Yetki Rolleri" rules={[{ required: true, message: 'Lütfen en az bir rol seçiniz' }]}>
                <Select 
                  mode="multiple" 
                  allowClear 
                  showSearch
                  optionFilterProp="children"
                  filterOption={filterOptionTurkish}
                  placeholder="Departmanları Seçiniz" 
                  loading={roles.length === 0} 
                  size="large"
                >
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>{role.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col span={16}>
              <Form.Item 
                name="password" 
                label={editingUser ? "Yeni Şifre Belirle (Değiştirmeyecekseniz Boş Bırakın)" : "Geçici Sistem Şifresi"} 
                rules={[{ required: !editingUser, min: 6, message: 'En az 6 karakter olmalıdır' }]}
              >
                <Input.Password size="large" placeholder={editingUser ? "Şifreyi sıfırlamak için yazın..." : ""} />
              </Form.Item>
            </Col>
            <Col span={8}>
               <Form.Item name="status" label="Hesap Durumu (Sistem Girişi)" valuePropName="checked">
                 <Switch checkedChildren="Aktif" unCheckedChildren="Pasif (Engelli)" />
               </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Button type="primary" htmlType="submit" block loading={formLoading} size="large">
              {editingUser ? "Değişiklikleri Kaydet" : "Sisteme Kaydet ve Yetkilendir"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default KullaniciYonetimi;