import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Space, Modal, Form, Input, message, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ExclamationCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/turkishSearch';

const { confirm } = Modal;

interface CityType {
  id: string;
  name: string;
  plateCode: string;
}

const IlYonetimi: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<CityType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [editingCity, setEditingCity] = useState<CityType | null>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});
  
  const [form] = Form.useForm();

  const fetchCities = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText) => {
    setLoading(true);
    try {
      let url = `/Cities?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await api.get(url);
      setCities(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    } catch (error: any) {
      message.error('İller yüklenirken hata oluştu.');
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
    if (debouncedSearchText.length === 0 || debouncedSearchText.length >= 2) {
      fetchCities(currentPage, pageSize, debouncedSearchText);
    }
  }, [fetchCities, currentPage, pageSize, debouncedSearchText]);

  const handleModalClose = () => {
    if (isFormDirty) {
      confirm({
        title: 'Kaydedilmemiş Değişiklikler Var!',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }}/>,
        content: 'Formda yaptığınız değişiklikleri kaydetmeden çıkmak istediğinize emin misiniz?',
        okText: 'Evet, Çık',
        cancelText: 'Hayır, Devam Et',
        onOk() {
          setIsModalOpen(false);
          setIsFormDirty(false);
        },
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const openModalForEdit = (city: CityType) => {
    setEditingCity(city);
    form.setFieldsValue({
      name: city.name,
      plateCode: city.plateCode
    });
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    setLoading(true);
    try {
      if (editingCity) {
        await api.put(`/Cities/${editingCity.id}`, values);
        message.success('İl bilgileri başarıyla güncellendi.');
      } else {
        await api.post('/Cities', values);
        message.success('Yeni il başarıyla eklendi.');
      }
      setIsModalOpen(false);
      setIsFormDirty(false);
      fetchCities(1, pageSize, searchText); 
      setCurrentPage(1);
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const deleteCity = async (id: string) => {
    try {
      await api.delete(`/Cities/${id}`);
      message.success('İl başarıyla silindi.');
      fetchCities(currentPage, pageSize, searchText);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Silme işlemi başarısız.'));
    }
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setSortedInfo(sorter);
    if (pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1); 
    }
  };

  const getExportQueryString = () => {
    return searchText ? `?search=${encodeURIComponent(searchText)}` : '';
  };

  const columns = [
    { 
      title: 'Plaka Kodu', dataIndex: 'plateCode', key: 'plateCode', width: '15%',
      sorter: (a: CityType, b: CityType) => a.plateCode.localeCompare(b.plateCode),
      sortOrder: sortedInfo.columnKey === 'plateCode' ? sortedInfo.order : null,
    },
    { 
      title: 'İl Adı', dataIndex: 'name', key: 'name',
      sorter: (a: CityType, b: CityType) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
    },
    {
      title: 'İşlemler', key: 'actions', width: '15%', align: 'right' as const,
      render: (_: any, record: CityType) => (
        <Space>
          {hasPermission('Permissions.Cities.Edit') && (
            <Button type="text" icon={<EditOutlined />} style={{ color: '#1890ff' }} onClick={() => openModalForEdit(record)} title="Düzenle" />
          )}
          {hasPermission('Permissions.Cities.Delete') && (
            <Popconfirm title="İli Sil" description="Bu ili kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={() => deleteCity(record.id)} okText="Evet" cancelText="İptal">
              <Button type="text" danger icon={<DeleteOutlined />} title="Sil" />
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
          <Col span={12}>
            <Input.Search
              placeholder="İl Adı veya Plaka Ara... (En az 2 karakter)"
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }}
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchCities(1, pageSize, value);
              }}
              enterButton
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchCities(currentPage, pageSize, searchText)} loading={loading}>Yenile</Button>
              {hasPermission('Permissions.Cities.Create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setEditingCity(null);
                  form.resetFields();
                  setIsFormDirty(false);
                  setIsModalOpen(true);
                }}>Yeni İl Ekle</Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable 
        tableName="Il_Listesi" 
        tableTitle="İl Tanımları" 
        titleIcon={<GlobalOutlined />} 
        dataSource={cities} 
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
        exportExcelUrl={`/Cities/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/Cities/export/pdf${getExportQueryString()}`}
      />

      <Modal title={editingCity ? "İl Bilgilerini Güncelle" : "Yeni İl Ekle"} open={isModalOpen} onCancel={handleModalClose} footer={null} maskClosable={false} destroyOnClose width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={() => setIsFormDirty(true)}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plateCode" label="Plaka Kodu" rules={[{ required: true, message: 'Plaka zorunlu' }, { max: 2, message: 'En fazla 2 karakter' }]}>
                <Input size="large" placeholder="Örn: 34" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="İl Adı" rules={[{ required: true, message: 'İl adı zorunlu' }]}>
                <Input size="large" placeholder="Örn: İstanbul" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              {editingCity ? "Değişiklikleri Kaydet" : "Sisteme Kaydet"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IlYonetimi;