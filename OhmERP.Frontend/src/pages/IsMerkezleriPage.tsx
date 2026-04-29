import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, Popconfirm, message, Switch, Row, Col, Select, InputNumber, Tag, Tooltip } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  category: string;
  calculationType: number;
  setupTime: number;
  unitProcessTime: number;
  batchCapacityLimit?: number;
  isActive: boolean;
}

const calculationTypes = [
  { value: 1, label: 'Metre/Adet Çarpanı' },
  { value: 2, label: 'Parti Kapasitesi' },
  { value: 3, label: 'Sabit Süre' },
  { value: 4, label: 'Serbest Giriş' }
];

const categoryOptions = [
  { value: 'Tel Makinesi', label: 'Tel Makinesi' },
  { value: 'Boru Makinesi', label: 'Boru Makinesi' },
  { value: 'Dolum Makinesi', label: 'Dolum Makinesi' },
  { value: 'Hadde Makinesi', label: 'Hadde Makinesi' },
  { value: 'Büküm Makinesi', label: 'Büküm Makinesi' },
  { value: 'Pres Makinesi', label: 'Pres Makinesi' },
  { value: 'Punta Makinesi', label: 'Punta Makinesi' },
  { value: 'Bağlantı Puntası', label: 'Bağlantı Puntası' },
  { value: 'Test Makinesi', label: 'Test Makinesi' },
  { value: 'Diğer', label: 'Diğer' }
];



