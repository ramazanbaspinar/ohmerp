import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, Popconfirm, message, Switch, Row, Col, Radio, Select } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

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

interface MakineTanimlariPageProps {
  machineType: number;
}

const MakineTanimlariPage: React.FC<MakineTanimlariPageProps> = ({ machineType }) => {
  const [data, setData] = useState<WorkCenterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('active');

  const [form] = Form.useForm();

  const getMachineName = () => {
    return workCenterTypes.find(x => x.value === machineType)?.label || 'Makine';
  };

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `/WorkCenters?page=${page}&pageSize=${size}&type=${machineType}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'active') url += '&isActive=true';
      if (status === 'passive') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error(`${getMachineName()} kayıtları yüklenirken hata oluştu.`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, statusFilter, machineType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, machineType]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText, statusFilter);
    }
  }, [currentPage, pageSize, statusFilter, debouncedSearchText, fetchData, machineType]);

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/3');
      const initVals = { code: numRes.data.nextCode, isActive: true, currency: 1, type: machineType };
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
    } catch {
      const initVals = { code: '', isActive: true, currency: 1, type: machineType };
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
    } finally {
      setFormLoading(false);
    }
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/WorkCenters/${id}`);
      form.setFieldsValue(response.data);
      setOriginalData(response.data);
    } catch {
      message.error('Kayıt bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.put(`/WorkCenters/${editingId}`, values);
        message.success('Kayıt başarıyla güncellendi.');
      } else {
        await api.post('/WorkCenters', values);
        message.success('Kayıt başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, statusFilter);
    } catch (error: any) {
      if (error.errorFields) return;
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/WorkCenters/${id}`);
      message.success('Kayıt başarıyla silindi.');
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
      width: '35%',
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
              placeholder={`${getMachineName()} Ara (En az 3 karakter)...`} 
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
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Kayıt</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName={`MakineTanimlari_${machineType}`}
        tableTitle={`${getMachineName()} Tanımları`}
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
        exportExcelUrl={`/WorkCenters/export/excel?type=${machineType}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`}
        exportPdfUrl={`/WorkCenters/export/pdf?type=${machineType}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`}
      />

      <OhmFormDrawer
        title={editingId ? `${getMachineName()} Düzenle` : `Yeni ${getMachineName()}`}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
        initialValues={originalData}
      >
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
            <Select options={workCenterTypes} disabled />
          </Form.Item>

          <Form.Item name="currency" label="Para Birimi" rules={[{ required: true }]}>
            <Select options={currencyTypes} />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default MakineTanimlariPage;
