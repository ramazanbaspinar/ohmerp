import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Drawer, Form, Popconfirm, message, Switch, Row, Col, Radio, Select } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';
import { OhmInputNumber } from '../components/OhmInputNumber';

const { Text } = Typography;

interface WorkCenterDto {
  id: string;
  code: string;
  name: string;
  type: number;
  hourlyMachineCost: number;
  hourlyLaborCost: number;
  currency: number;
  isActive: boolean;
}

const workCenterTypes = [
  { value: 1, label: 'Tel Makinesi' },
  { value: 2, label: 'Boru Makinesi' },
  { value: 3, label: 'Dolum Makinesi' },
  { value: 4, label: 'Hadde Makinesi' },
  { value: 5, label: 'Büküm Makinesi' },
  { value: 6, label: 'Pres Makinesi' },
  { value: 7, label: 'Punta Makinesi' },
  { value: 8, label: 'Bağlantı Puntası' },
  { value: 9, label: 'Test Makinesi' },
  { value: 99, label: 'Diğer' }
];

const currencyTypes = [
  { value: 1, label: 'TL' },
  { value: 2, label: 'USD' },
  { value: 3, label: 'EUR' }
];

const WorkCenters: React.FC = () => {
  const [data, setData] = useState<WorkCenterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('active');

  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `/WorkCenters?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'active') url += '&isActive=true';
      if (status === 'passive') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('İş merkezleri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText, statusFilter);
    }
  }, [currentPage, pageSize, statusFilter, debouncedSearchText, fetchData]);

  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, currency: 1, type: 1 });
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/WorkCenters/${id}`);
      form.setFieldsValue(response.data);
    } catch {
      message.error('Makine bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setFormLoading(true);
    try {
      if (editingId) {
        await api.put(`/WorkCenters/${editingId}`, values);
        message.success('İş Merkezi başarıyla güncellendi.');
      } else {
        await api.post('/WorkCenters', values);
        message.success('İş Merkezi başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, statusFilter);
    } catch (error: any) {
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/WorkCenters/${id}`);
      message.success('İş Merkezi başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText, statusFilter);
    } catch {
      message.error('Silme işlemi başarısız.');
    }
  };

  const handleTableChange = (pagination: any) => {
    if (pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1); 
    }
  };

  const columns = [
    { 
      title: 'Kod', 
      dataIndex: 'code', 
      key: 'code', 
      width: '10%', 
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Makine Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '25%',
    },
    {
      title: 'Tip',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (val: number) => <Text>{workCenterTypes.find(x => x.value === val)?.label || val}</Text>
    },
    {
      title: 'Makine Mal. (Saat)',
      dataIndex: 'hourlyMachineCost',
      key: 'hourlyMachineCost',
      width: '15%',
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'İşçilik Mal. (Saat)',
      dataIndex: 'hourlyLaborCost',
      key: 'hourlyLaborCost',
      width: '15%',
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: '10%',
      render: (val: number) => <Text>{currencyTypes.find(x => x.value === val)?.label || val}</Text>
    },
    { 
      title: 'Durum', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      width: '5%', 
      render: (isActive: boolean) => isActive ? <Text type="success">Aktif</Text> : <Text type="danger">Pasif</Text> 
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '10%',
      render: (_: any, record: WorkCenterDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search 
              placeholder="Makine Ara (En az 3 karakter)..." 
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }}
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchData(1, pageSize, value, statusFilter);
              }}
              allowClear
              enterButton
            />
          </Col>
          <Col span={8}>
            <Radio.Group 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }} 
              buttonStyle="solid"
            >
              <Radio.Button value="all">Tümü</Radio.Button>
              <Radio.Button value="active">Aktifler</Radio.Button>
              <Radio.Button value="passive">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, statusFilter)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Makine Ekle</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Is_Merkezleri"
        tableTitle="İş Merkezleri (Makineler)"
        titleIcon={<AppstoreAddOutlined />}
        dataSource={data} 
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
      />

      <Drawer
        title={editingId ? 'Makine Düzenle' : 'Yeni Makine'}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>İptal</Button>
            <Button form="workCenterForm" htmlType="submit" type="primary" loading={formLoading}>{editingId ? 'Güncelle' : 'Kaydet'}</Button>
          </Space>
        }
      >
        <Form id="workCenterForm" layout="vertical" form={form} disabled={formLoading} onFinish={handleSave}>
          <Form.Item 
            name="code" 
            label="Makine Kodu" 
            rules={[{ required: true }]}
          >
            <Input 
              maxLength={50} 
              onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })}
            />
          </Form.Item>
          <Form.Item name="name" label="Makine Adı" rules={[{ required: true }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="type" label="Tipi" rules={[{ required: true }]}>
            <Select options={workCenterTypes} />
          </Form.Item>
          <Form.Item name="hourlyMachineCost" label="Saatlik Makine Maliyeti" rules={[{ required: true }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="hourlyLaborCost" label="Saatlik İşçilik Maliyeti" rules={[{ required: true }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="currency" label="Para Birimi" rules={[{ required: true }]}>
            <Select options={currencyTypes} />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default WorkCenters;
