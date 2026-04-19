import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Drawer, Form, Popconfirm, message, Switch, Row, Col, Radio } from 'antd';
import { DatabaseOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { getErrorMessage } from '../utils/turkishSearch';
import { formatSystemCode } from '../utils/helpers';

const { Text } = Typography;

interface UnitOfMeasureDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  description?: string;
}

const BirimTanimlari: React.FC = () => {
  const [data, setData] = useState<UnitOfMeasureDto[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all');

  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `/UnitOfMeasure?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status === 'active') url += '&isActive=true';
      if (status === 'passive') url += '&isActive=false';

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error('Ölçü birimleri yüklenirken hata oluştu.');
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
    form.setFieldsValue({ isActive: true });
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      const response = await api.get(`/UnitOfMeasure/${id}`);
      form.setFieldsValue(response.data);
    } catch {
      message.error('Birim bilgileri alınamadı.');
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
        await api.put(`/UnitOfMeasure/${editingId}`, values);
        message.success('Birim başarıyla güncellendi.');
      } else {
        await api.post('/UnitOfMeasure', values);
        message.success('Birim başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText, statusFilter);
    } catch (error: any) {
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/UnitOfMeasure/${id}`);
      message.success('Birim başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText, statusFilter);
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
    if (statusFilter === 'active') qs += '&isActive=true';
    if (statusFilter === 'passive') qs += '&isActive=false';
    return qs;
  };

  const columns = [
    { 
      title: 'Birim Kodu', 
      dataIndex: 'code', 
      key: 'code', 
      width: '20%', 
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Birim Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '30%',
    },
    { 
      title: 'Durum', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      width: '15%', 
      render: (isActive: boolean) => isActive ? <Text type="success">Aktif</Text> : <Text type="danger">Pasif</Text> 
    },
    { 
      title: 'Açıklama', 
      dataIndex: 'description', 
      key: 'description', 
      width: '20%' 
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '15%',
      render: (_: any, record: UnitOfMeasureDto) => (
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
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search 
              placeholder="Birim Kodu veya Adı Ara... (En az 3 karakter)" 
              value={searchText}
              onChange={(e) => {
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
          <Col span={8}>
            <Radio.Group 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }} 
              buttonStyle="solid"
            >
              <Radio.Button value="all">Tümü</Radio.Button>
              <Radio.Button value="active">Aktifler</Radio.Button>
              <Radio.Button value="passive">Pasifler</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, statusFilter)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Birim Ekle</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Birim_Tanimlari"
        tableTitle="Ölçü Birimleri"
        titleIcon={<DatabaseOutlined />}
        dataSource={data} 
        columns={columns}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        exportExcelUrl={`/UnitOfMeasure/export/excel${getExportQueryString()}`} 
        exportPdfUrl={`/UnitOfMeasure/export/pdf${getExportQueryString()}`}
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
        title={editingId ? 'Birim Düzenle' : 'Yeni Birim'}
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
            label="Birim Kodu" 
            rules={[{ required: true }]}
          >
            <Input 
              maxLength={10} 
              placeholder="Örn: ADET"
              onChange={(e) => form.setFieldsValue({ code: formatSystemCode(e.target.value) })}
            />
          </Form.Item>
          <Form.Item name="name" label="Birim Adı (Örn: Kilogram)" rules={[{ required: true }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default BirimTanimlari;