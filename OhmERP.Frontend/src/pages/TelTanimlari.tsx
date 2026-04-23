import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Button, Input, Form, Row, Col, Popconfirm, message, Space, Tooltip, Radio, Switch, Tag, Typography
} from 'antd';

const { Text } = Typography;
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, AppstoreAddOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { formatSystemCode } from '../utils/helpers';

const TelTanimlari: React.FC = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(true);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);

  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, catId = categoryId, activeState = isActiveFilter) => {
    if (!catId) return;
    setLoading(true);
    try {
      let url = `/Item?page=${page}&pageSize=${size}&categoryId=${catId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (activeState !== null) url += `&isActive=${activeState}`;
      const response = await api.get(url);
      setData(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    } catch {
      message.error('Kayıtlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, categoryId, isActiveFilter]);

  useEffect(() => {
    const init = async () => {
        try {
            const [catRes, unitRes] = await Promise.all([
                api.get('/ItemCategory/lookup'),
                api.get('/UnitOfMeasure/lookup')
            ]);
            
            const telCat = catRes.data.find((c: any) => {
                const name = c.name || '';
                const upperNameTR = name.toLocaleUpperCase('tr-TR');
                const upperNameEN = name.toUpperCase();
                return upperNameTR.includes('TEL') || upperNameEN.includes('TEL') || c.code?.toUpperCase() === 'TEL';
            });
            const kgUnit = unitRes.data.find((u: any) => {
                const name = u.name || '';
                return name.toUpperCase().includes('KİLOGRAM') || name.toUpperCase().includes('KILOGRAM') || name.toUpperCase() === 'KG' || u.code?.toUpperCase() === 'KG';
            });
            
            if (telCat) setCategoryId(telCat.id);
            if (kgUnit) setUnitId(kgUnit.id);
        } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    if (categoryId) {
        if (isManualSearch.current) {
            isManualSearch.current = false;
            return;
        }
        if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
            fetchData(currentPage, pageSize, debouncedSearchText, categoryId, isActiveFilter);
        }
    }
  }, [fetchData, currentPage, pageSize, debouncedSearchText, categoryId, isActiveFilter]);

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/2');
      const initVals = { code: numRes.data.nextCode };
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
    } catch {
      const initVals = { code: '' };
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
    form.resetFields();
    
    try {
      const response = await api.get(`/Item/${id}`);
      const itemData = response.data;
      
      let cap = 0;
      let agirlik = 0;
      let ohm = 0;

      if (itemData.propertiesJson) {
        try {
          const props = JSON.parse(itemData.propertiesJson);
          cap = props.Cap || 0;
          agirlik = props.Agirlik || 0;
          ohm = props.Ohm || 0;
        } catch (e) {
        }
      }

      const initVals = {
        code: itemData.code,
        name: itemData.name,
        cap: cap,
        agirlik: agirlik,
        ohm: ohm,
        criticalStockLevel: itemData.criticalStockLevel || 0,
        barcode: itemData.barcode || undefined,
        description: itemData.description || undefined,
        isActive: itemData.isActive
      };
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
      
    } catch {
      message.error('Kayıt bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);

      if (!categoryId || !unitId) {
        message.error("Kategori veya birim bilgisi yüklenemedi. Sayfayı yenileyin.");
        setFormLoading(false);
        return;
      }

      const propertiesJson = JSON.stringify({
        Cap: values.cap || 0,
        Agirlik: values.agirlik || 0,
        Ohm: values.ohm || 0
      });

      const payload = {
        code: values.code,
        name: values.name,
        categoryId: categoryId,
        unitOfMeasureId: unitId,
        itemType: 1,
        type: 1,
        taxRate: 0,
        unitCost: 0,
        costCurrency: 1,
        barcode: values.barcode || '',
        criticalStockLevel: values.criticalStockLevel || 0,
        description: values.description || '',
        isActive: values.isActive ?? true,
        propertiesJson: propertiesJson
      };

      if (editingId) {
        await api.put(`/Item/${editingId}`, payload);
        message.success('Kayıt güncellendi.');
      } else {
        await api.post('/Item', payload);
        message.success('Kayıt oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(currentPage, pageSize, searchText, categoryId);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Kayıt işlemi başarısız.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/Item/${id}`);
      message.success('Kayıt silindi.');
      fetchData(currentPage, pageSize, searchText, categoryId);
    } catch {
      message.error('Silme işlemi başarısız.');
    }
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const columns = [
    { title: 'Kodu', dataIndex: 'code', key: 'code', width: '15%', sorter: true, render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Adı', dataIndex: 'name', key: 'name', width: '25%', sorter: true },
    { 
      title: 'Tel Çapı (mm)', 
      key: 'cap', 
      render: (_: any, record: any) => {
        if (record.propertiesJson) {
           try {
             const props = typeof record.propertiesJson === 'string' ? JSON.parse(record.propertiesJson) : record.propertiesJson;
             const val = props?.Cap ?? props?.cap;
             if (val !== undefined && val !== null) return Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 4 });
             return <small style={{color: 'red'}}>{record.propertiesJson}</small>;
           } catch { return <small style={{color: 'red'}}>{record.propertiesJson}</small>; }
        }
        return '-';
      }
    },
    { 
      title: 'Tel Ağırlığı (g/m)', 
      key: 'agirlik', 
      render: (_: any, record: any) => {
        if (record.propertiesJson) {
           try {
             const props = typeof record.propertiesJson === 'string' ? JSON.parse(record.propertiesJson) : record.propertiesJson;
             const val = props?.Agirlik ?? props?.agirlik;
             if (val !== undefined && val !== null) return Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 4 });
             return <small style={{color: 'red'}}>{record.propertiesJson}</small>;
           } catch { return <small style={{color: 'red'}}>{record.propertiesJson}</small>; }
        }
        return '-';
      }
    },
    { 
      title: 'Ohm Değeri (ohm/m)', 
      key: 'ohm', 
      render: (_: any, record: any) => {
        if (record.propertiesJson) {
           try {
             const props = typeof record.propertiesJson === 'string' ? JSON.parse(record.propertiesJson) : record.propertiesJson;
             const val = props?.Ohm ?? props?.ohm;
             if (val !== undefined && val !== null) return Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 4 });
             return <small style={{color: 'red'}}>{record.propertiesJson}</small>;
           } catch { return <small style={{color: 'red'}}>{record.propertiesJson}</small>; }
        }
        return '-';
      }
    },
    { title: 'Kritik Stok Seviyesi (KG)', dataIndex: 'criticalStockLevel', key: 'criticalStockLevel', width: 100, ellipsis: true, sorter: true, render: (val: number) => Number(val || 0).toLocaleString('tr-TR', { maximumFractionDigits: 4 }) },
    { title: 'Barkod', dataIndex: 'barcode', key: 'barcode', width: 100, ellipsis: true, sorter: true },
    { 
      title: 'Durum', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Aktif' : 'Pasif'}</Tag>
    },
    { 
      title: 'Açıklama', 
      dataIndex: 'description', 
      key: 'description',
      render: (text: string) => text ? (
        <Tooltip title={text}>
          <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {text}
          </div>
        </Tooltip>
      ) : null
    },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '12%',
      render: (_: any, record: any) => (
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
        <Row align="middle" justify="space-between" gutter={[16,16]}>
            <Col span={14}>
              <Space>
                <Input.Search 
                  placeholder="Tel Adı veya Kodu Ara... (En az 3 karakter)" 
                  value={searchText} 
                  onChange={e => {
                    setSearchText(e.target.value);
                    isManualSearch.current = false;
                  }} 
                  onSearch={(value) => {
                    isManualSearch.current = true;
                    setCurrentPage(1);
                    fetchData(1, pageSize, value, categoryId, isActiveFilter);
                  }}
                  allowClear 
                  enterButton
                  style={{ width: '350px' }}
                />
                <Radio.Group 
                  value={isActiveFilter} 
                  onChange={(e) => {
                    setIsActiveFilter(e.target.value);
                    setCurrentPage(1);
                    isManualSearch.current = false;
                  }}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value={null}>Tümü</Radio.Button>
                  <Radio.Button value={true}>Aktifler</Radio.Button>
                  <Radio.Button value={false}>Pasifler</Radio.Button>
                </Radio.Group>
              </Space>
            </Col>
            <Col>
                <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, categoryId)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Tel Tanımı Ekle</Button>
                </Space>
            </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Tel_Tanimlari"
        tableTitle="Tel Tanımları Listesi"
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
          showSizeChanger: true
        }}
        exportExcelUrl={categoryId ? `/Item/export/excel?categoryId=${categoryId}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}` : undefined}
        exportPdfUrl={categoryId ? `/Item/export/pdf?categoryId=${categoryId}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}` : undefined}
      />

      <OhmFormDrawer
        title={editingId ? 'Tel Tanımı Düzenle' : 'Yeni Tel Tanımı'}
        width={500}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
        initialValues={originalData}
      >
          <Form.Item name="code" label="Kodu" rules={[{ required: true, message: 'Zorunlu' }]}>
            <Input onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })} maxLength={50} />
          </Form.Item>
          <Form.Item name="name" label="Adı" rules={[{ required: true, message: 'Zorunlu' }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cap" label="Tel Çapı (mm)" rules={[{ required: true, message: 'Zorunlu' }]}>
                <OhmInputNumber precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="agirlik" label="Tel Ağırlığı (g/m)" rules={[{ required: true, message: 'Zorunlu' }]}>
                <OhmInputNumber precision={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ohm" label="Ohm Değeri (ohm/m)" rules={[{ required: true, message: 'Zorunlu' }]}>
                <OhmInputNumber precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="criticalStockLevel" label="Kritik Stok Seviyesi (KG)">
            <OhmInputNumber precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="barcode" label="Barkod" rules={[{ max: 50, message: 'Barkod en fazla 50 karakter olabilir!' }]}>
            <Input maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default TelTanimlari;
