import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Drawer, Form, Popconfirm, message, Switch, Select, Tag, Radio, Row, Col } from 'antd';
import { TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { filterOptionTurkish, getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

const { Text } = Typography;
const { Option } = Select;

interface ItemCategoryDto {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  parentName?: string;
  isActive: boolean;
  description?: string;
}

interface LookupDto {
  id: string;
  name: string;
}

const KategoriTanimlari: React.FC = () => {
  const [data, setData] = useState<ItemCategoryDto[]>([]);
  const [lookupData, setLookupData] = useState<LookupDto[]>([]);
  const [uoms, setUoms] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [viewMode, setViewMode] = useState<'Tümü' | 'Aktifler' | 'Pasifler'>('Aktifler');

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = viewMode) => {
    setLoading(true);
    try {
      let url = `/ItemCategory?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'Aktifler') url += '&isActive=true';
      if (status === 'Pasifler') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    } catch {
      message.error('Kategoriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, viewMode]);

  const fetchLookup = useCallback(async () => {
    try {
      const response = await api.get('/ItemCategory/lookup');
      setLookupData(response.data ?? []);
    } catch {
      message.error('Üst kategori listesi alınamadı.');
    }
    
    try {
      const uomRes = await api.get('/UnitOfMeasure/lookup');
      setUoms(uomRes.data ?? []);
    } catch {
      message.error('Ölçü birimleri alınamadı.');
    }
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

  useEffect(() => {
    fetchLookup();
  }, [fetchLookup]);

  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/ItemCategory/${id}`);
      form.setFieldsValue(response.data);
    } catch {
      message.error('Kategori bilgileri alınamadı.');
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
      if (editingId) {
        await api.put(`/ItemCategory/${editingId}`, values);
        message.success('Kategori başarıyla güncellendi.');
      } else {
        await api.post('/ItemCategory', values);
        message.success('Kategori başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, viewMode);
      fetchLookup();
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
      await api.delete(`/ItemCategory/${id}`);
      message.success('Kategori başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText, viewMode);
      fetchLookup();
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
    { title: 'Kategori Kodu', dataIndex: 'code', key: 'code', width: '20%', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Kategori Adı', dataIndex: 'name', key: 'name', width: '25%' },
    { 
      title: 'Üst Kategori', dataIndex: 'parentName', key: 'parentName', width: '20%',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">-</Text> 
    },
    { title: 'Açıklama', dataIndex: 'description', key: 'description', width: '20%' },
    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', width: '10%', render: (isActive: boolean) => isActive ? <Tag color="success">Aktif</Tag> : <Tag color="error">Pasif</Tag> },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '15%',
      render: (_: any, record: ItemCategoryDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record.id)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const parentCategoryOptions = lookupData.filter(c => c.id !== editingId);

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Input.Search 
              placeholder="Kategori Kodu, Adı Ara... (En az 3 karakter)" 
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
          <Col span={8}>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => { 
                setViewMode(e.target.value); 
                setCurrentPage(1); 
              }} 
              buttonStyle="solid"
            >
              <Radio.Button value="Tümü">Tümü</Radio.Button>
              <Radio.Button value="Aktifler">Aktifler</Radio.Button>
              <Radio.Button value="Pasifler">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, viewMode)}>Yenile</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Kategori Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Kategori_Tanimlari"
        tableTitle="Malzeme Kategorileri"
        titleIcon={<TagsOutlined />}
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
        exportExcelUrl={`/ItemCategory/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/ItemCategory/export/pdf${getExportQueryString()}`}
      />

      <Drawer
        title={editingId ? 'Kategori Düzenle' : 'Yeni Kategori'}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>İptal</Button>
            <Button onClick={handleSave} type="primary" loading={formLoading}>{editingId ? 'Güncelle' : 'Kaydet'}</Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} disabled={formLoading}>
          <Form.Item 
            name="code" 
            label="Kategori Kodu" 
            rules={[{ required: true }]}
          >
            <Input 
              maxLength={50} 
              placeholder="Örn: HAMMADDE_TEL"
              onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })} 
            />
          </Form.Item>
          <Form.Item name="name" label="Kategori Adı (Örn: Tel)" rules={[{ required: true }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="parentId" label="Üst Kategori (Opsiyonel)">
            <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} allowClear placeholder="Seçiniz">
              {parentCategoryOptions.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
          <Form.Item name="defaultUnitOfMeasureId" label="Varsayılan Ölçü Birimi">
            <Select showSearch optionFilterProp="children" filterOption={filterOptionTurkish} allowClear placeholder="Seçiniz">
              {uoms.map(u => (
                <Option key={u.id} value={u.id}>{u.name} {u.code ? `(${u.code})` : ''}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="showInMenu" label="Sol Menüde Göster" valuePropName="checked">
            <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default KategoriTanimlari;