const IsMerkezleriPage: React.FC = () => {
  const [data, setData] = useState<WorkCenterDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [originalData, setOriginalData] = useState<any>(null);

  const [selectedCalcType, setSelectedCalcType] = useState<number>(1);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);

  const [form] = Form.useForm();

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchText, 
    sortBy = '',
    sortDesc = false
  ) => {
    setLoading(true);
    try {
      let url = `/WorkCenters?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sortBy) {
        url += `&sortBy=${sortBy}&sortDesc=${sortDesc}`;
      }

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('İş merkezleri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText);
    }
  }, [currentPage, pageSize, debouncedSearchText, fetchData]);

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerVisible(true);
    setFormLoading(true);
    
    const initVals: any = { 
        code: '', 
        isActive: true, 
        calculationType: 1,
        category: 'Diğer'
    };
    
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/3');
      initVals.code = numRes.data.nextCode;
    } catch {
      // Ignore numerator error
    } finally {
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
      setSelectedCalcType(1);
      setFormLoading(false);
    }
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    form.resetFields();
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/WorkCenters/${id}`);
      const record = response.data;
      
      // Prevent 0 from showing, use null instead for number inputs
      if (record.setupTime === 0) record.setupTime = null;
      if (record.unitProcessTime === 0) record.unitProcessTime = null;
      if (record.batchCapacityLimit === 0) record.batchCapacityLimit = null;
      
      form.setFieldsValue(record);
      setOriginalData(record);
      setSelectedCalcType(record.calculationType);
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
      
      // Null coalesce before sending to backend
      const payload = {
          ...values,
          setupTime: values.setupTime || 0,
          unitProcessTime: values.unitProcessTime || 0,
          batchCapacityLimit: values.calculationType === 2 ? (values.batchCapacityLimit || 0) : null
      };

      if (editingId) {
        await api.put(`/WorkCenters/${editingId}`, payload);
        message.success('İş Merkezi başarıyla güncellendi.');
      } else {
        await api.post('/WorkCenters', payload);
        message.success('İş Merkezi başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText);
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
      message.success('İş Merkezi başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText);
    } catch {
      message.error('Silme işlemi başarısız.');
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
      sortField,
      sortDesc
    );
  };



  const columns = [
    { 
      title: 'Makine Kodu', 
      dataIndex: 'code', 
      key: 'code', 
      width: '10%',
      sorter: (a: WorkCenterDto, b: WorkCenterDto) => a.code.localeCompare(b.code),
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Makine Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '25%',
      sorter: (a: WorkCenterDto, b: WorkCenterDto) => a.name.localeCompare(b.name)
    },
    {
      title: 'Tipi',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      sorter: (a: WorkCenterDto, b: WorkCenterDto) => a.category.localeCompare(b.category)
    },
    {
      title: 'Hesaplama Tipi',
      dataIndex: 'calculationType',
      key: 'calculationType',
      width: '15%',
      render: (val: number) => {
          const matched = calculationTypes.find(x => x.value === val);
          let color = 'default';
          if (val === 1) color = 'blue';
          if (val === 2) color = 'purple';
          if (val === 3) color = 'orange';
          if (val === 4) color = 'green';
          return <Tag color={color}>{matched?.label || val}</Tag>;
      }
    },

    { 
      title: 'Durum', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      width: '10%', 
      render: (isActive: boolean) => isActive ? <Tag color="success">Aktif</Tag> : <Tag color="error">Pasif</Tag> 
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
        <Row gutter={16} align="middle" justify="space-between">
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
                fetchData(1, pageSize, value);
              }}
              allowClear
              enterButton
            />
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Makine Ekle</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Is_Merkezleri_Page"
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
        exportExcelUrl={`/WorkCenters/export/excel${searchText ? `?search=${searchText}` : ''}`}
        exportPdfUrl={`/WorkCenters/export/pdf${searchText ? `?search=${searchText}` : ''}`}
      />

      <OhmFormDrawer
        title={editingId ? 'Makine Düzenle' : 'Yeni Makine'}
        width={450}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
        initialValues={originalData}
      >
              <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="code" label="Makine Kodu" rules={[{ required: true, message: 'Zorunlu alan' }]}>
                        <Input maxLength={50} onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isActive" label="Durum" valuePropName="checked">
                        <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                    </Form.Item>
                  </Col>
              </Row>

              <Form.Item name="name" label="Makine Adı" rules={[{ required: true, message: 'Zorunlu alan' }]}>
                <Input maxLength={150} />
              </Form.Item>
              
              <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="category" label="Tipi (Kategori)" rules={[{ required: true, message: 'Zorunlu alan' }]}>
                        <Select options={categoryOptions} allowClear />
                    </Form.Item>
                  </Col>
              </Row>

              <Form.Item name="calculationType" label={
                  <span>
                    Hesaplama Tipi&nbsp;
                    <Tooltip title={
                      <div style={{ padding: '4px' }}>
                        <div><b>Metre/Adet Çarpanı:</b> Süre, ürünün boyuna (metre) veya adedine göre çarpılarak hesaplanır.</div>
                        <div style={{ marginTop: 4 }}><b>Parti Kapasitesi:</b> Toplu işlem yapan (Örn: Aynı anda 50 ürün alabilen kazan/havuz) makinelerin kapasitesine göre hesaplanır.</div>
                        <div style={{ marginTop: 4 }}><b>Sabit Süre:</b> Ürün adedinden bağımsız, kalıp takma, tezgah hazırlama gibi tek seferlik sürelerdir.</div>
                        <div style={{ marginTop: 4 }}><b>Serbest Giriş:</b> Formüle uymayan, ürün bazında kullanıcının elle gireceği istisnai sürelerdir.</div>
                      </div>
                    }>
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                    </Tooltip>
                  </span>
                } rules={[{ required: true, message: 'Zorunlu alan' }]}>
                <Select options={calculationTypes} onChange={(val) => setSelectedCalcType(val)} />
              </Form.Item>


              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="setupTime" label="Hazırlık Süresi (dk)">
                          <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="" />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item name="unitProcessTime" label="Birim İşlem Süresi (dk)">
                          <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="" />
                      </Form.Item>
                  </Col>
              </Row>

              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="batchCapacityLimit" label="Parti Kapasite Sınırı" style={{ opacity: selectedCalcType === 2 ? 1 : 0.5 }}>
                          <InputNumber style={{ width: '100%' }} min={0} step={1} disabled={selectedCalcType !== 2} placeholder="" />
                      </Form.Item>
                  </Col>
              </Row>
      </OhmFormDrawer>
    </>
  );
};

export default IsMerkezleriPage;
