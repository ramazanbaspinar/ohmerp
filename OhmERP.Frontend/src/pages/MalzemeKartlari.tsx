import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Button, Tag, Typography, Space, Input, Select, Drawer, 
  Form, Row, Col, InputNumber, Popconfirm, message, Divider, Radio, Switch
} from 'antd';
import {
  AppstoreAddOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { filterOptionTurkish, getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

const { Text } = Typography;
const { Option } = Select;

const categoryPropertyMap: Record<string, { name: string; label: string; type: 'number' | 'text' }[]> = {
  'Teller': [
    { name: 'ohmDegeri', label: 'Ohm Değeri (Ω/m)', type: 'number' },
    { name: 'telCapi', label: 'Tel Çapı (mm)', type: 'number' },
    { name: 'agirlik', label: 'Ağırlık (g/m)', type: 'number' }
  ],
  'Saclar': [
    { name: 'kalinlik', label: 'Sac Kalınlığı (mm)', type: 'number' }
  ],
  'Kaynak Gazı': [
    { name: 'gazMiktari', label: 'Gaz Miktarı (m3)', type: 'number' },
    { name: 'verimlilik', label: 'Verimlilik (m)', type: 'number' }
  ],
  'Bağlantı Telleri': [
    { name: 'baglantiCapi', label: 'Bağlantı Teli Çapı (mm)', type: 'number' }
  ]
};

interface ItemListDto {
  id: string;
  code: string;
  name: string;
  categoryName: string;
  unitOfMeasureName: string;
  typeName: string;
  taxRate: number;
  criticalStockLevel: number;
  isActive: boolean;
}

interface LookupDto {
  id: string;
  name: string;
}

const MalzemeKartlari: React.FC = () => {
  const [data, setData] = useState<ItemListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [viewMode, setViewMode] = useState<'Tümü' | 'Aktifler' | 'Pasifler'>('Aktifler');
  
  const [categories, setCategories] = useState<LookupDto[]>([]);
  const [uoms, setUoms] = useState<LookupDto[]>([]);
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isCodeManualAllowed, setIsCodeManualAllowed] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  
  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = viewMode) => {
    setLoading(true);
    try {
      let url = `/Item?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'Aktifler') url += '&isActive=true';
      if (status === 'Pasifler') url += '&isActive=false';

      const response = await api.get(url);
      
      setData(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    } catch {
      message.error('Malzemeler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, viewMode]);

  const fetchLookups = async () => {
    try {
      const [catRes, uomRes] = await Promise.all([
        api.get('/ItemCategory/lookup'),
        api.get('/UnitOfMeasure/lookup')
      ]);
      setCategories(catRes.data ?? []);
      setUoms(uomRes.data ?? []);
    } catch {
      message.error('Sözlük verileri alınamadı.');
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText, viewMode);
    }
  }, [fetchData, currentPage, pageSize, viewMode, debouncedSearchText]);

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    setSelectedCategoryName(cat?.name || '');
  };

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setSelectedCategoryName('');
    setIsCodeManualAllowed(false);
    setOriginalData(null);
    form.setFieldsValue({ code: 'Yükleniyor...', taxRate: 20, criticalStockLevel: 0, type: 1, isActive: true }); 
    setIsDrawerVisible(true);
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/2');
      form.setFieldsValue({ code: numRes.data.nextCode });
      setIsCodeManualAllowed(numRes.data.isManualEntryAllowed);
    } catch {
      message.error('Numaratör verisi alınamadı.');
      form.setFieldsValue({ code: '' });
    }
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    form.resetFields();
    setIsCodeManualAllowed(false);
    
    try {
      const response = await api.get(`/Item/${id}`);
      const itemData = response.data;
      
      const cat = categories.find(c => c.id === itemData.categoryId);
      setSelectedCategoryName(cat?.name || '');

      let dynamicProps = {};
      if (itemData.propertiesJson) {
        dynamicProps = JSON.parse(itemData.propertiesJson);
      }

      form.setFieldsValue({
        ...itemData,
        ...dynamicProps 
      });
      setOriginalData({ ...itemData, ...dynamicProps });
      
      const numRes = await api.get('/Numerator/PreviewNextCode/2');
      setIsCodeManualAllowed(numRes.data.isManualEntryAllowed);
    } catch {
      message.error('Malzeme bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    setFormLoading(true);
    try {
      const { 
        code, name, categoryId, unitOfMeasureId, type, taxRate, 
        barcode, criticalStockLevel, description, isActive,
        ...dynamicFields 
      } = values;

      const payload = {
        code, name, categoryId, unitOfMeasureId, type, taxRate, 
        barcode, criticalStockLevel, description, isActive,
        propertiesJson: JSON.stringify(dynamicFields) 
      };

      if (editingId) {
        await api.put(`/Item/${editingId}`, payload);
        message.success('Malzeme başarıyla güncellendi.');
      } else {
        await api.post('/Item', payload);
        message.success('Malzeme başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, viewMode);
      setCurrentPage(1);
    } catch (error: any) {
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/Item/${id}`);
      message.success('Malzeme başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText, viewMode);
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

  const getExportQueryString = () => {
    let qs = `?search=${encodeURIComponent(searchText)}`;
    if (viewMode === 'Aktifler') qs += '&isActive=true';
    if (viewMode === 'Pasifler') qs += '&isActive=false';
    return qs;
  };

  const columns = [
    { title: 'Kodu', dataIndex: 'code', key: 'code', width: '15%', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Malzeme Adı', dataIndex: 'name', key: 'name', width: '30%' },
    { title: 'Kategori', dataIndex: 'categoryName', key: 'categoryName', width: '15%', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Birim', dataIndex: 'unitOfMeasureName', key: 'unitOfMeasureName', width: '10%' },
    { title: 'Tipi', dataIndex: 'typeName', key: 'typeName', width: '10%', 
      render: (text: string) => {
        if(text === 'RawMaterial') return <Tag color="orange">Hammadde</Tag>;
        if(text === 'FinishedGood') return <Tag color="green">Mamul</Tag>;
        return <Tag>{text}</Tag>;
      }
    },
    { title: 'KDV (%)', dataIndex: 'taxRate', key: 'taxRate', width: '8%' },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '8%', render: (isActive: boolean) => isActive ? <Tag color="success">Aktif</Tag> : <Tag color="error">Pasif</Tag> },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '12%',
      render: (_: any, record: ItemListDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const currentDynamicFields = categoryPropertyMap[selectedCategoryName] || [];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => { 
                setViewMode(e.target.value); 
                setCurrentPage(1); 
              }} 
              optionType="button" 
              buttonStyle="solid"
            >
              <Radio.Button value="Tümü">Tümü</Radio.Button>
              <Radio.Button value="Aktifler">Aktifler</Radio.Button>
              <Radio.Button value="Pasifler">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8}>
            <Input.Search 
              placeholder="Malzeme Adı Ara... (En az 3 karakter)" 
              value={searchText} 
              onChange={e => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }} 
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchData(1, pageSize, value, viewMode);
              }}
              allowClear 
              enterButton
            />
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, viewMode)}>Yenile</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Malzeme Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Malzeme_Kartlari"
        tableTitle="Stok / Malzeme Kartları Yönetimi"
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
        exportExcelUrl={`/Item/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/Item/export/pdf${getExportQueryString()}`}
      />

      <Drawer
        title={editingId ? 'Malzeme Kartı Düzenle' : 'Yeni Malzeme Kartı'}
        width={700}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        destroyOnHidden
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>İptal</Button>
            {editingId && (
              <Button onClick={() => {
                form.resetFields();
                if (originalData) {
                  form.setFieldsValue(originalData);
                  const cat = categories.find(c => c.id === originalData.categoryId);
                  setSelectedCategoryName(cat?.name || '');
                }
              }}>
                Geri Al
              </Button>
            )}
            <Button onClick={handleSave} type="primary" loading={formLoading}>{editingId ? 'Güncelle' : 'Kaydet'}</Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} disabled={formLoading}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="code" 
                label="Malzeme Kodu" 
                rules={[{ required: true, message: 'Zorunlu' }]}
              >
                <Input 
                  disabled={!isCodeManualAllowed}
                  placeholder="Örn: HAMMADDE_01" 
                  onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Malzeme Adı" rules={[{ required: true, message: 'Zorunlu' }]}>
                <Input placeholder="Örn: 0.35 Kanthal Tel" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="type" label="Malzeme Tipi" rules={[{ required: true }]}>
                <Select>
                  <Option value={1}>Hammadde</Option>
                  <Option value={2}>Yarı Mamul</Option>
                  <Option value={3}>Mamul (Rezistans)</Option>
                  <Option value={4}>Sarf Malzeme</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="categoryId" label="Kategori" rules={[{ required: true, message: 'Zorunlu' }]}>
                <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} onChange={handleCategoryChange} placeholder="Seçiniz">
                  {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unitOfMeasureId" label="Ölçü Birimi" rules={[{ required: true, message: 'Zorunlu' }]}>
                <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="Seçiniz">
                  {uoms.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isActive" label="Durum" valuePropName="checked">
                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
              </Form.Item>
            </Col>
          </Row>

          {currentDynamicFields.length > 0 && (
            <>
              <Divider orientation="left" style={{ borderColor: '#1890ff', color: '#1890ff' }}>Teknik Özellikler ({selectedCategoryName})</Divider>
              <Row gutter={16}>
                {currentDynamicFields.map(field => (
                  <Col span={8} key={field.name}>
                    <Form.Item name={field.name} label={field.label}>
                      {field.type === 'number' ? <InputNumber style={{ width: '100%' }} /> : <Input />}
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </>
          )}

          <Divider orientation="left">Ticari ve Depo Bilgileri</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="taxRate" label="KDV Oranı (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="criticalStockLevel" label="Kritik Stok Seviyesi">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="barcode" label="Barkod">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default MalzemeKartlari;