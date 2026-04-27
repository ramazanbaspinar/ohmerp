import React, { useEffect, useState, useMemo } from 'react';
import { 
  Button, Card, Form, Input, Select, Switch, Space, InputNumber, Row, Col, Tabs, Drawer, Spin, message, Popconfirm 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { OhmTable } from '../components/OhmTable';
import OhmImageUpload from '../components/OhmImageUpload';
import { productService } from '../services/productService';
import type { ProductDto } from '../services/productService';
import api from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const UrunAgaclariPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Lookups
  const [companies, setCompanies] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [voltParams, setVoltParams] = useState<any[]>([]);
  const [wattParams, setWattParams] = useState<any[]>([]);

  // States for dynamics
  const [isMixedSand, setIsMixedSand] = useState(false);
  const [hasInnerProduct, setHasInnerProduct] = useState(false);
  const [innerIsMixedSand, setInnerIsMixedSand] = useState(false);
  
  // Watch values for Ohm Calculation
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
      const volts = tpData.filter((x: any) => x.parameterType === 1); // Assuming 1 is Volt
      const watts = tpData.filter((x: any) => x.parameterType === 2); // Assuming 2 is Watt
      
      setVoltParams(volts.length > 0 ? volts : tpData); // Fallback
      setWattParams(watts.length > 0 ? watts : tpData); // Fallback
    } catch (error) {
      console.error("Lookups fetch error:", error);
    }
  };

  // Ohm Calculation Logic
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
      form.setFieldValue('calculatedOhm', ohm);
    }
  }, [voltId, wattId, voltParams, wattParams, drawerVisible]);

  useEffect(() => {
    if (drawerVisible && hasInnerProduct) {
      const ohm = calculateOhm(innerVoltId, innerWattId);
      form.setFieldValue(['innerDetail', 'calculatedInnerOhm'], ohm);
    }
  }, [innerVoltId, innerWattId, voltParams, wattParams, drawerVisible, hasInnerProduct]);

  const handleOpenDrawer = (record?: ProductDto) => {
    form.resetFields();
    if (record) {
      setIsEdit(true);
      setCurrentId(record.id);
      setIsMixedSand(record.isMixedSand);
      setHasInnerProduct(!!record.innerDetail);
      if (record.innerDetail) setInnerIsMixedSand(record.innerDetail.innerIsMixedSand);
      
      form.setFieldsValue({
        ...record,
        images: record.images?.map(i => i.imageBase64),
        hasInnerProduct: !!record.innerDetail
      });
    } else {
      setIsEdit(false);
      setCurrentId(null);
      setIsMixedSand(false);
      setHasInnerProduct(false);
      setInnerIsMixedSand(false);
      form.setFieldsValue({
        isActive: true,
        isMixedSand: false,
        hasInnerProduct: false
      });
    }
    setDrawerVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Map Images
      if (values.images && Array.isArray(values.images)) {
        values.images = values.images.map((base64: string, idx: number) => ({
          imageBase64: base64,
          sequenceOrder: idx + 1
        }));
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
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

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
          dataSource={products}
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
              <Button onClick={() => setDrawerVisible(false)}>İptal</Button>
              <Button type="primary" onClick={handleSave} loading={loading}>Kaydet</Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1">
              <TabPane tab="Dış Ürün Bilgileri" key="1">
                <Row gutter={16}>
                  <Col span={16}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="name" label="Ürün Adı" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="firmId" label="Firma" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="voltParameterId" label="Volt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {voltParams.map(v => <Option key={v.id} value={v.id}>{v.code} - {v.numericValue}V</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="wattParameterId" label="Watt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {wattParams.map(w => <Option key={w.id} value={w.id}>{w.code} - {w.numericValue}W</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="calculatedOhm" label="Hesaplanan Ohm">
                          <InputNumber disabled style={{ width: '100%', color: 'blue', fontWeight: 'bold' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="images" label="Ürün Resimleri">
                      <OhmImageUpload maxCount={3} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                   <Col span={8}>
                     <Form.Item name="wireId" label="Tel" rules={[{ required: true }]}>
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
                   <Col span={8}>
                     <Form.Item name="pinId" label="Pim" rules={[{ required: true }]}>
                       <Select showSearch optionFilterProp="children">
                         {filterItemsByCategory("PIM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                       </Select>
                     </Form.Item>
                   </Col>
                   <Col span={8}>
                     <Form.Item name="plug1Id" label="1. Tapa" rules={[{ required: true }]}>
                       <Select showSearch optionFilterProp="children">
                         {filterItemsByCategory("TAPA").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                       </Select>
                     </Form.Item>
                   </Col>
                   <Col span={8}>
                     <Form.Item name="socket1Id" label="1. Soket" rules={[{ required: true }]}>
                       <Select showSearch optionFilterProp="children">
                         {filterItemsByCategory("SOKET").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                       </Select>
                     </Form.Item>
                   </Col>
                </Row>

                <Card title="Kum Bilgileri" size="small" style={{ marginTop: 16 }}>
                  <Form.Item name="isMixedSand" valuePropName="checked">
                    <Switch checkedChildren="Karışık Kum" unCheckedChildren="Tek Kum" onChange={setIsMixedSand} />
                  </Form.Item>
                  <div style={{ transition: 'opacity 0.5s', opacity: isMixedSand ? 1 : 0, display: isMixedSand ? 'block' : 'none' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="mixedSand1Id" label="1. Kum">
                           <Select showSearch optionFilterProp="children" allowClear>
                             {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                           </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="mixedSand1Ratio" label="1. Kum Oranı (%)">
                          <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="mixedSand2Id" label="2. Kum">
                           <Select showSearch optionFilterProp="children" allowClear>
                             {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                           </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="mixedSand2Ratio" label="2. Kum Oranı (%)">
                          <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                  <div style={{ transition: 'opacity 0.5s', opacity: !isMixedSand ? 1 : 0, display: !isMixedSand ? 'block' : 'none' }}>
                    <Form.Item name="sandId" label="Tek Kum">
                       <Select showSearch optionFilterProp="children" allowClear>
                         {filterItemsByCategory("KUM").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                       </Select>
                    </Form.Item>
                  </div>
                </Card>
              </TabPane>

              <TabPane tab="İç Ürün Bilgileri" key="2">
                <Form.Item name="hasInnerProduct" valuePropName="checked">
                  <Switch checkedChildren="İç Ürün Var" unCheckedChildren="İç Ürün Yok" onChange={setHasInnerProduct} />
                </Form.Item>
                {hasInnerProduct && (
                  <div style={{ animation: 'fadeIn 0.5s' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name={['innerDetail', 'innerVoltParameterId']} label="İç Volt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {voltParams.map(v => <Option key={v.id} value={v.id}>{v.code} - {v.numericValue}V</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name={['innerDetail', 'innerWattParameterId']} label="İç Watt" rules={[{ required: true }]}>
                          <Select showSearch optionFilterProp="children">
                            {wattParams.map(w => <Option key={w.id} value={w.id}>{w.code} - {w.numericValue}W</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name={['innerDetail', 'calculatedInnerOhm']} label="İç Hesaplanan Ohm">
                          <InputNumber disabled style={{ width: '100%', color: 'blue', fontWeight: 'bold' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                       <Col span={12}>
                         <Form.Item name={['innerDetail', 'innerWireId']} label="İç Tel" rules={[{ required: true }]}>
                           <Select showSearch optionFilterProp="children">
                             {filterItemsByCategory("TEL").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                           </Select>
                         </Form.Item>
                       </Col>
                       <Col span={12}>
                         <Form.Item name={['innerDetail', 'innerSheetId']} label="İç Sac" rules={[{ required: true }]}>
                           <Select showSearch optionFilterProp="children">
                             {filterItemsByCategory("SAC").map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                           </Select>
                         </Form.Item>
                       </Col>
                    </Row>
                  </div>
                )}
              </TabPane>

              <TabPane tab="Üretim Rotası" key="3">
                <Row gutter={16}>
                  <Col span={hasInnerProduct ? 12 : 24}>
                    <Card title="Dış Ürün Rotası" size="small">
                      <Form.List name="operations">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Row gutter={8} key={key} style={{ marginBottom: 8 }}>
                                <Col span={3}>
                                  <Form.Item {...restField} name={[name, 'sequenceOrder']} noStyle>
                                    <InputNumber placeholder="Sıra" style={{ width: '100%' }} />
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
                                    <InputNumber placeholder="Süre (Dk)" style={{ width: '100%' }} />
                                  </Form.Item>
                                </Col>
                                <Col span={3}>
                                  <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </Col>
                              </Row>
                            ))}
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
                        <p style={{ color: '#888' }}>Not: İleri seviye iç rota planlaması Form.List filter yapılarak implemente edilebilir.</p>
                      </Card>
                    </Col>
                  )}
                </Row>
              </TabPane>
            </Tabs>
          </Form>
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
