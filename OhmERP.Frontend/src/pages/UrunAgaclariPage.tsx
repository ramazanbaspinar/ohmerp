import React, { useEffect, useState } from 'react';
import { 
  Button, Card, Form, Input, Select, Switch, Space, Row, Col, Tabs, Drawer, message, Popconfirm, Checkbox, Modal, Tag, Typography, Descriptions, Steps, Divider, Radio 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, AppstoreAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEnterpriseTabs } from '../hooks/useEnterpriseTabs';

import { OhmTable } from '../components/OhmTable';
import OhmImageUpload from '../components/OhmImageUpload';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { productService } from '../services/productService';
import type { ProductDto } from '../services/productService';
import api from '../services/api';

const formatNum = (num: any) => {
  if (num === null || num === undefined || num === '') return '-';
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num));
};

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;
const { Step } = Steps;

const UrunAgaclariPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductDto | null>(null);
  const [originalRecord, setOriginalRecord] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [appliedSearchText, setAppliedSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  
  useEffect(() => {
    if (searchText.length === 0 || searchText.length >= 3) {
      const timer = setTimeout(() => setAppliedSearchText(searchText), 300);
      return () => clearTimeout(timer);
    }
  }, [searchText]);
  
  const handleQuickView = async (record: ProductDto) => {
    try {
      setLoading(true);
      const detailRecord = await productService.getById(record.id);
      setQuickViewProduct(detailRecord);
      setQuickViewVisible(true);
    } catch (error) {
      message.error('Ürün detayları yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [voltParams, setVoltParams] = useState<any[]>([]);
  const [wattParams, setWattParams] = useState<any[]>([]);
  const [isMixedSand, setIsMixedSand] = useState(false);
  const [hasInnerProduct, setHasInnerProduct] = useState(false);
  const [isCodeManualAllowed, setIsCodeManualAllowed] = useState(false);
  const { activeTabKey, setActiveTabKey, resetTabs, renderTabLabel } = useEnterpriseTabs('1');
  const voltId = Form.useWatch('voltParameterId', form);
  const wattId = Form.useWatch('wattParameterId', form);
  const innerVoltId = Form.useWatch(['innerDetail', 'innerVoltParameterId'], form);
  const innerWattId = Form.useWatch(['innerDetail', 'innerWattParameterId'], form);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      message.error("Ürünler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [compRes, itemRes, wcRes, tpRes] = await Promise.all([
        api.get('/Company?pageSize=1000'),
        api.get('/Item?pageSize=2000'),
        api.get('/WorkCenters?pageSize=1000'),
        api.get('/TechnicalParameter?pageSize=1000')
      ]);
      setCompanies(compRes.data?.items || compRes.data || []);
      setItems(itemRes.data?.items || itemRes.data || []);
      setWorkCenters(wcRes.data?.items || wcRes.data || []);
      
      const tpData = tpRes.data?.items || tpRes.data || [];
      const volts = tpData.filter((x: any) => x.parameterType === 1);
      const watts = tpData.filter((x: any) => x.parameterType === 2);
      
      setVoltParams(volts.length > 0 ? volts : tpData);
      setWattParams(watts.length > 0 ? watts : tpData);
    } catch (error) {
      console.error("Lookups fetch error:", error);
    }
  };
  const calculateOhm = (vId?: string, wId?: string) => {
    const volt = voltParams.find(x => x.id === vId)?.numericValue;
    const watt = wattParams.find(x => x.id === wId)?.numericValue;
    if (volt && watt && watt > 0) {
      return Number((((volt * volt) / watt) * 1.1).toFixed(1));
    }
    return 0;
  };

  useEffect(() => {
    if (drawerVisible) {
      const ohm = calculateOhm(voltId, wattId);
      form.setFieldValue('ohmValue', ohm);
    }
  }, [voltId, wattId, voltParams, wattParams, drawerVisible]);

  useEffect(() => {
    if (drawerVisible && hasInnerProduct) {
      const ohm = calculateOhm(innerVoltId, innerWattId);
      form.setFieldValue(['innerDetail', 'innerOhmValue'], ohm);
    }
  }, [innerVoltId, innerWattId, voltParams, wattParams, drawerVisible, hasInnerProduct]);

  
  const handleCloseDrawer = () => {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: 'Kaydedilmemiş Değişiklikler',
        content: 'Formda kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?',
        okText: 'Evet, Çık',
        cancelText: 'Hayır, Kal',
        onOk: () => {
          setDrawerVisible(false);
        }
      });
    } else {
      setDrawerVisible(false);
      form.resetFields();
    }
  };

  const handleOpenDrawer = async (record?: ProductDto) => {
    form.resetFields();
    resetTabs();
    if (record) {
      setIsEdit(true);
      setCurrentId(record.id);
      
      try {
        setLoading(true);
        const detailRecord = await productService.getById(record.id);
        
        setIsMixedSand(detailRecord.isMixedSand);
        setHasInnerProduct(!!detailRecord.innerDetail);
        
        const formData = {
          ...detailRecord,
          images: detailRecord.images?.map((i: any) => i.imagePath),
          hasInnerProduct: !!detailRecord.innerDetail
        };
        form.setFieldsValue(formData);
        setOriginalRecord(formData);
        setIsCodeManualAllowed(false);
      } catch (error) {
        message.error('Ürün detayları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    } else {
      setIsEdit(false);
      setCurrentId(null);
      setIsMixedSand(false);
      setHasInnerProduct(false);
      try {
        const fetchRes = await api.get('/Numerator/PreviewNextCode/6');
        const initialNewRecord = {
          code: fetchRes.data.nextCode,
          isActive: true,
          isMixedSand: false,
          hasInnerProduct: false,
          plug1Qty: 2,
          socket1Qty: 1,
          isOvened: 'Hayır',
          marking: 'Markasız',
          packageType: 'Standart',
          innerDetail: { innerPlug1Qty: 2, innerSocket1Qty: 1, innerIsMixedSand: false, innerIsOvened: 'Hayır', innerMarking: 'Markasız', innerPackageType: 'Standart' }
        };
        form.setFieldsValue(initialNewRecord);
        setOriginalRecord(initialNewRecord);
        setIsCodeManualAllowed(fetchRes.data.isManualEntryAllowed);
      } catch {
        const fallbackRecord = {
          code: '',
          isActive: true,
          isMixedSand: false,
          hasInnerProduct: false,
          plug1Qty: 2,
          socket1Qty: 1,
          isOvened: 'Hayır',
          marking: 'Markasız',
          packageType: 'Standart',
          innerDetail: { innerPlug1Qty: 2, innerSocket1Qty: 1, innerIsMixedSand: false, innerIsOvened: 'Hayır', innerMarking: 'Markasız', innerPackageType: 'Standart' }
        };
        form.setFieldsValue(fallbackRecord);
        setOriginalRecord(fallbackRecord);
        setIsCodeManualAllowed(false);
      }
    }
    setDrawerVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!hasInnerProduct || !values.hasInnerProduct) {
        values.innerDetail = null;
        values.hasInnerProduct = false;
      }
      if (values.images && Array.isArray(values.images)) {
        values.images = values.images.map((data: string, idx: number) => {
          const isBase64 = data.startsWith('data:image');
          return {
            imageData: isBase64 ? data : '',
            imagePath: isBase64 ? null : data,
            sequenceOrder: idx + 1
          };
        });
      } else {
        values.images = [];
      }

      setLoading(true);
      if (isEdit && currentId) {
        await productService.update(currentId, { ...values, id: currentId });
        message.success("Ürün başarıyla güncellendi.");
      } else {
        await productService.create(values);
        message.success("Ürün başarıyla oluşturuldu.");
      }
      setDrawerVisible(false);
      fetchData();
    } catch (error: any) {
      if (error.errorFields && error.errorFields.length > 0) {
        message.warning("Lütfen zorunlu alanları kontrol ediniz.");
        const firstErrorField = error.errorFields[0].name;
        const fieldName = Array.isArray(firstErrorField) ? firstErrorField[0] : firstErrorField;
        let targetTab = '1';
        if (fieldName === 'innerDetail') targetTab = '2';
        else if (fieldName === 'operations') targetTab = '3';
        if (activeTabKey !== targetTab) {
           setActiveTabKey(targetTab);
        }
        return;
      }
      message.error(error?.response?.data?.message || "Kayıt işlemi sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await productService.delete(id);
      message.success("Ürün silindi.");
      fetchData();
    } catch (error) {
      message.error("Silme işlemi başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Firma (Müşteri)', key: 'firmName', sorter: (a: ProductDto, b: ProductDto) => { const fA = companies.find(c => c.id === a.firmId)?.name || ''; const fB = companies.find(c => c.id === b.firmId)?.name || ''; return fA.localeCompare(fB); }, render: (_: any, record: ProductDto) => companies.find(c => c.id === record.firmId)?.name || '-' },
    { title: 'Ürün Kodu', dataIndex: 'code', key: 'code', sorter: (a: ProductDto, b: ProductDto) => a.code?.localeCompare(b.code || '') || 0 },
    { title: 'Ürün Adı', dataIndex: 'name', key: 'name', sorter: (a: ProductDto, b: ProductDto) => a.name?.localeCompare(b.name || '') || 0 },
    { title: 'Volt', key: 'volt', render: (_: any, record: ProductDto) => voltParams.find(v => v.id === record.voltParameterId)?.numericValue ? `${voltParams.find(v => v.id === record.voltParameterId)?.numericValue}V` : '-' },
    { title: 'Watt', key: 'watt', render: (_: any, record: ProductDto) => wattParams.find(w => w.id === record.wattParameterId)?.numericValue ? `${wattParams.find(w => w.id === record.wattParameterId)?.numericValue}W` : '-' },
    { title: 'Boru Boyu (mm)', key: 'pipeLength', render: (_: any, record: ProductDto) => formatNum(record.pipeLength) },
    { title: 'Haddeli Boy (mm)', key: 'rolledLength', render: (_: any, record: ProductDto) => record.rolledLength ? formatNum(record.rolledLength) : '-' },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? 'Aktif' : 'Pasif'}</Tag> },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: ProductDto) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleQuickView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  
  const handleSequenceChange = (index: number, newSeq: number | null, isInner: boolean) => {
    if (!newSeq) return;
    const ops = form.getFieldValue('operations') || [];
    const updatedOps = [...ops];
    
    const conflictIndex = updatedOps.findIndex((o, i) => i !== index && o?.isInnerProductRoute === isInner && o?.sequenceOrder === newSeq);
    
    if (conflictIndex !== -1) {
      for (let i = 0; i < updatedOps.length; i++) {
        if (i !== index && updatedOps[i]?.isInnerProductRoute === isInner && updatedOps[i]?.sequenceOrder >= newSeq) {
          updatedOps[i] = { ...updatedOps[i], sequenceOrder: updatedOps[i].sequenceOrder + 1 };
        }
      }
    }
    
    updatedOps.sort((a, b) => {
      if (a.isInnerProductRoute !== b.isInnerProductRoute) {
         return a.isInnerProductRoute ? 1 : -1;
      }
      return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
    });

    form.setFieldValue('operations', updatedOps);
  };

  const filterItemsByCategory = (categoryCode: string) => {
    return items.filter(i => i.categoryCode === categoryCode);
  };

  const filteredData = products.filter(p => {
    if (appliedSearchText) {
      const lowerSearch = appliedSearchText.toLowerCase();
      const cName = companies.find(c => c.id === p.firmId)?.name?.toLowerCase() || '';
      if (!p.code.toLowerCase().includes(lowerSearch) && !p.name.toLowerCase().includes(lowerSearch) && !cName.includes(lowerSearch)) {
        return false;
      }
    }

    if (filterStatus === 'active' && !p.isActive) return false;
    if (filterStatus === 'passive' && p.isActive) return false;

    return true;
  });

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Space size="middle">
              <Input.Search 
                placeholder="Ara (En az 3 karakter)..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(value) => setAppliedSearchText(value)}
                allowClear
                enterButton
                style={{ width: 300 }}
              />
              <Radio.Group 
                value={filterStatus} 
                onChange={(e: any) => setFilterStatus(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="all">Tümü</Radio.Button>
                <Radio.Button value="active">Aktifler</Radio.Button>
                <Radio.Button value="passive">Pasifler</Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>Yeni Ürün Ekle</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 16 }}>
        <OhmTable
          tableName="UrunAgaclari"
          tableTitle="Ürün Ağaçları"
          titleIcon={<AppstoreAddOutlined />}
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onDoubleClick: () => handleQuickView(record),
            style: { cursor: 'pointer' }
          })}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} arası gösteriliyor. Toplam: ${total} kayıt`
          }}
        />

        <Drawer
          title={isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          width={1000}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          extra={
            <Space>
              <Button danger onClick={() => {
                if (isEdit && originalRecord) {
                  form.setFieldsValue(originalRecord);
                  setIsMixedSand(originalRecord.isMixedSand || false);
                  setHasInnerProduct(originalRecord.hasInnerProduct || false);
                } else {
                  form.resetFields();
                  setIsMixedSand(false);
                  setHasInnerProduct(false);
                }
              }}>Geri Al</Button>
              <Button onClick={() => handleCloseDrawer()}>İptal</Button>
              <Button type="primary" onClick={handleSave} loading={loading}>Kaydet</Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical">
            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
              <TabPane tab={renderTabLabel("Dış Ürün Bilgileri", "1")} key="1" forceRender>
                <Row gutter={16}>
                  <Col span={24}>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="code" label="Ürün Kodu">
                          <Input disabled={!isCodeManualAllowed} placeholder="Örn: URN-0001" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="name" label="Ürün Adı" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="firmId" label="Firma" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="isActive" label="Durum" valuePropName="checked">
                          <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="ohmValue" label="Ohm Değeri">
                          <OhmInputNumber precision={2} style={{ width: '100%', color: 'blue', fontWeight: 'bold' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="voltParameterId" label="Volt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {voltParams.map(v => <Option key={v.id} value={v.id}>{v.numericValue}V</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="wattParameterId" label="Watt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {wattParams.map(w => <Option key={w.id} value={w.id}>{w.numericValue}W</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Card title="Ürün Resim Galerisi" size="small" style={{ marginTop: 16 }}>
                  <Form.Item name="images" style={{ marginBottom: 0 }}>
                    <OhmImageUpload maxCount={20} />
                  </Form.Item>
                </Card>

                <Card title="Ürün Teknik Detayları" size="small" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="pipeLength" label="Boru Boyu (mm)" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <OhmInputNumber precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="rolledLength" label="Haddeli Boy (mm)">
                        <OhmInputNumber precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="wireId" label="Tel" rules={[{ required: true }]} extra={<Form.Item name="isDoubleWound" valuePropName="checked" noStyle><Checkbox>Çift Sarım Yapılacak</Checkbox></Form.Item>}>
                        <Select showSearch optionFilterProp="children">
                          {filterItemsByCategory("TEL").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="sheetId" label="Sac" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                          {filterItemsByCategory("SAC").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="gasId" label="Kaynak Gazı" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                          {filterItemsByCategory("GAZ").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="pinId" label="Pim" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                          {filterItemsByCategory("PIM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="plug1Id" label="1. Tapa" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                          {filterItemsByCategory("TAPA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="plug1Qty" label="Adet" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="plug2Id" label="2. Tapa">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("TAPA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="plug2Qty" label="Adet" dependencies={['plug2Id']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('plug2Id'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="socket1Id" label="1. Soket" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("SOKET").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="socket1Qty" label="Adet" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="socket2Id" label="2. Soket">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("SOKET").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="socket2Qty" label="Adet" dependencies={['socket2Id']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('socket2Id'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="isOvened" label="Fırınlanma" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <Select placeholder="Seçiniz" allowClear>
                          <Option value="Fırınlı">Fırınlı</Option>
                          <Option value="Fırınsız">Fırınsız</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="flangeId" label="Flanş">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("FLANS").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="flangeQty" label="Adet" dependencies={['flangeId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('flangeId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="clampId" label="Kelepçe">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("KELEPCE").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="clampQty" label="Adet" dependencies={['clampId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('clampId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="marking" label="Markalama" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <Select placeholder="Seçiniz" allowClear>
                          <Option value="Var">Var</Option>
                          <Option value="Yok">Yok</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="omegaId" label="Omega">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("OMEGA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="omegaQty" label="Adet" dependencies={['omegaId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('omegaId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="connectionSheetId" label="Bağlantı Sacı">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("BAGLANTISACI").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="connectionSheetQty" label="Adet" dependencies={['connectionSheetId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('connectionSheetId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="packageType" label="Paketleme Türü" rules={[{ required: true, message: 'Zorunlu' }]}>
                        <Input placeholder="Örn: Kutu, Palet" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="connectionWireId" label="Bağlantı Teli">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("BAGLANTITELI").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="connectionWireQty" label="Adet" dependencies={['connectionWireId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('connectionWireId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="connectionWireLength" label="Bağlantı Teli Boyu (mm)" dependencies={['connectionWireId']} rules={[({ getFieldValue }) => ({ required: !!getFieldValue('connectionWireId'), message: 'Zorunlu' })]}>
                        <OhmInputNumber precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="description" label="Açıklama">
                        <Input.TextArea rows={2} maxLength={500} showCount />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Kum Bilgileri" size="small" style={{ marginTop: 16 }}>
                  <Form.Item name="isMixedSand" valuePropName="checked">
                    <Checkbox onChange={(e) => setIsMixedSand(e.target.checked)}>Karışık Kum</Checkbox>
                  </Form.Item>
                  {isMixedSand ? (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="mixedSand1Id" label="1. Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                             <Select showSearch optionFilterProp="children" allowClear>
                               {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                             </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="mixedSand1Ratio" label="1. Kum Oranı (%)" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <OhmInputNumber precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="mixedSand2Id" label="2. Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                             <Select showSearch optionFilterProp="children" allowClear>
                               {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                             </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="mixedSand2Ratio" label="2. Kum Oranı (%)" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <OhmInputNumber precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                      <Form.Item name="sandId" label="Tek Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                         <Select showSearch optionFilterProp="children" allowClear>
                           {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                         </Select>
                      </Form.Item>
                    </div>
                  )}
                </Card>
              </TabPane>

              <TabPane tab={renderTabLabel("İç Ürün Bilgileri", "2")} key="2" forceRender>
                <Form.Item name="hasInnerProduct" valuePropName="checked">
                  <Checkbox checked={hasInnerProduct} onChange={(e) => setHasInnerProduct(e.target.checked)}>İç Ürün Var</Checkbox>
                </Form.Item>
                {hasInnerProduct && (
                  <div style={{ animation: 'fadeIn 0.5s' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name={['innerDetail', 'innerVoltParameterId']} label="İç Volt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {voltParams.map(v => <Option key={v.id} value={v.id}>{v.numericValue}V</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name={['innerDetail', 'innerWattParameterId']} label="İç Watt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {wattParams.map(w => <Option key={w.id} value={w.id}>{w.numericValue}W</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name={['innerDetail', 'innerOhmValue']} label="İç Ohm Değeri">
                          <OhmInputNumber precision={2} style={{ width: '100%', color: 'blue', fontWeight: 'bold' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Card title="İç Ürün Teknik Detayları" size="small" style={{ marginTop: 16 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerPipeLength']} label="İç Boru Boyu (mm)" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <OhmInputNumber precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerRolledLength']} label="İç Haddeli Boy (mm)">
                            <OhmInputNumber precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerWireId']} label="İç Tel" rules={[{ required: true }]} extra={<Form.Item name={['innerDetail', 'innerIsDoubleWound']} valuePropName="checked" noStyle><Checkbox>Çift Sarım Yapılacak</Checkbox></Form.Item>}>
                            <Select showSearch optionFilterProp="children">
                              {filterItemsByCategory("TEL").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerSheetId']} label="İç Sac" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children">
                              {filterItemsByCategory("SAC").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerGasId']} label="İç Kaynak Gazı" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children">
                              {filterItemsByCategory("GAZ").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerPinId']} label="İç Pim" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <Select showSearch optionFilterProp="children" allowClear>
                              {filterItemsByCategory("PIM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={['innerDetail', 'innerPlug1Id']} label="İç 1. Tapa" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children">
                              {filterItemsByCategory("TAPA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item name={['innerDetail', 'innerPlug1Qty']} label="Adet" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <OhmInputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={['innerDetail', 'innerPlug2Id']} label="İç 2. Tapa">
                            <Select showSearch optionFilterProp="children" allowClear>
                              {filterItemsByCategory("TAPA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item name={['innerDetail', 'innerPlug2Qty']} label="Adet" dependencies={[['innerDetail', 'innerPlug2Id']]} rules={[({ getFieldValue }) => ({ required: !!getFieldValue(['innerDetail', 'innerPlug2Id']), message: 'Zorunlu' })]}>
                            <OhmInputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item name={['innerDetail', 'innerSocket1Id']} label="İç 1. Soket" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <Select showSearch optionFilterProp="children" allowClear>
                              {filterItemsByCategory("SOKET").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item name={['innerDetail', 'innerSocket1Qty']} label="Adet" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <OhmInputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={['innerDetail', 'innerSocket2Id']} label="İç 2. Soket">
                            <Select showSearch optionFilterProp="children" allowClear>
                              {filterItemsByCategory("SOKET").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item name={['innerDetail', 'innerSocket2Qty']} label="Adet" dependencies={[['innerDetail', 'innerSocket2Id']]} rules={[({ getFieldValue }) => ({ required: !!getFieldValue(['innerDetail', 'innerSocket2Id']), message: 'Zorunlu' })]}>
                            <OhmInputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerIsOvened']} label="İç Fırınlanma" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <Select placeholder="Seçiniz" allowClear>
                              <Option value="Fırınlı">Fırınlı</Option>
                              <Option value="Fırınsız">Fırınsız</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name={['innerDetail', 'innerMarking']} label="İç Markalama" rules={[{ required: true, message: 'Zorunlu' }]}>
                            <Select placeholder="Seçiniz" allowClear>
                              <Option value="Var">Var</Option>
                              <Option value="Yok">Yok</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    <Card title="İç Kum Bilgileri" size="small" style={{ marginTop: 16 }}>
                      <Form.Item name={['innerDetail', 'innerIsMixedSand']} valuePropName="checked">
                        <Checkbox>Karışık Kum</Checkbox>
                      </Form.Item>
                      <Form.Item noStyle dependencies={[['innerDetail', 'innerIsMixedSand']]}>
                        {({ getFieldValue }) => {
                          const innerIsMixedSand = getFieldValue(['innerDetail', 'innerIsMixedSand']);
                          return (
                            <>
                                {innerIsMixedSand ? (
                                  <div style={{ animation: 'fadeIn 0.5s' }}>
                                    <Row gutter={16}>
                                      <Col span={12}>
                                        <Form.Item name={['innerDetail', 'innerMixedSand1Id']} label="İç 1. Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <Select showSearch optionFilterProp="children" allowClear>
                                        {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name={['innerDetail', 'innerMixedSand1Ratio']} label="İç 1. Kum Oranı (%)" rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <OhmInputNumber precision={2} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name={['innerDetail', 'innerMixedSand2Id']} label="İç 2. Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <Select showSearch optionFilterProp="children" allowClear>
                                        {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item name={['innerDetail', 'innerMixedSand2Ratio']} label="İç 2. Kum Oranı (%)" rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <OhmInputNumber precision={2} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                    </Row>
                                  </div>
                                ) : (
                                  <div style={{ animation: 'fadeIn 0.5s' }}>
                                    <Form.Item name={['innerDetail', 'innerSandId']} label="İç Tek Kum" rules={[{ required: true, message: 'Zorunlu' }]}>
                                  <Select showSearch optionFilterProp="children" allowClear>
                                    {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                  </Select>
                                    </Form.Item>
                                  </div>
                                )}
                              </>
                          );
                        }}
                      </Form.Item>
                    </Card>
                  </div>
                )}
              </TabPane>

              <TabPane tab={renderTabLabel("Üretim Rotası", "3")} key="3" forceRender>
                <Row gutter={16}>
                  <Col span={hasInnerProduct ? 12 : 24}>
                    <Card title="Dış Ürün Rotası" size="small">
                      <Form.List name="operations">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => {
                              const isInner = form.getFieldValue(['operations', name, 'isInnerProductRoute']);
                              if (isInner) return null;
                              return (
                                <Row gutter={8} key={key} style={{ marginBottom: 8 }}>
                                  <Col span={3}>
                                    <Form.Item {...restField} name={[name, 'sequenceOrder']} noStyle>
                                      <OhmInputNumber min={1} placeholder="Sıra" style={{ width: '100%' }} onChange={(val) => handleSequenceChange(name, val as number, isInner)} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item {...restField} name={[name, 'workCenterId']} noStyle rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <Select showSearch optionFilterProp="children" placeholder="Makine (İş Merkezi)" style={{ width: '100%' }}>
                                        {workCenters.map(wc => <Option key={wc.id} value={wc.id}>{wc.name}</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={6}>
                                    <Form.Item {...restField} name={[name, 'operationTimeMinutes']} noStyle rules={[{ required: true, message: 'Zorunlu' }]}>
                                      <OhmInputNumber placeholder="Süre (Dk)" style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={3}>
                                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                  </Col>
                                </Row>
                              );
                            })}
                            <Button type="dashed" onClick={() => {
                              const ops = form.getFieldValue('operations') || [];
                              const outerOps = ops.filter((o: any) => !o.isInnerProductRoute);
                              const maxSeq = outerOps.length > 0 ? Math.max(...outerOps.map((o: any) => o.sequenceOrder || 0)) : 0;
                              add({ isInnerProductRoute: false, sequenceOrder: maxSeq + 1 });
                            }} block icon={<PlusOutlined />}>
                              Rota Satırı Ekle
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  </Col>
                  {hasInnerProduct && (
                    <Col span={12}>
                      <Card title="İç Ürün Rotası" size="small">
                        <Form.List name="operations">
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map(({ key, name, ...restField }) => {
                                const isInner = form.getFieldValue(['operations', name, 'isInnerProductRoute']);
                                if (!isInner) return null;
                                return (
                                  <Row gutter={8} key={key} style={{ marginBottom: 8 }}>
                                    <Col span={3}>
                                      <Form.Item {...restField} name={[name, 'sequenceOrder']} noStyle>
                                        <OhmInputNumber min={1} placeholder="Sıra" style={{ width: '100%' }} onChange={(val) => handleSequenceChange(name, val as number, isInner)} />
                                      </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                      <Form.Item {...restField} name={[name, 'workCenterId']} noStyle rules={[{ required: true, message: 'Zorunlu' }]}>
                                        <Select showSearch optionFilterProp="children" placeholder="Makine (İş Merkezi)" style={{ width: '100%' }}>
                                          {workCenters.map(wc => <Option key={wc.id} value={wc.id}>{wc.name}</Option>)}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                      <Form.Item {...restField} name={[name, 'operationTimeMinutes']} noStyle rules={[{ required: true, message: 'Zorunlu' }]}>
                                        <OhmInputNumber placeholder="Süre (Dk)" style={{ width: '100%' }} />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                    </Col>
                                  </Row>
                                );
                              })}
                              <Button type="dashed" onClick={() => {
                                const ops = form.getFieldValue('operations') || [];
                                const innerOps = ops.filter((o: any) => o.isInnerProductRoute);
                                const maxSeq = innerOps.length > 0 ? Math.max(...innerOps.map((o: any) => o.sequenceOrder || 0)) : 0;
                                add({ isInnerProductRoute: true, sequenceOrder: maxSeq + 1 });
                              }} block icon={<PlusOutlined />}>
                                İç Rota Satırı Ekle
                              </Button>
                            </>
                          )}
                        </Form.List>
                      </Card>
                      </Col>
                    )}
                  </Row>
              </TabPane>
            </Tabs>
          </Form>
        </Drawer>

      <Modal
        title={<div style={{ fontSize: 20, fontWeight: 'bold', borderBottom: '2px solid #1890ff', paddingBottom: 8, marginBottom: 16 }}>📋 Ürün Ağacı</div>}
        width={1000}
        open={quickViewVisible}
        onCancel={() => setQuickViewVisible(false)}
        footer={<Button type="primary" size="large" onClick={() => setQuickViewVisible(false)}>Kapat</Button>}
        centered
        style={{ top: 20 }}
        styles={{ body: { padding: '12px 24px', maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {quickViewProduct && (
          <div>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card size="small" type="inner" title={<span style={{ color: '#1890ff', fontSize: 16 }}>Genel Bilgiler</span>} styles={{ header: { background: '#e6f7ff', textAlign: 'center' } }}>
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Ürün Kodu"><Text strong>{quickViewProduct.code}</Text></Descriptions.Item>
                    <Descriptions.Item label="Ürün Adı"><Text strong>{quickViewProduct.name}</Text></Descriptions.Item>
                    <Descriptions.Item label="Firma (Müşteri)"><Text strong>{companies.find(c => c.id === quickViewProduct.firmId)?.name || '-'}</Text></Descriptions.Item>
                    <Descriptions.Item label="Ohm Değeri"><Text type="success" strong>{formatNum(quickViewProduct.ohmValue)} Ω</Text></Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={quickViewProduct.innerDetail ? 12 : 24}>
                 <Card size="small" type="inner" title={<span style={{ color: '#fa8c16', fontSize: 16 }}>Dış Ürün Teknik Reçetesi</span>} styles={{ header: { background: '#fff7e6' } }}>
                    <Descriptions column={1} size="small" layout="horizontal" bordered>
                       <Descriptions.Item label="Volt / Watt"><Text strong>{voltParams.find(v => v.id === quickViewProduct.voltParameterId)?.numericValue}V / {wattParams.find(w => w.id === quickViewProduct.wattParameterId)?.numericValue}W</Text></Descriptions.Item>
                       <Descriptions.Item label="Boru Boyu">{formatNum(quickViewProduct.pipeLength)} mm</Descriptions.Item>
                       <Descriptions.Item label="Haddeli Boy">{quickViewProduct.rolledLength ? `${formatNum(quickViewProduct.rolledLength)} mm` : '-'}</Descriptions.Item>
                       <Descriptions.Item label="Tel">{items.find(x => x.id === quickViewProduct.wireId)?.name || '-'} {quickViewProduct.isDoubleWound ? <Text type="danger">(Çift Sarım)</Text> : ''}</Descriptions.Item>
                       <Descriptions.Item label="Sac">{items.find(x => x.id === quickViewProduct.sheetId)?.name || '-'}</Descriptions.Item>
                       <Descriptions.Item label="Kaynak Gazı">{items.find(x => x.id === quickViewProduct.gasId)?.name || '-'}</Descriptions.Item>
                       <Descriptions.Item label="Pim">{items.find(x => x.id === quickViewProduct.pinId)?.name || '-'}</Descriptions.Item>
                       <Descriptions.Item label="Tapalar">
                         {items.find(x => x.id === quickViewProduct.plug1Id)?.name || '-'} <Text strong>({quickViewProduct.plug1Qty} Adet)</Text>
                         {quickViewProduct.plug2Id ? <span> | {items.find(x => x.id === quickViewProduct.plug2Id)?.name} <Text strong>({quickViewProduct.plug2Qty} Adet)</Text></span> : ''}
                       </Descriptions.Item>
                       <Descriptions.Item label="Soketler">
                         {items.find(x => x.id === quickViewProduct.socket1Id)?.name || '-'} <Text strong>({quickViewProduct.socket1Qty} Adet)</Text>
                         {quickViewProduct.socket2Id ? <span> | {items.find(x => x.id === quickViewProduct.socket2Id)?.name} <Text strong>({quickViewProduct.socket2Qty} Adet)</Text></span> : ''}
                       </Descriptions.Item>
                       <Descriptions.Item label="Flanş / Kelepçe / Omega">
                         Flanş: {items.find(x => x.id === quickViewProduct.flangeId)?.name || '-'} {quickViewProduct.flangeId ? <Text strong>({quickViewProduct.flangeQty} Adet)</Text> : ''} | 
                         Kelepçe: {items.find(x => x.id === quickViewProduct.clampId)?.name || '-'} {quickViewProduct.clampId ? <Text strong>({quickViewProduct.clampQty} Adet)</Text> : ''} | 
                         Omega: {items.find(x => x.id === quickViewProduct.omegaId)?.name || '-'} {quickViewProduct.omegaId ? <Text strong>({quickViewProduct.omegaQty} Adet)</Text> : ''}
                       </Descriptions.Item>
                       <Descriptions.Item label="Bağlantı Grubu">
                         Sac: {items.find(x => x.id === quickViewProduct.connectionSheetId)?.name || '-'} {quickViewProduct.connectionSheetId ? <Text strong>({quickViewProduct.connectionSheetQty} Adet)</Text> : ''} | 
                         Tel: {items.find(x => x.id === quickViewProduct.connectionWireId)?.name || '-'} {quickViewProduct.connectionWireId ? <Text strong>({quickViewProduct.connectionWireQty} Adet / {formatNum(quickViewProduct.connectionWireLength)} mm)</Text> : ''}
                       </Descriptions.Item>
                       <Descriptions.Item label="Kum">
                         {quickViewProduct.isMixedSand ? 
                           <span>Karışık Kum: <Text strong>{items.find(x => x.id === quickViewProduct.mixedSand1Id)?.name} (%{formatNum(quickViewProduct.mixedSand1Ratio)})</Text> + <Text strong>{items.find(x => x.id === quickViewProduct.mixedSand2Id)?.name} (%{formatNum(quickViewProduct.mixedSand2Ratio)})</Text></span> 
                           : (items.find(x => x.id === quickViewProduct.sandId)?.name || '-')}
                       </Descriptions.Item>
                       <Descriptions.Item label="Son İşlemler">
                         Fırın: <Text strong>{quickViewProduct.isOvened}</Text> | 
                         Markalama: <Text strong>{quickViewProduct.marking}</Text> | 
                         Paket: <Text strong>{quickViewProduct.packageType || '-'}</Text>
                       </Descriptions.Item>
                       {quickViewProduct.description && (
                         <Descriptions.Item label="Açıklama"><Text type="secondary">{quickViewProduct.description}</Text></Descriptions.Item>
                       )}
                    </Descriptions>

                    <Divider style={{ margin: '16px 0' }}><span style={{ color: '#8c8c8c', fontSize: 14 }}>Üretim Rotası (İş Merkezleri)</span></Divider>
                    <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', maxHeight: 220, overflowY: 'auto' }}>
                      <Steps direction="vertical" size="small" current={quickViewProduct.operations?.filter(o => !o.isInnerProductRoute).length}>
                         {quickViewProduct.operations?.filter(o => !o.isInnerProductRoute).sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(o => (
                           <Step key={o.id} title={<Text strong>{workCenters.find(w => w.id === o.workCenterId)?.name || '-'}</Text>} description={<span style={{ color: '#1890ff' }}>İşlem Süresi: {o.operationTimeMinutes} Dk.</span>} />
                         ))}
                      </Steps>
                    </div>
                 </Card>
              </Col>

              {quickViewProduct.innerDetail && (
                 <Col span={12}>
                    <Card size="small" type="inner" title={<span style={{ color: '#52c41a', fontSize: 16 }}>İç Ürün Teknik Reçetesi</span>} styles={{ header: { background: '#f6ffed' } }}>
                       <Descriptions column={1} size="small" layout="horizontal" bordered>
                          <Descriptions.Item label="Volt / Watt"><Text strong>{voltParams.find(v => v.id === quickViewProduct.innerDetail.innerVoltParameterId)?.numericValue}V / {wattParams.find(w => w.id === quickViewProduct.innerDetail.innerWattParameterId)?.numericValue}W</Text></Descriptions.Item>
                          <Descriptions.Item label="Boru Boyu">{formatNum(quickViewProduct.innerDetail.innerPipeLength)} mm</Descriptions.Item>
                          <Descriptions.Item label="Haddeli Boy">{quickViewProduct.innerDetail.innerRolledLength ? `${formatNum(quickViewProduct.innerDetail.innerRolledLength)} mm` : '-'}</Descriptions.Item>
                          <Descriptions.Item label="Tel">{items.find(x => x.id === quickViewProduct.innerDetail.innerWireId)?.name || '-'} {quickViewProduct.innerDetail.innerIsDoubleWound ? <Text type="danger">(Çift Sarım)</Text> : ''}</Descriptions.Item>
                          <Descriptions.Item label="Sac">{items.find(x => x.id === quickViewProduct.innerDetail.innerSheetId)?.name || '-'}</Descriptions.Item>
                          <Descriptions.Item label="Kaynak Gazı">{items.find(x => x.id === quickViewProduct.innerDetail.innerGasId)?.name || '-'}</Descriptions.Item>
                          <Descriptions.Item label="Pim">{items.find(x => x.id === quickViewProduct.innerDetail.innerPinId)?.name || '-'}</Descriptions.Item>
                          <Descriptions.Item label="Tapalar">
                            {items.find(x => x.id === quickViewProduct.innerDetail.innerPlug1Id)?.name || '-'} <Text strong>({quickViewProduct.innerDetail.innerPlug1Qty} Adet)</Text>
                            {quickViewProduct.innerDetail.innerPlug2Id ? <span> | {items.find(x => x.id === quickViewProduct.innerDetail.innerPlug2Id)?.name} <Text strong>({quickViewProduct.innerDetail.innerPlug2Qty} Adet)</Text></span> : ''}
                          </Descriptions.Item>
                          <Descriptions.Item label="Soketler">
                            {items.find(x => x.id === quickViewProduct.innerDetail.innerSocket1Id)?.name || '-'} <Text strong>({quickViewProduct.innerDetail.innerSocket1Qty} Adet)</Text>
                            {quickViewProduct.innerDetail.innerSocket2Id ? <span> | {items.find(x => x.id === quickViewProduct.innerDetail.innerSocket2Id)?.name} <Text strong>({quickViewProduct.innerDetail.innerSocket2Qty} Adet)</Text></span> : ''}
                          </Descriptions.Item>
                          <Descriptions.Item label="Kum">
                            {quickViewProduct.innerDetail.innerIsMixedSand ? 
                              <span>Karışık Kum: <Text strong>{items.find(x => x.id === quickViewProduct.innerDetail.innerMixedSand1Id)?.name} (%{formatNum(quickViewProduct.innerDetail.innerMixedSand1Ratio)})</Text> + <Text strong>{items.find(x => x.id === quickViewProduct.innerDetail.innerMixedSand2Id)?.name} (%{formatNum(quickViewProduct.innerDetail.innerMixedSand2Ratio)})</Text></span> 
                              : (items.find(x => x.id === quickViewProduct.innerDetail.innerSandId)?.name || '-')}
                          </Descriptions.Item>
                          <Descriptions.Item label="Son İşlemler">
                            Fırın: <Text strong>{quickViewProduct.innerDetail.innerIsOvened}</Text> | Markalama: <Text strong>{quickViewProduct.innerDetail.innerMarking}</Text>
                          </Descriptions.Item>
                       </Descriptions>

                       <Divider style={{ margin: '16px 0' }}><span style={{ color: '#8c8c8c', fontSize: 14 }}>İç Ürün Üretim Rotası</span></Divider>
                       <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', maxHeight: 220, overflowY: 'auto' }}>
                         <Steps direction="vertical" size="small" current={quickViewProduct.operations?.filter(o => o.isInnerProductRoute).length}>
                            {quickViewProduct.operations?.filter(o => o.isInnerProductRoute).sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(o => (
                              <Step key={o.id} title={<Text strong>{workCenters.find(w => w.id === o.workCenterId)?.name || '-'}</Text>} description={<span style={{ color: '#1890ff' }}>İşlem Süresi: {o.operationTimeMinutes} Dk.</span>} />
                            ))}
                         </Steps>
                       </div>
                    </Card>
                 </Col>
              )}

            </Row>
          </div>
        )}
      </Modal>

      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default UrunAgaclariPage;
