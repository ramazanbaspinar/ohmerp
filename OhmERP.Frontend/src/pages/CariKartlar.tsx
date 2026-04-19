import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Button, Tag, Typography, Space, Input, Select, Drawer, 
  Form, Row, Col, Tabs, Switch, InputNumber, Popconfirm, message, Radio, Checkbox
} from 'antd';
import {
  BankOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { filterOptionTurkish, getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface CompanyListDto {
  id: string;
  code: string;
  name: string;
  type: number;
  primaryContactPerson: string;
  phone1: string;
  cityName: string | null;
  districtName: string | null;
  taxOffice: string;
  taxNumber: string;
  creditLimit: number;
  isActive: boolean;
}

interface LookupDto {
  id: string;
  name: string;
}

const CariKartlar: React.FC = () => {
  const [data, setData] = useState<CompanyListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [filterType, setFilterType] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'Tümü' | 'Aktifler' | 'Pasifler'>('Aktifler');

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [cities, setCities] = useState<LookupDto[]>([]);
  const [districts, setDistricts] = useState<LookupDto[]>([]);
  const [isEInvoiceUser, setIsEInvoiceUser] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [isCodeManualAllowed, setIsCodeManualAllowed] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  const fetchCompanies = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, type = filterType, status = viewMode) => {
    setLoading(true);
    try {
      let url = `/Company?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (type !== null) url += `&type=${type}`;
      if (status === 'Aktifler') url += '&isActive=true';
      if (status === 'Pasifler') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data.items ?? []);
      setTotalCount(response.data.totalCount ?? 0);
    } catch {
      message.error('Cari kartlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, filterType, viewMode]);

  const fetchCities = async () => {
    try {
      const response = await api.get('/Cities/lookup');
      setCities(response.data ?? []);
    } catch {
      message.error('Şehir sözlüğü alınamadı.');
    }
  };

  const fetchDistricts = async (cityId: string) => {
    try {
      const response = await api.get(`/Districts/lookup/${cityId}`);
      setDistricts(response.data ?? []);
    } catch {
      setDistricts([]);
    }
  };

  useEffect(() => {
    fetchCities();
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
      fetchCompanies(currentPage, pageSize, debouncedSearchText, filterType, viewMode);
    }
  }, [currentPage, pageSize, viewMode, filterType, debouncedSearchText, fetchCompanies]);

  const handleCityChange = (cityId: string) => {
    form.setFieldsValue({ districtId: undefined });
    setDistricts([]);
    if (cityId) fetchDistricts(cityId);
  };

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setIsCodeManualAllowed(false);
    form.setFieldsValue({ code: 'Yükleniyor...', isActive: true, type: 1, creditLimit: 0, paymentTermDays: 0, defaultCurrency: 'TRY' });
    setIsEInvoiceUser(false);
    setDistricts([]);
    setActiveTab('1');
    setIsDrawerVisible(true);
    setOriginalData(null);
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/1');
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
    setDistricts([]);
    setActiveTab('1');
    try {
      const response = await api.get(`/Company/${id}`);
      const companyData = response.data;
      setIsEInvoiceUser(companyData.isEInvoiceUser);
      if (companyData.cityId) await fetchDistricts(companyData.cityId);
      form.setFieldsValue(companyData);
      setOriginalData(companyData);
      
      const numRes = await api.get('/Numerator/PreviewNextCode/1');
      setIsCodeManualAllowed(numRes.data.isManualEntryAllowed);
    } catch {
      message.error('Cari bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, creditLimit: values.creditLimit ?? 0, paymentTermDays: values.paymentTermDays ?? 0 };
      if (editingId) {
        await api.put(`/Company/${editingId}`, payload);
        message.success('Cari kart başarıyla güncellendi.');
      } else {
        await api.post('/Company', payload);
        message.success('Cari kart başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchCompanies(1, pageSize, searchText, filterType, viewMode);
      setCurrentPage(1);
    } catch (error: any) {
      if (error.errorFields && error.errorFields.length > 0) {
        message.warning('Lütfen diğer sekmelerdeki zorunlu alanları da kontrol ediniz.');
        
        const firstErrorField = error.errorFields[0].name[0];
        
        const tab1Fields = ['code', 'type', 'isActive', 'name', 'shortName', 'description'];
        const tab2Fields = ['cityId', 'districtId', 'address', 'primaryContactPerson', 'phone1', 'phone2', 'email', 'website'];
        const tab3Fields = ['taxOffice', 'taxNumber', 'isEInvoiceUser', 'eInvoiceAlias', 'paymentTermDays', 'creditLimit', 'defaultCurrency', 'gLCode'];
        
        if (tab1Fields.includes(firstErrorField)) {
          setActiveTab('1');
        } else if (tab2Fields.includes(firstErrorField)) {
          setActiveTab('2');
        } else if (tab3Fields.includes(firstErrorField)) {
          setActiveTab('3');
        }
      } else if (error?.response?.data) {
        message.error(getErrorMessage(error));
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/Company/${id}`);
      message.success('Cari kart başarıyla silindi.');
      fetchCompanies(currentPage, pageSize, searchText, filterType, viewMode);
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
    if (filterType !== null) qs += `&type=${filterType}`;
    if (viewMode === 'Aktifler') qs += '&isActive=true';
    if (viewMode === 'Pasifler') qs += '&isActive=false';
    return qs;
  };

  const columns = [
    { title: 'Cari Kodu', dataIndex: 'code', key: 'code', width: '12%', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Firma Adı', dataIndex: 'name', key: 'name', width: '25%' },
    { 
      title: 'Tipi', dataIndex: 'type', key: 'type', width: '15%', 
      render: (type: number) => {
        if (type === 1) return <Tag color="blue">MÜŞTERİ</Tag>;
        if (type === 2) return <Tag color="purple">TEDARİKÇİ</Tag>;
        return <Tag color="orange">MÜŞTERİ & TEDARİKÇİ</Tag>;
      }
    },
    { 
      title: 'Şehir / İlçe', 
      key: 'location', 
      width: '15%', 
      render: (_: any, record: CompanyListDto) => {
        const city = record.cityName ? record.cityName : '-';
        const district = record.districtName ? record.districtName : '-';
        if (city === '-' && district === '-') return '-';
        return `${city} / ${district}`;
      } 
    },
    { title: 'Telefon', dataIndex: 'phone1', key: 'phone1', width: '12%' },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '8%', render: (isActive: boolean) => isActive ? <Tag color="success">Aktif</Tag> : <Tag color="error">Pasif</Tag> },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '13%',
      render: (_: any, record: CompanyListDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)} />
          <Popconfirm title="Bu cari kartı silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={5}>
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
          <Col span={9}>
            <Input.Search 
              placeholder="Firma Adı Ara... (En az 3 karakter)" 
              value={searchText} 
              onChange={e => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }} 
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchCompanies(1, pageSize, value, filterType, viewMode);
              }}
              allowClear 
              enterButton
            />
          </Col>
          <Col span={4}>
            <Select 
              placeholder="Tüm Tipler" 
              value={filterType} 
              onChange={val => { 
                setFilterType(val); 
                setCurrentPage(1); 
              }} 
              style={{ width: '100%' }} 
              allowClear
            >
              <Option value={1}>Müşteriler</Option>
              <Option value={2}>Tedarikçiler</Option>
              <Option value={3}>Her İkisi</Option>
            </Select>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchCompanies(currentPage, pageSize, searchText, filterType, viewMode)}>Yenile</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Cari Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Cari_Kartlar"
        tableTitle="Cari Kartlar (Müşteri & Tedarikçiler)"
        titleIcon={<BankOutlined />}
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
        exportExcelUrl={`/Company/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/Company/export/pdf${getExportQueryString()}`}
      />

      <Drawer
        title={editingId ? 'Cari Kart Düzenle' : 'Yeni Cari Kart Oluştur'}
        width={800}
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
                if (originalData) form.setFieldsValue(originalData);
              }}>
                Geri Al
              </Button>
            )}
            <Button type="primary" onClick={handleSave} loading={formLoading}>Kaydet</Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} disabled={formLoading}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Genel Bilgiler" key="1" forceRender={true}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item 
                    name="code" 
                    label="Cari Kodu"
                    rules={[{ required: true, message: 'Zorunlu' }]}
                  >
                    <Input 
                      disabled={!isCodeManualAllowed}
                      placeholder="Örn: MUSTERI_001"
                      onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })} 
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="type" label="Firma Tipi" rules={[{ required: true }]}>
                    <Select><Option value={1}>Müşteri (Alıcı)</Option><Option value={2}>Tedarikçi (Satıcı)</Option><Option value={3}>Hem Müşteri Hem Tedarikçi</Option></Select>
                  </Form.Item>
                </Col>
                <Col span={8}><Form.Item name="isActive" label="Durum" valuePropName="checked"><Switch checkedChildren="Aktif" unCheckedChildren="Pasif" /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={16}><Form.Item name="name" label="Firma/Şahıs Adı" rules={[{ required: true, message: 'Zorunlu' }]}><Input placeholder="Tam Unvan" /></Form.Item></Col>
                <Col span={8}><Form.Item name="shortName" label="Kısa Ad"><Input /></Form.Item></Col>
              </Row>
              <Form.Item name="description" label="Açıklama"><Input.TextArea rows={2} /></Form.Item>
            </TabPane>
            <TabPane tab="İletişim & Lokasyon" key="2" forceRender={true}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="cityId" label="Şehir" rules={[{ required: true, message: 'Lütfen şehir seçiniz' }]}>
                    <Select showSearch allowClear optionFilterProp="children" filterOption={filterOptionTurkish} onChange={handleCityChange} placeholder="Seçin">
                      {cities.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="districtId" label="İlçe" rules={[{ required: true, message: 'Lütfen ilçe seçiniz' }]}>
                    <Select showSearch allowClear optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="Seçin" disabled={districts.length === 0}>
                      {districts.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="Sokak / Mahalle (Açık Adres)" extra={<span style={{ fontSize: '12px', color: '#8c8c8c' }}><InfoCircleOutlined style={{ marginRight: 4 }} /> Şehir/İlçe bilgisini buraya tekrar YAZMAYINIZ.</span>}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="primaryContactPerson" label="Yetkili"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="phone1" label="Telefon 1" rules={[{ pattern: /^[+0-9\s\-()]+$/, message: 'Geçersiz' }]}><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="phone2" label="Telefon 2" rules={[{ pattern: /^[+0-9\s\-()]+$/, message: 'Geçersiz' }]}><Input /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="email" label="E-Posta" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="website" label="Web Sitesi"><Input /></Form.Item></Col>
              </Row>
            </TabPane>
            <TabPane tab="Resmi & Finans" key="3" forceRender={true}>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="taxOffice" label="Vergi Dairesi"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="taxNumber" label="Vergi / TC No"><Input maxLength={11} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="isEInvoiceUser" label="e-Fatura" valuePropName="checked"><Switch onChange={setIsEInvoiceUser} /></Form.Item></Col>
                <Col span={16}><Form.Item name="eInvoiceAlias" label="Posta Kutusu (URN)"><Input disabled={!isEInvoiceUser} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="paymentTermDays" label="Vade (Gün)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="creditLimit" label="Kredi Limiti (TL)"><InputNumber min={0} style={{ width: '100%' }} formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                <Col span={8}><Form.Item name="defaultCurrency" label="Döviz"><Select><Option value="TRY">TRY</Option><Option value="USD">USD</Option><Option value="EUR">EUR</Option></Select></Form.Item></Col>
              </Row>
              <Form.Item name="gLCode" label="Muhasebe Kodu"><Input placeholder="120.01..." /></Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Drawer>
    </>
  );
};

export default CariKartlar;