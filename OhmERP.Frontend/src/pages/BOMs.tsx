import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useEnterpriseTabs } from '../hooks/useEnterpriseTabs';
import { 
  Button, Typography, Space, Input, Drawer, Form, Popconfirm, message, 
  Switch, Row, Col, Radio, Select, Tabs, Card
} from 'antd';
import { 
  AppstoreAddOutlined, PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { getErrorMessage, filterOptionTurkish } from '../utils/turkishSearch';
import { OhmInputNumber } from '../components/OhmInputNumber';

const { Text } = Typography;
const { Option } = Select;

interface BOMListDto {
  id: string;
  itemId: string;
  itemName: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

interface LookupDto {
  id: string;
  name: string;
  code?: string;
}

interface ItemDto extends LookupDto {
  type: number;
}

const BOMs: React.FC = () => {
  const [data, setData] = useState<BOMListDto[]>([]);
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

  const [items, setItems] = useState<ItemDto[]>([]);
  const [uoms, setUoms] = useState<LookupDto[]>([]);
  const [workCenters, setWorkCenters] = useState<LookupDto[]>([]);

  const { activeTabKey, setActiveTabKey, resetTabs, renderTabLabel, validateAndHandleErrors } = useEnterpriseTabs('1');
  const [form] = Form.useForm();

  const fetchLookups = async () => {
    try {
      const [itemsRes, uomRes, wcRes] = await Promise.all([
        api.get('/Item?pageSize=10000&isActive=true'),
        api.get('/UnitOfMeasure/lookup'),
        api.get('/WorkCenters?pageSize=10000&isActive=true')
      ]);
      setItems(itemsRes.data?.items || []);
      setUoms(uomRes.data || []);
      setWorkCenters(wcRes.data?.items || []);
    } catch {
      message.error('Sözlük verileri alınamadı.');
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `/BOMs?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'active') url += '&isActive=true';
      if (status === 'passive') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('Reçeteler yüklenirken hata oluştu.');
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
    resetTabs();
    form.setFieldsValue({ 
      isActive: true, 
      isDefault: false,
      bomLines: [],
      bomOperations: []
    });
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    form.resetFields();
    resetTabs();
    
    try {
      const response = await api.get(`/BOMs/${id}`);
      const bomData = response.data;
      
      form.setFieldsValue({
        itemId: bomData.itemId,
        code: bomData.code,
        name: bomData.name,
        isActive: bomData.isActive,
        isDefault: bomData.isDefault,
        bomLines: bomData.bomLines || [],
        bomOperations: bomData.bomOperations || []
      });
    } catch {
      message.error('Reçete bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    const { values, isValid } = await validateAndHandleErrors(form, {
      bomLines: '1',
      bomOperations: '2'
    }, '1');

    if (!isValid || !values) return;

    setFormLoading(true);
    try {
      const payload = {
        itemId: values.itemId,
        code: values.code,
        name: values.name,
        isActive: values.isActive,
        isDefault: values.isDefault,
        bomLines: values.bomLines || [],
        bomOperations: values.bomOperations || []
      };

      if (editingId) {
        await api.put(`/BOMs/${editingId}`, payload);
        message.success('Reçete başarıyla güncellendi.');
      } else {
        await api.post('/BOMs', payload);
        message.success('Reçete başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, statusFilter);
      setCurrentPage(1);
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/BOMs/${id}`);
      message.success('Reçete başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText, statusFilter);
    } catch {
      message.error('Silme işlemi başarısız.');
    }
  };

  const handleTableChange = (pagination: any) => {
    if (pagination.current && pagination.current !== currentPage) setCurrentPage(pagination.current);
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1);
    }
  };

  const columns = [
    { title: 'Reçete Kodu', dataIndex: 'code', key: 'code', width: '15%', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Reçete Adı', dataIndex: 'name', key: 'name', width: '30%' },
    { title: 'İlgili Mamul', dataIndex: 'itemName', key: 'itemName', width: '25%' },
    { title: 'Varsayılan', dataIndex: 'isDefault', key: 'isDefault', width: '10%', render: (val: boolean) => val ? <Text type="success">Evet</Text> : <Text type="secondary">Hayır</Text> },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '10%', render: (val: boolean) => val ? <Text type="success">Aktif</Text> : <Text type="danger">Pasif</Text> },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '10%',
      render: (_: any, record: BOMListDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const parentItems = items.filter(x => x.type === 2 || x.type === 3);
  const materialItems = items;

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Radio.Group 
              value={statusFilter} 
              onChange={(e) => { 
                setStatusFilter(e.target.value); 
                setCurrentPage(1); 
              }} 
              optionType="button" 
              buttonStyle="solid"
            >
              <Radio.Button value="all">Tümü</Radio.Button>
              <Radio.Button value="active">Aktifler</Radio.Button>
              <Radio.Button value="passive">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8}>
            <Input.Search 
              placeholder="Reçete Ara... (En az 3 karakter)" 
              value={searchText} 
              onChange={e => {
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
          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, statusFilter)}>Yenile</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Reçete Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="BOM_Listesi"
        tableTitle="Ürün Reçeteleri (BOM) Yönetimi"
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
        title={editingId ? 'Reçete Düzenle' : 'Yeni Reçete'}
        width={900}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        destroyOnHidden
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>İptal</Button>
            <Button htmlType="submit" form="bomForm" type="primary" loading={formLoading}>{editingId ? 'Güncelle' : 'Kaydet'}</Button>
          </Space>
        }
      >
        <Form id="bomForm" onFinish={handleSave} layout="vertical" form={form} disabled={formLoading}>
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="code" label="Reçete Kodu" rules={[{ required: true, message: 'Zorunlu' }]}>
                  <Input placeholder="Örn: REC-001" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="name" label="Reçete Adı" rules={[{ required: true, message: 'Zorunlu' }]}>
                  <Input placeholder="Reçete Adı" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="itemId" label="İlgili Mamul/Yarı Mamul" rules={[{ required: true, message: 'Zorunlu' }]}>
                  <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="Seçiniz">
                    {parentItems.map(x => <Option key={x.id} value={x.id}>{x.code} - {x.name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item name="isActive" label="Durum" valuePropName="checked">
                  <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="isDefault" label="Varsayılan mı?" valuePropName="checked">
                  <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Tabs 
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
            items={[
              {
                key: '1',
                label: renderTabLabel('Hammaddeler (İçerik)', '1'),
                children: (
                  <Form.List name="bomLines">
                    {(fields, { add, remove }) => (
                      <>
                        <Row gutter={8} style={{ fontWeight: 'bold', marginBottom: 8, padding: '0 8px' }}>
                          <Col span={10}>Hammadde / Yarı Mamul</Col>
                          <Col span={4}>Miktar</Col>
                          <Col span={5}>Ölçü Birimi</Col>
                          <Col span={4}>Fire Oranı (%)</Col>
                          <Col span={1}></Col>
                        </Row>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row gutter={8} key={key} style={{ marginBottom: 8 }} align="middle">
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'materialId']} rules={[{ required: true, message: 'Zorunlu' }]} style={{ marginBottom: 0 }}>
                                <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="Malzeme Seçiniz">
                                  {materialItems.map(x => <Option key={x.id} value={x.id}>{x.code} - {x.name}</Option>)}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Zorunlu' }]} style={{ marginBottom: 0 }}>
                                <OhmInputNumber precision={4} placeholder="Miktar" style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...restField} name={[name, 'unitOfMeasureId']} rules={[{ required: true, message: 'Zorunlu' }]} style={{ marginBottom: 0 }}>
                                <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="Birim">
                                  {uoms.map(x => <Option key={x.id} value={x.id}>{x.name}</Option>)}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item {...restField} name={[name, 'scrapRate']} style={{ marginBottom: 0 }}>
                                <OhmInputNumber precision={2} placeholder="% Fire" style={{ width: '100%' }} min={0} max={100} />
                              </Form.Item>
                            </Col>
                            <Col span={1} style={{ textAlign: 'center' }}>
                              <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: 16, cursor: 'pointer' }} />
                            </Col>
                          </Row>
                        ))}
                        <Form.Item style={{ marginTop: 16 }}>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Yeni Hammadde Satırı Ekle
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                )
              },
              {
                key: '2',
                label: renderTabLabel('Üretim Rotaları (İşçilik)', '2'),
                children: (
                  <Form.List name="bomOperations">
                    {(fields, { add, remove }) => (
                      <>
                        <Row gutter={8} style={{ fontWeight: 'bold', marginBottom: 8, padding: '0 8px' }}>
                          <Col span={10}>İş Merkezi / Makine</Col>
                          <Col span={4}>İşlem Sırası</Col>
                          <Col span={5}>Hazırlık Süresi (Dk)</Col>
                          <Col span={4}>İşlem Süresi (Dk)</Col>
                          <Col span={1}></Col>
                        </Row>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row gutter={8} key={key} style={{ marginBottom: 8 }} align="middle">
                            <Col span={10}>
                              <Form.Item {...restField} name={[name, 'workCenterId']} rules={[{ required: true, message: 'Zorunlu' }]} style={{ marginBottom: 0 }}>
                                <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} placeholder="İş Merkezi Seçiniz">
                                  {workCenters.map(x => <Option key={x.id} value={x.id}>{x.code} - {x.name}</Option>)}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item {...restField} name={[name, 'operationOrder']} rules={[{ required: true, message: 'Zorunlu' }]} style={{ marginBottom: 0 }}>
                                <OhmInputNumber precision={0} placeholder="Sıra" style={{ width: '100%' }} min={1} />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...restField} name={[name, 'setupTime']} style={{ marginBottom: 0 }}>
                                <OhmInputNumber precision={2} placeholder="Hazırlık Dk" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item {...restField} name={[name, 'runTime']} style={{ marginBottom: 0 }}>
                                <OhmInputNumber precision={2} placeholder="İşlem Dk" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={1} style={{ textAlign: 'center' }}>
                              <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: 16, cursor: 'pointer' }} />
                            </Col>
                          </Row>
                        ))}
                        <Form.Item style={{ marginTop: 16 }}>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Yeni Rota Satırı Ekle
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                )
              }
            ]} 
          />
        </Form>
      </Drawer>
    </>
  );
};

export default BOMs;
