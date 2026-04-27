import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, message, Row, Col, Tabs, Select } from 'antd';
import { AppstoreAddOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { getErrorMessage } from '../utils/turkishSearch';
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

const IsMerkeziMaliyetleriPage: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState('all');

  const [form] = Form.useForm();

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchText, 
    tab = activeTab,
    sortBy = '',
    sortDesc = false
  ) => {
    setLoading(true);
    try {
      let url = `/WorkCenters?page=${page}&pageSize=${size}&isActive=true`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (tab !== 'all') {
        url += `&type=${tab}`;
      }
      if (sortBy) {
        url += `&sortBy=${sortBy}&sortDesc=${sortDesc}`;
      }

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('Maliyet bilgileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, activeTab]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText, activeTab);
    }
  }, [currentPage, pageSize, activeTab, debouncedSearchText, fetchData]);

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/WorkCenters/${id}`);
      form.setFieldsValue({
        hourlyMachineCost: response.data.hourlyMachineCost,
        hourlyLaborCost: response.data.hourlyLaborCost,
        currency: response.data.currency
      });
      setOriginalData(response.data);
    } catch {
      message.error('Makine bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const values = await form.validateFields();
      if (editingId && originalData) {
        const updatePayload = {
          ...originalData,
          hourlyMachineCost: values.hourlyMachineCost,
          hourlyLaborCost: values.hourlyLaborCost,
          currency: values.currency
        };
        await api.put(`/WorkCenters/${editingId}`, updatePayload);
        message.success('Maliyet başarıyla güncellendi.');
        setIsDrawerVisible(false);
        fetchData(currentPage, pageSize, searchText, activeTab);
      }
    } catch (error: any) {
      if (error.errorFields) return;
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    let sortField = '';
    let sortDesc = false;

    if (sorter && sorter.field) {
      sortField = sorter.field;
      sortDesc = sorter.order === 'descend';
    }

    if (pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1);
    }

    fetchData(
      pagination.current || currentPage, 
      pagination.pageSize || pageSize, 
      searchText, 
      activeTab,
      sortField,
      sortDesc
    );
  };

  const buildExportUrl = (format: 'excel' | 'pdf') => {
    const params = new URLSearchParams();
    if (searchText) params.append('search', searchText);
    if (activeTab !== 'all') params.append('type', activeTab);
    params.append('isActive', 'true');
    
    const queryString = params.toString();
    return `/WorkCenters/export/${format}${queryString ? `?${queryString}` : ''}`;
  };

  const columns = [
    { 
      title: 'Kod', 
      dataIndex: 'code', 
      key: 'code', 
      width: '15%',
      sorter: true,
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Makine Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '35%',
      sorter: true
    },
    {
      title: 'Makine Maliyeti (Saat)',
      dataIndex: 'hourlyMachineCost',
      key: 'hourlyMachineCost',
      width: '15%',
      sorter: true,
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'İşçilik Maliyeti (Saat)',
      dataIndex: 'hourlyLaborCost',
      key: 'hourlyLaborCost',
      width: '15%',
      sorter: true,
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: '10%',
      sorter: true,
      render: (val: number) => <Text>{currencyTypes.find(x => x.value === val)?.label || val}</Text>
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '10%',
      render: (_: any, record: WorkCenterDto) => (
        <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)}>
          Maliyet Güncelle
        </Button>
      )
    }
  ];

  const tabItems = [
    { key: 'all', label: 'Tümü' },
    ...workCenterTypes.map(type => ({
      key: type.value.toString(),
      label: type.label
    }))
  ];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
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
                fetchData(1, pageSize, value, activeTab);
              }}
              allowClear
              enterButton
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, activeTab)}>Yenile</Button>
             </Space>
          </Col>
        </Row>
      </div>

      <div style={{ background: '#fff', padding: '0 16px', marginBottom: 16, borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            setCurrentPage(1);
          }} 
          items={tabItems} 
        />
      </div>

      <OhmTable
        tableName="Is_Merkezi_Maliyetleri"
        tableTitle="İş Merkezi (Makine) Maliyetleri"
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
        exportExcelUrl={buildExportUrl('excel')}
        exportPdfUrl={buildExportUrl('pdf')}
      />

      <OhmFormDrawer
        title="Maliyet Güncelle"
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
      >
          <Form.Item name="hourlyMachineCost" label="Saatlik Makine Maliyeti" rules={[{ required: true, message: 'Bu alan zorunludur' }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="hourlyLaborCost" label="Saatlik İşçilik Maliyeti" rules={[{ required: true, message: 'Bu alan zorunludur' }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="currency" label="Para Birimi" rules={[{ required: true, message: 'Bu alan zorunludur' }]}>
            <Select options={currencyTypes} />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default IsMerkeziMaliyetleriPage;
