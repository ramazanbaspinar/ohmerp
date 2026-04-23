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
import { getErrorMessage } from '../utils/turkishSearch';

const SacTanimlari: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [kgUnitId, setKgUnitId] = useState<string | null>(null);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [originalData, setOriginalData] = useState<any>(undefined);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | string>(true);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);

  const [form] = Form.useForm();

  const fetchMetadata = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        api.get('/ItemCategory/lookup'),
        api.get('/UnitOfMeasure/lookup')
      ]);
      const cats = catRes.data?.items || catRes.data || [];
      const units = unitRes.data?.items || unitRes.data || [];

      const sacCat = cats.find((c: any) => {
        const name = c.name || '';
        const upperNameTR = name.toLocaleUpperCase('tr-TR');
        const upperNameEN = name.toUpperCase();
        return upperNameTR.startsWith('SAC') || upperNameEN.startsWith('SAC') || c.code?.toUpperCase() === 'SAC';
      });
      const kg = units.find((u: any) => {
        const name = u.name || '';
        return name.toUpperCase().includes('KİLOGRAM') || name.toUpperCase().includes('KILOGRAM') || name.toUpperCase() === 'KG' || u.code?.toUpperCase() === 'KG';
      });

      if (sacCat) setCategoryId(sacCat.id);
      if (kg) setKgUnitId(kg.id);

      return sacCat?.id;
    } catch {
      return null;
    }
  };

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, catId = categoryId, isActive = isActiveFilter) => {
    if (!catId) return;
    setLoading(true);
    try {
      let url = `/Item?page=${page}&pageSize=${size}&categoryId=${catId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (isActive !== null && isActive !== "" && isActive !== undefined) url += `&isActive=${isActive}`;

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('Sac tanımları listelenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, categoryId, isActiveFilter]);

  useEffect(() => {
    fetchMetadata().then(id => {
      if (id) fetchData(1, pageSize, debouncedSearchText, id, isActiveFilter);
    });
  }, []);

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
    setEditingId(undefined);
    form.resetFields();
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const numRes = await api.get('/Numerator/PreviewNextCode/2');
      const initVals = { code: numRes.data.nextCode, isActive: true, en: 23, yogunluk: 7.85 };
      form.setFieldsValue(initVals);
      setOriginalData(initVals);
    } catch {
      const initVals = { code: '', isActive: true, en: 23, yogunluk: 7.85 };
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

      let kalinlik = 0;
      let en = 23;
      let yogunluk = 7.85;

      if (itemData.propertiesJson) {
        try {
          const props = JSON.parse(itemData.propertiesJson);
          kalinlik = props.Kalinlik || props.kalinlik || 0;
          en = props.En || props.en || 23;
          yogunluk = props.Yogunluk || props.yogunluk || 7.85;
        } catch (e) {
        }
      }

      const initVals = {
        code: itemData.code,
        name: itemData.name,
        kalinlik: kalinlik,
        en: en,
        yogunluk: yogunluk,
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

      if (!categoryId) {
        message.error("SAC kategorisi bulunamadı. Lütfen veritabanı varsayılanlarını kontrol edin.");
        setFormLoading(false);
        return;
      }

      const properties = {
        Kalinlik: Number(values.kalinlik) || 0,
        En: Number(values.en) || 23,
        Yogunluk: Number(values.yogunluk) || 7.85
      };

      const payload = {
        code: values.code,
        name: values.name,
        categoryId: categoryId,
        unitOfMeasureId: kgUnitId,
        type: 1,
        itemType: 1,
        unitCost: 0,
        costCurrency: 1,
        taxRate: 0,
        criticalStockLevel: values.criticalStockLevel || 0,
        barcode: values.barcode || '',
        description: values.description || '',
        propertiesJson: JSON.stringify(properties),
        isActive: values.isActive ?? true
      };

      if (editingId) {
        await api.put(`/Item/${editingId}`, payload);
        message.success('Sac tanımı güncellendi.');
      } else {
        await api.post('/Item', payload);
        message.success('Sac tanımı oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, categoryId, isActiveFilter);
    } catch (error: any) {
      if (error?.response?.data) {
        message.error(getErrorMessage(error));
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/Item/${id}`);
      message.success('Kayıt silindi.');
      fetchData(currentPage, pageSize, searchText, categoryId, isActiveFilter);
    } catch {
      message.error('Kayıt silinemedi. Bağlı hareketler olabilir.');
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



  const renderEavProperty = (record: any, propName: string) => {
    if (!record.propertiesJson) return <small style={{ color: 'red' }}>Veri Yok</small>;
    try {
      const props = JSON.parse(record.propertiesJson);
      const val = props[propName] ?? props[propName.toLowerCase()];
      if (val === undefined || val === null) return <small style={{ color: 'red' }}>-</small>;
      return <Text>{Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}</Text>;
    } catch {
      return <small style={{ color: 'red' }}>Hata</small>;
    }
  };

  const columns = [
    { title: 'Kodu', dataIndex: 'code', key: 'code', width: '12%', sorter: true, render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Adı', dataIndex: 'name', key: 'name', width: '25%', sorter: true },
    {
      title: 'Sac Kalınlığı (mm)', key: 'kalinlik', width: '15%',
      render: (_: any, record: any) => renderEavProperty(record, 'Kalinlik')
    },
    {
      title: 'Sac Eni (mm)', key: 'en', width: '15%',
      render: (_: any, record: any) => renderEavProperty(record, 'En')
    },
    {
      title: 'Yoğunluk', key: 'yogunluk', width: '10%',
      render: (_: any, record: any) => renderEavProperty(record, 'Yogunluk')
    },
    { title: 'Kritik Stok Seviyesi (KG)', dataIndex: 'criticalStockLevel', key: 'criticalStockLevel', width: 100, ellipsis: true, sorter: true, render: (val: number) => Number(val || 0).toLocaleString('tr-TR', { maximumFractionDigits: 4 }) },
    { title: 'Barkod', dataIndex: 'barcode', key: 'barcode', width: 100, ellipsis: true, sorter: true },
    {
      title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '10%',
      render: (isActive: boolean) => isActive ? <Tag color="green">Aktif</Tag> : <Tag color="red">Pasif</Tag>
    },
    {
      title: 'Açıklama', dataIndex: 'description', key: 'description', width: '15%',
      render: (text: string) => <Tooltip title={text}><div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div></Tooltip>
    },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '8%',
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
        <Row gutter={16} align="middle" justify="space-between">
          <Col flex="auto">
            <Space>
              <Input.Search
                placeholder="Sac Adı veya Kodu Ara... (En az 3 karakter)"
                value={searchText ?? ""}
                onChange={(e) => {
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
                value={isActiveFilter ?? ""}
                onChange={(e) => {
                  setIsActiveFilter(e.target.value);
                  setCurrentPage(1);
                  isManualSearch.current = false;
                }}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="">Tümü</Radio.Button>
                <Radio.Button value={true}>Aktifler</Radio.Button>
                <Radio.Button value={false}>Pasifler</Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, categoryId)}>Yenile</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Sac Tanımı Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Sac_Tanimlari"
        tableTitle="Sac Tanımları Listesi"
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
        title={editingId ? 'Sac Tanımı Düzenle' : 'Yeni Sac Tanımı'}
        width={600}
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
            <Form.Item name="kalinlik" label="Sac Kalınlığı (mm)" rules={[{ required: true, message: 'Zorunlu' }]}>
              <OhmInputNumber precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="en" label="Sac Eni (Şerit Genişliği - mm)" rules={[{ required: true, message: 'Zorunlu' }]}>
              <OhmInputNumber precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="yogunluk" label="Yoğunluk (Özkütle)" rules={[{ required: true, message: 'Zorunlu' }]}>
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

        <Form.Item name="isActive" label="Durum" valuePropName="checked">
          <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
        </Form.Item>
        <Form.Item name="description" label="Açıklama">
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default SacTanimlari;
