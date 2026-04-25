import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, message, Row, Col, Popconfirm } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { getErrorMessage } from '../utils/turkishSearch';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { formatSystemCode } from '../utils/helpers';

const { Text } = Typography;

interface CostParameterDto {
  id: string;
  code: string;
  name: string;
  percentageValue: number;
  description: string;
  isSystemDefined: boolean;
}

const MaliyetParametreleriPage: React.FC = () => {
  const [data, setData] = useState<CostParameterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);

  const [form] = Form.useForm();

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchText,
    sortBy = '',
    sortDesc = false
  ) => {
    setLoading(true);
    try {
      let url = `/CostParameters?page=${page}&pageSize=${size}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sortBy) url += `&sortBy=${sortBy}&sortDesc=${sortDesc}`;

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error(`Kayıtlar yüklenirken hata oluştu.`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText]);

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
  }, [currentPage, pageSize, debouncedSearchText, fetchData]);

  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerVisible(true);
    setOriginalData({});
  };

  const openDrawerForEdit = (record: CostParameterDto) => {
    setEditingId(record.id);
    setIsDrawerVisible(true);
    form.setFieldsValue(record);
    setOriginalData(record);
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.put(`/CostParameters/${editingId}`, values);
        message.success('Parametre başarıyla güncellendi.');
      } else {
        await api.post('/CostParameters', values);
        message.success('Parametre başarıyla eklendi.');
      }
      setIsDrawerVisible(false);
      fetchData(currentPage, pageSize, searchText);
    } catch (error: any) {
      if (error.errorFields) return;
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/CostParameters/${id}`);
      message.success('Parametre başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText);
    } catch {
      message.error('Silme işlemi başarısız.');
    }
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    let sortField = '';
    let sortDesc = false;

    if (sorter && sorter.field) {
      sortField = sorter.field;
      sortDesc = sorter.order === 'descend';
    }

    if (pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1); 
    }

    fetchData(pagination.current || currentPage, pagination.pageSize || pageSize, searchText, sortField, sortDesc);
  };

  const columns = [
    { 
      title: 'Parametre Kodu', 
      dataIndex: 'code', 
      key: 'code', 
      width: '20%', 
      sorter: true,
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Parametre Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '30%',
      sorter: true
    },
    {
      title: 'Yüzde Değeri (%)',
      dataIndex: 'percentageValue',
      key: 'percentageValue',
      width: '15%',
      sorter: true,
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      sorter: false
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '10%',
      render: (_: any, record: CostParameterDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record)} />
          {record.isSystemDefined ? (
            <Popconfirm title="Sistem parametresi silinemez!" disabled>
              <Button danger size="small" icon={<DeleteOutlined />} disabled />
            </Popconfirm>
          ) : (
            <Popconfirm title="Parametreyi silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
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
              placeholder={`Ara (En az 3 karakter)...`} 
              value={searchText}
              onChange={(e) => {
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
            />
          </Col>
          <Col span={8}></Col>
          <Col span={8} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Kayıt</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <OhmTable
        tableName="MaliyetParametreleri"
        tableTitle="Maliyet Parametreleri"
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
        exportExcelUrl={`/CostParameters/export/excel${searchText ? `?search=${encodeURIComponent(searchText)}` : ''}`}
        exportPdfUrl={`/CostParameters/export/pdf${searchText ? `?search=${encodeURIComponent(searchText)}` : ''}`}
      />

      <OhmFormDrawer
        title={editingId ? `Parametre Düzenle` : `Yeni Parametre Kaydı`}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
        initialValues={originalData}
      >
          <Form.Item name="code" label="Parametre Kodu" rules={[{ required: true, message: 'Lütfen parametre kodu giriniz' }]}>
            <Input 
              placeholder="Parametre Kodu" 
              disabled={!!editingId} 
              onChange={(e) => {
                form.setFieldsValue({ code: formatSystemCode(e.target.value) });
              }}
            />
          </Form.Item>
          <Form.Item name="name" label="Parametre Adı" rules={[{ required: true, message: 'Lütfen parametre adı giriniz' }]}>
            <Input placeholder="Parametre Adı" />
          </Form.Item>
          <Form.Item name="percentageValue" label="Yüzde Değeri (%)" rules={[{ required: true, message: 'Lütfen yüzde değeri giriniz' }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} placeholder="Açıklama..." />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default MaliyetParametreleriPage;
