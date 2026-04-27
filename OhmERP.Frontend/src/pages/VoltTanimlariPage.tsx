import React, { useState, useEffect, useRef } from 'react';
import {
  Button, Input, Form, Row, Col, Popconfirm, message, Space, Tooltip, Typography
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined
} from '@ant-design/icons';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { technicalParameterApi } from '../services/technicalParameterService';
import type { TechnicalParameter } from '../services/technicalParameterService';
import { useDebounce } from '../hooks/useDebounce';

const { Text } = Typography;

const VoltTanimlariPage: React.FC = () => {
  const [data, setData] = useState<TechnicalParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  
  const [form] = Form.useForm();

  const fetchData = async (page = currentPage, size = pageSize, search = debouncedSearchText) => {
    setLoading(true);
    try {
      const response: any = await technicalParameterApi.getAll({
        page,
        pageSize: size,
        search,
        type: 1 // Volt
      });
      setData(response.items || response); // Support both paged and non-paged depending on backend
      setTotalCount(response.totalCount || response.length || 0);
    } catch {
      message.error('Kayıtlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    if (isManualSearch.current) {
        isManualSearch.current = false;
        return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
        fetchData(currentPage, pageSize, debouncedSearchText);
    }
  }, [currentPage, pageSize, debouncedSearchText]);

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = async (id: string) => {
    setEditingId(id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    
    try {
      const itemData = await technicalParameterApi.getById(id);
      form.setFieldsValue({
        code: itemData.code,
        numericValue: itemData.numericValue,
        description: itemData.description
      });
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

      const payload = {
        parameterType: 1, // 1 for Volt
        numericValue: values.numericValue || 0,
        description: values.description || ''
      };

      if (editingId) {
        await technicalParameterApi.update(editingId, { id: editingId, ...payload });
        message.success('Kayıt güncellendi.');
      } else {
        await technicalParameterApi.create(payload);
        message.success('Kayıt oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchData(currentPage, pageSize, searchText);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Kayıt işlemi başarısız.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await technicalParameterApi.delete(id);
      message.success('Kayıt silindi.');
      fetchData(currentPage, pageSize, searchText);
    } catch {
      message.error('Silme işlemi başarısız.');
    }
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const columns = [
    { title: 'Kodu', dataIndex: 'code', key: 'code', width: '20%', sorter: true, render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Değeri (Volt)', dataIndex: 'numericValue', key: 'numericValue', width: '20%', sorter: true, render: (val: number) => Number(val || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) },
    { 
      title: 'Açıklama', 
      dataIndex: 'description', 
      key: 'description',
      render: (text: string) => text ? (
        <Tooltip title={text}>
          <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {text}
          </div>
        </Tooltip>
      ) : '-'
    },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '15%',
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

  const exportExcelUrl = `/TechnicalParameter/export/excel?type=1${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`;
  const exportPdfUrl = `/TechnicalParameter/export/pdf?type=1${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`;

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row align="middle" justify="space-between">
            <Col>
              <Input.Search 
                  placeholder="Kodu veya Açıklama Ara... (En az 3 karakter)" 
                  value={searchText} 
                  onChange={e => {
                    setSearchText(e.target.value);
                    isManualSearch.current = false;
                  }} 
                  onSearch={(value) => {
                    isManualSearch.current = true;
                    setCurrentPage(1);
                    fetchData(1, pageSize, value);
                  }}
                  allowClear 
                  enterButton
                  style={{ width: '350px' }}
              />
            </Col>
            <Col>
                <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Volt Ekle</Button>
                </Space>
            </Col>
        </Row>
      </div>

      <OhmTable
        tableName="Volt_Tanimlari"
        tableTitle="Volt Tanımları Listesi"
        titleIcon={<SettingOutlined />}
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        exportExcelUrl={exportExcelUrl}
        exportPdfUrl={exportPdfUrl}
        pagination={{ 
          current: currentPage, 
          pageSize: pageSize, 
          total: totalCount, 
          showSizeChanger: true
        }}
      />

      <OhmFormDrawer
        title={editingId ? 'Volt Düzenle' : 'Yeni Volt Ekle'}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
      >
          {editingId && (
            <Form.Item name="code" label="Kodu">
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item name="numericValue" label="Değeri (Volt)" rules={[{ required: true, message: 'Zorunlu' }]}>
            <OhmInputNumber precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} maxLength={250} showCount />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default VoltTanimlariPage;
