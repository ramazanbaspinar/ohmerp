import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Typography, Space, Input, Form, message, Row, Col, Select, Popconfirm, Tabs } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, EditOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { OhmFormDrawer } from '../components/OhmFormDrawer';
import { getErrorMessage } from '../utils/turkishSearch';
import { OhmInputNumber } from '../components/OhmInputNumber';

const { Text } = Typography;

interface ItemCostDto {
  id: string;
  code: string;
  name: string;
  category: {
    code: string;
    name: string;
  };
  unitCost: number;
  costCurrency: number;
}

const currencyTypes = [
  { value: 1, label: 'TL' },
  { value: 2, label: 'USD' },
  { value: 3, label: 'EUR' }
];

const categoryNames: Record<string, string> = {
  "TEL": "Tel",
  "SAC": "Sac",
  "PIM": "Pim",
  "KUM": "Kum",
  "GAZ": "Kaynak Gazı",
  "TAPA": "Tapa",
  "FLANS": "Flanş",
  "KELEPCE": "Kelepçe",
  "SOKET": "Soket",
  "OMEGA": "Omega",
  "BAGLANTISACI": "Bağlantı Sacı",
  "BAGLANTITELI": "Bağlantı Teli"
};

const HammaddeMaliyetiPage: React.FC = () => {
  const [data, setData] = useState<ItemCostDto[]>([]);
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
  const [activeTab, setActiveTab] = useState('all');

  const [lookupItems, setLookupItems] = useState<{ id: string; name: string }[]>([]);
  const [form] = Form.useForm();

  const getPageTitle = () => {
    if (activeTab && activeTab !== 'all' && categoryNames[activeTab]) {
      return `${categoryNames[activeTab]} Maliyetleri`;
    }
    return 'Tüm Hammadde Maliyetleri';
  };

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchText,
    tab = activeTab,
    sortBy = '',
    sortDesc = false
  ) => {
    setLoading(true);
    try {
      let url = `/Item?page=${page}&pageSize=${size}&hasCost=true`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (tab !== 'all') url += `&categoryCode=${tab}`;
      if (sortBy) {
        url += `&sortBy=${sortBy}&sortDesc=${sortDesc}`;
      }

      const response = await api.get(url);
      setData(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      message.error(`Kayıtlar yüklenirken hata oluştu.`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, activeTab]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 3) {
      fetchData(currentPage, pageSize, debouncedSearchText, activeTab);
    }
  }, [currentPage, pageSize, debouncedSearchText, activeTab, fetchData]);

  const loadLookupItems = async () => {
    try {
      const res = await api.get('/Item/lookup-without-cost', {
        params: activeTab !== 'all' ? { categoryCode: activeTab } : undefined
      });
      setLookupItems(res.data);
    } catch {
      message.error('Hammadde listesi alınamadı.');
    }
  };

  const openDrawerForCreate = async () => {
    setEditingId(null);
    form.resetFields();
    setLookupItems([]);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      await loadLookupItems();
      const initVals = { currency: 1 };
      form.setFieldsValue(initVals);
    } catch {
    } finally {
      setFormLoading(false);
    }
  };

  const openDrawerForEdit = async (record: ItemCostDto) => {
    setEditingId(record.id);
    setIsDrawerVisible(true);
    setFormLoading(true);
    try {
      // Edit modunda hammadde seçimi kapalı olacağı için dropdown'a sadece o kaydı koyuyoruz
      setLookupItems([{ id: record.id, name: `${record.code} - ${record.name}` }]);
      form.setFieldsValue({
        itemId: record.id,
        unitCost: record.unitCost,
        currency: record.costCurrency
      });
    } catch {
      message.error('Kayıt bilgileri alınamadı.');
      setIsDrawerVisible(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const values = await form.validateFields();
      const idToUpdate = editingId || values.itemId;
      
      await api.put(`/Item/${idToUpdate}/cost`, {
        unitCost: values.unitCost,
        currency: values.currency
      });
      
      message.success('Maliyet başarıyla kaydedildi.');
      setIsDrawerVisible(false);
      fetchData(1, pageSize, searchText);
    } catch (error: any) {
      if (error.errorFields) return;
      const errMsg = getErrorMessage(error);
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      await api.delete(`/Item/${id}/cost`);
      message.success('Maliyet başarıyla silindi.');
      fetchData(currentPage, pageSize, searchText);
    } catch {
      message.error('Maliyet silme işlemi başarısız.');
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

    fetchData(
      pagination.current || currentPage, 
      pagination.pageSize || pageSize, 
      searchText, 
      activeTab,
      sortField, 
      sortDesc
    );
  };

  const columns = [
    { 
      title: 'Hammadde Kodu', 
      dataIndex: 'code', 
      key: 'code', 
      width: '15%', 
      sorter: true,
      render: (text: string) => <Text strong>{text}</Text> 
    },
    { 
      title: 'Hammadde Adı', 
      dataIndex: 'name', 
      key: 'name', 
      width: '35%',
      sorter: true
    },
    {
      title: 'Kategori',
      key: 'category',
      width: '15%',
      sorter: true,
      render: (_: any, record: any) => <Text>{record.categoryName}</Text>
    },
    {
      title: 'Birim Maliyet',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: '15%',
      sorter: true,
      render: (val: number) => <Text>{val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
    },
    {
      title: 'Para Birimi',
      dataIndex: 'costCurrency',
      key: 'costCurrency',
      width: '10%',
      sorter: true,
      render: (val: number) => <Text>{currencyTypes.find(x => x.value === val)?.label || val}</Text>
    },
    {
      title: 'İşlemler', 
      key: 'actions', 
      align: 'right' as const, 
      width: '10%',
      render: (_: any, record: ItemCostDto) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawerForEdit(record)} />
          <Popconfirm title="Maliyeti silmek istediğinize emin misiniz?" onConfirm={() => handleDeleteCost(record.id)} okText="Evet" cancelText="Hayır">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: 'all', label: 'Tümü' },
    ...Object.keys(categoryNames).map(key => ({
      key: key,
      label: categoryNames[key]
    }))
  ];

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
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
                fetchData(1, pageSize, value, activeTab);
              }}
              allowClear
              enterButton
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
             <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(currentPage, pageSize, searchText, activeTab)}>Yenile</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openDrawerForCreate}>Yeni Kayıt</Button>
              </Space>
          </Col>
        </Row>
      </div>

      <div style={{ background: '#fff', padding: '0 16px', marginBottom: 16, borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            setCurrentPage(1);
          }} 
          items={tabItems} 
        />
      </div>

      <OhmTable
        tableName={`HammaddeMaliyeti_${activeTab || 'ALL'}`}
        tableTitle={getPageTitle()}
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
        exportExcelUrl={`/Item/export-costs/excel?hasCost=true${activeTab !== 'all' ? `&categoryCode=${activeTab}` : ''}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`}
        exportPdfUrl={`/Item/export-costs/pdf?hasCost=true${activeTab !== 'all' ? `&categoryCode=${activeTab}` : ''}${searchText ? `&search=${encodeURIComponent(searchText)}` : ''}`}
      />

      <OhmFormDrawer
        title={editingId ? `Maliyet Düzenle` : `Yeni Maliyet Kaydı`}
        width={400}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        onSave={handleSave}
        loading={formLoading}
        form={form}
      >
          <Form.Item 
            name="itemId" 
            label="Hammadde Seçimi" 
            rules={[{ required: true, message: 'Lütfen hammadde seçiniz' }]}
          >
            <Select 
              options={lookupItems.map(x => ({ value: x.id, label: x.name }))} 
              disabled={!!editingId}
              showSearch
              optionFilterProp="label"
              placeholder="Maliyeti girilecek hammaddeyi seçin"
            />
          </Form.Item>
          <Form.Item name="unitCost" label="Birim Fiyat" rules={[{ required: true, message: 'Lütfen birim fiyat giriniz' }]}>
            <OhmInputNumber style={{ width: '100%' }} precision={4} />
          </Form.Item>
          <Form.Item name="currency" label="Para Birimi" rules={[{ required: true }]}>
            <Select options={currencyTypes} />
          </Form.Item>
      </OhmFormDrawer>
    </>
  );
};

export default HammaddeMaliyetiPage;
