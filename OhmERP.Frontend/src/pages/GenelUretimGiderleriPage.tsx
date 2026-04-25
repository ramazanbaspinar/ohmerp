import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, message, Row, Col, Select, Popconfirm, Switch, Table } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { getErrorMessage } from '../utils/turkishSearch';
import { OhmInputNumber } from '../components/OhmInputNumber';

const { Text } = Typography;

interface OverheadCostDto {
  id: string;
  code: string;
  name: string;
  monthlyAmount: number;
  currency: number;
  description: string;
  isActive: boolean;
}

const currencyTypes = [
  { value: 1, label: 'TL' },
  { value: 2, label: 'USD' },
  { value: 3, label: 'EUR' }
];

const GenelUretimGiderleriPage: React.FC = () => {
  const [data, setData] = useState<OverheadCostDto[]>([]);
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

  const [currencyRates, setCurrencyRates] = useState<any[]>([]);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/CurrencyRates/today');
        setCurrencyRates(res.data || []);
      } catch {
        console.error("Kurlar çekilemedi.");
      }
    };
    fetchRates();
  }, []);

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchText,
    sortBy = '',
    sortDesc = false
  ) => {
    setLoading(true);
    try {
      let url = `/OverheadCosts?page=${page}&pageSize=${size}`;
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

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    
    try {
      setFormLoading(true);
      const res = await api.get('/Numerator/PreviewNextCode/4');
      if (res.data && res.data.nextCode) {
        const initial = { code: res.data.nextCode, currency: 1, isActive: true };
        form.setFieldsValue(initial);
        setOriginalData(initial);
      } else {
        const initial = { currency: 1, isActive: true };
        form.setFieldsValue(initial);
        setOriginalData(initial);
      }
    } catch {
      const initial = { currency: 1, isActive: true };
      form.setFieldsValue(initial);
      setOriginalData(initial);
    } finally {
      setFormLoading(false);
      setIsDrawerVisible(true);
    }
  };

  const openDrawerForEdit = (record: OverheadCostDto) => {
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
        await api.put(`/OverheadCosts/${editingId}`, values);
        message.success('Kayıt başarıyla güncellendi.');
      } else {
        await api.post('/OverheadCosts', values);
        message.success('Kayıt başarıyla eklendi.');
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
      await api.delete(`/OverheadCosts/${id}`);
      message.success('Kayıt başarıyla silindi.');
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
      title: 'Gider Kodu', 
      dataIndex: 'code', 
      key: 'code', 
      width: '15%', 
      sorter: true,
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Gider Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '25%',
      sorter: true
    },
    {
      title: 'Aylık Tutar',
      dataIndex: 'monthlyAmount',
      key: 'monthlyAmount',
      width: '15%',
      sorter: true,
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: '10%',
      sorter: true,
      render: (val: number) => <Text>{currencyTypes.find(x => x.value === val)?.label || val}</Text>
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      width: '20%',
      sorter: false
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '10%',
      sorter: true,
      render: (val: boolean) => <Text>{val ? 'Aktif' : 'Pasif'}</Text>
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '5%',
      render: (_: any, record: OverheadCostDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record)} />
          <Popconfirm title="Kaydı silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(record.id)} okText="Evet" cancelText="Hayır">
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
        tableName="GenelUretimGiderleri"
        tableTitle="Genel Üretim Giderleri"
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
        exportExcelUrl={`/OverheadCosts/export/excel${searchText ? `?search=${encodeURIComponent(searchText)}` : ''}`}
        exportPdfUrl={`/OverheadCosts/export/pdf${searchText ? `?search=${encodeURIComponent(searchText)}` : ''}`}
        summary={(pageData) => {
          let totalAmountInTl = 0;
          let usdRate = currencyRates.find(x => x.currencyCode === 'USD')?.sellingRate || 1;
          let eurRate = currencyRates.find(x => x.currencyCode === 'EUR')?.sellingRate || 1;

          pageData.forEach(({ monthlyAmount, currency }) => {
            if (currency === 2) totalAmountInTl += monthlyAmount * usdRate;
            else if (currency === 3) totalAmountInTl += monthlyAmount * eurRate;
            else totalAmountInTl += monthlyAmount;
          });

          return (
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={2} align="right">
                <Text strong>Genel Toplam (TL):</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>{totalAmountInTl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={4}></Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />

      <OhmFormDrawer
        title={editingId ? `Gider Düzenle` : `Yeni Gider Kaydı`}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
        initialValues={originalData}
      >
          <Form.Item name="code" label="Gider Kodu" rules={[{ required: true, message: 'Lütfen gider kodu giriniz' }]}>
            <Input placeholder="Gider Kodu" />
          </Form.Item>
          <Form.Item name="name" label="Gider Adı" rules={[{ required: true, message: 'Lütfen gider adı giriniz' }]}>
            <Input placeholder="Gider Adı" />
          </Form.Item>
          <Form.Item name="monthlyAmount" label="Aylık Tutar" rules={[{ required: true, message: 'Lütfen aylık tutar giriniz' }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="currency" label="Para Birimi" rules={[{ required: true }]}>
            <Select options={currencyTypes} />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} placeholder="Açıklama..." />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default GenelUretimGiderleriPage;
