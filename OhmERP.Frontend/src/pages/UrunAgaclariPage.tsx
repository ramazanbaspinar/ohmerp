import React, { useEffect, useState } from 'react';
import { 
  Button, Card, Form, Input, Select, Switch, Space, Row, Col, Tabs, Drawer, message, Popconfirm, Checkbox 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useEnterpriseTabs } from '../hooks/useEnterpriseTabs';

import { OhmTable } from '../components/OhmTable';
import OhmImageUpload from '../components/OhmImageUpload';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { productService } from '../services/productService';
import type { ProductDto } from '../services/productService';
import api from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const UrunAgaclariPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductDto | null>(null);
  
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
      if (window.confirm('Kaydedilmemiş değişiklikleriniz var! Çıkmak istediğinize emin misiniz?')) {
        setDrawerVisible(false);
      }
    } else {
      setDrawerVisible(false);
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
        
        form.setFieldsValue({
          ...detailRecord,
          images: detailRecord.images?.map((i: any) => i.imagePath),
          hasInnerProduct: !!detailRecord.innerDetail
        });
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
      form.setFieldsValue({
        code: 'Yükleniyor...',
        isActive: true,
        isMixedSand: false,
        hasInnerProduct: false,
        plug1Qty: 2,
        innerDetail: { innerPlug1Qty: 2 }
      });
      setIsCodeManualAllowed(false);
      try {
        const numRes = await api.get('/Numerator/PreviewNextCode/6');
        form.setFieldValue('code', numRes.data.nextCode);
        setIsCodeManualAllowed(numRes.data.isManualEntryAllowed);
      } catch {
        form.setFieldValue('code', '');
      }
    }
    setDrawerVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!values.hasInnerProduct) {
        values.innerDetail = null;
      }
      if (values.images && Array.isArray(values.images)) {
        values.images = values.images.map((data: string, idx: number) => {
          const isBase64 = data.startsWith('data:image');
          return {
            imageData: isBase64 ? data : null,
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
    { title: 'Ürün Kodu', dataIndex: 'code', key: 'code', sorter: true },
    { title: 'Ürün Adı', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Ohm Değeri', dataIndex: 'ohmValue', key: 'ohmValue' },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', render: (val: boolean) => (val ? 'Aktif' : 'Pasif') },
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
    
    // Check if the target sequence already exists in the same route
    const conflictIndex = updatedOps.findIndex((o, i) => i !== index && o?.isInnerProductRoute === isInner && o?.sequenceOrder === newSeq);
    
    if (conflictIndex !== -1) {
      // Shift logic: anything >= newSeq in the same route gets +1
      for (let i = 0; i < updatedOps.length; i++) {
        if (i !== index && updatedOps[i]?.isInnerProductRoute === isInner && updatedOps[i]?.sequenceOrder >= newSeq) {
          updatedOps[i] = { ...updatedOps[i], sequenceOrder: updatedOps[i].sequenceOrder + 1 };
        }
      }
    }
    
    // Sort array just to be safe
    form.setFieldValue('operations', updatedOps);
  };

  const filterItemsByCategory = (categoryCode: string) => {
    return items.filter(i => i.categoryCode === categoryCode);
  };

  return (
    <>
      <Card title="Ürün Ağaçları">
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
            Yeni Ürün Ekle
          </Button>
        </Space>
        
        <OhmTable
          columns={columns}
          dataSource={products.filter(p => p.isActive)}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Drawer
          title={isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          width={1000}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          extra={
            <Space>
              <Button danger onClick={() => form.resetFields()}>Geri Al</Button>
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
                        <OhmInputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="rolledLength" label="Haddeli Boy (mm)">
                        <OhmInputNumber style={{ width: '100%' }} />
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
                      <Form.Item name="plug2Qty" label="Adet">
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
                      <Form.Item name="socket2Qty" label="Adet">
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
                      <Form.Item name="flangeQty" label="Adet">
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
                      <Form.Item name="clampQty" label="Adet">
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
                      <Form.Item name="omegaQty" label="Adet">
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="connectionSheetId" label="Bağlantı Sacı">
                        <Select showSearch optionFilterProp="children" allowClear>
                          {filterItemsByCategory("BAGLANTI_SACI").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="connectionSheetQty" label="Adet">
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
                          {filterItemsByCategory("BAGLANTI_TELI").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="connectionWireQty" label="Adet">
                        <OhmInputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="connectionWireLength" label="Bağlantı Teli Boyu (mm)">
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
                            <OhmInputNumber style={{ width: '100%' }} />
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
                            <OhmInputNumber style={{ width: '100%' }} />
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
                            <OhmInputNumber style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['innerDetail', 'innerRolledLength']} label="İç Haddeli Boy (mm)">
                            <OhmInputNumber style={{ width: '100%' }} />
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
                          <Form.Item name={['innerDetail', 'innerPlug2Qty']} label="Adet">
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
                          <Form.Item name={['innerDetail', 'innerSocket2Qty']} label="Adet">
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
                                      <OhmInputNumber style={{ width: '100%' }} />
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
                                      <OhmInputNumber style={{ width: '100%' }} />
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
                                      <OhmInputNumber placeholder="Sıra" style={{ width: '100%' }} onChange={(val) => handleSequenceChange(name, val as number, isInner)} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item {...restField} name={[name, 'workCenterId']} noStyle>
                                      <Select placeholder="Makine (İş Merkezi)" style={{ width: '100%' }}>
                                        {workCenters.map(wc => <Option key={wc.id} value={wc.id}>{wc.name}</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={6}>
                                    <Form.Item {...restField} name={[name, 'operationTimeMinutes']} noStyle>
                                      <OhmInputNumber placeholder="Süre (Dk)" style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={3}>
                                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                  </Col>
                                </Row>
                              );
                            })}
                            <Button type="dashed" onClick={() => add({ isInnerProductRoute: false })} block icon={<PlusOutlined />}>
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
                                        <OhmInputNumber placeholder="Sıra" style={{ width: '100%' }} onChange={(val) => handleSequenceChange(name, val as number, isInner)} />
                                      </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                      <Form.Item {...restField} name={[name, 'workCenterId']} noStyle>
                                        <Select placeholder="Makine (İş Merkezi)" style={{ width: '100%' }}>
                                          {workCenters.map(wc => <Option key={wc.id} value={wc.id}>{wc.name}</Option>)}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                      <Form.Item {...restField} name={[name, 'operationTimeMinutes']} noStyle>
                                        <OhmInputNumber placeholder="Süre (Dk)" style={{ width: '100%' }} />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                    </Col>
                                  </Row>
                                );
                              })}
                              <Button type="dashed" onClick={() => add({ isInnerProductRoute: true })} block icon={<PlusOutlined />}>
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

      <Drawer
        title="Hızlı Bakış - Ürün Özeti"
        width={700}
        onClose={() => setQuickViewVisible(false)}
        open={quickViewVisible}
      >
        {quickViewProduct && (
          <div style={{ padding: 16 }}>
            <h3>Temel Bilgiler</h3>
            <p><strong>Kodu:</strong> {quickViewProduct.code}</p>
            <p><strong>Adı:</strong> {quickViewProduct.name}</p>
            <p><strong>Ohm:</strong> {quickViewProduct.ohmValue}</p>
            <p><strong>Durum:</strong> {quickViewProduct.isActive ? 'Aktif' : 'Pasif'}</p>
            
            <h3 style={{ marginTop: 24 }}>Kullanılan Malzemeler</h3>
            <ul>
              <li><strong>Tel:</strong> {items.find(x => x.id === quickViewProduct.wireId)?.name || '-'}</li>
              <li><strong>Sac:</strong> {items.find(x => x.id === quickViewProduct.sheetId)?.name || '-'}</li>
              <li><strong>Kum:</strong> {quickViewProduct.isMixedSand ? 'Karışık Kum' : (items.find(x => x.id === quickViewProduct.sandId)?.name || '-')}</li>
            </ul>

            {quickViewProduct.innerDetail && (
              <>
                <h3 style={{ marginTop: 24 }}>İç Ürün Malzemeleri</h3>
                <ul>
                  <li><strong>İç Tel:</strong> {items.find(x => x.id === quickViewProduct.innerDetail?.innerWireId)?.name || '-'}</li>
                  <li><strong>İç Sac:</strong> {items.find(x => x.id === quickViewProduct.innerDetail?.innerSheetId)?.name || '-'}</li>
                  <li><strong>İç Kum:</strong> {quickViewProduct.innerDetail?.innerIsMixedSand ? 'Karışık Kum' : (items.find(x => x.id === quickViewProduct.innerDetail?.innerSandId)?.name || '-')}</li>
                </ul>
              </>
            )}

            <h3 style={{ marginTop: 24 }}>Üretim Rotası (Dış)</h3>
            <ol>
              {quickViewProduct.operations?.filter(o => !o.isInnerProductRoute).sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(o => (
                <li key={o.id}>{workCenters.find(w => w.id === o.workCenterId)?.name || '-'} ({o.operationTimeMinutes} dk)</li>
              ))}
            </ol>
            
            {quickViewProduct.innerDetail && (
              <>
                <h3 style={{ marginTop: 24 }}>Üretim Rotası (İç)</h3>
                <ol>
                  {quickViewProduct.operations?.filter(o => o.isInnerProductRoute).sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(o => (
                    <li key={o.id}>{workCenters.find(w => w.id === o.workCenterId)?.name || '-'} ({o.operationTimeMinutes} dk)</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </Drawer>

      </Card>
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
