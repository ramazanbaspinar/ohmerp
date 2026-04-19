import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Space, Modal, Form, Input, Select, message, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ExclamationCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import { useAuth } from '../hooks/useAuth';
import { filterOptionTurkish, getErrorMessage } from '../utils/turkishSearch';

const { Option } = Select;
const { confirm } = Modal;

interface DistrictType {
  id: string;
  name: string;
  cityId: string;
  cityName: string; 
}

interface CityLookup {
  id: string;
  name: string;
}

const IlceYonetimi: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<DistrictType[]>([]);
  const [cities, setCities] = useState<CityLookup[]>([]); 
  
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [selectedCityFilter, setSelectedCityFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const isManualSearch = useRef(false);
  const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<DistrictType | null>(null);
  const [form] = Form.useForm();

  const fetchDistricts = useCallback(async (page = currentPage, size = pageSize, search = debouncedSearchText, city = selectedCityFilter) => {
    setLoading(true);
    try {
      let url = `/Districts?page=${page}&pageSize=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (city) url += `&cityId=${city}`;

      const response = await api.get(url);
      setDistricts(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    } catch (error: any) {
      message.error('İlçeler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchText, selectedCityFilter]);

  const fetchCitiesLookup = async () => {
    try {
      const response = await api.get('/Cities/lookup');
      setCities(response.data ?? []);
    } catch (error) {
      message.error('Şehir listesi çekilemedi.');
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
      fetchDistricts(currentPage, pageSize, debouncedSearchText, selectedCityFilter);
    }
  }, [fetchDistricts, currentPage, pageSize, selectedCityFilter, debouncedSearchText]);

  useEffect(() => {
    fetchCitiesLookup(); 
  }, []);

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

  const openModalForEdit = (district: DistrictType) => {
    setEditingDistrict(district);
    form.setFieldsValue({
      name: district.name,
      cityId: district.cityId
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
      if (editingDistrict) {
        await api.put(`/Districts/${editingDistrict.id}`, values);
        message.success('İlçe bilgileri başarıyla güncellendi.');
      } else {
        await api.post('/Districts', values);
        message.success('Yeni ilçe başarıyla eklendi.');
      }
      setIsModalOpen(false);
      setIsFormDirty(false);
      fetchDistricts(1, pageSize, searchText, selectedCityFilter); 
      setCurrentPage(1);
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const deleteDistrict = async (id: string) => {
    try {
      await api.delete(`/Districts/${id}`);
      message.success('İlçe başarıyla silindi.');
      fetchDistricts(currentPage, pageSize, searchText, selectedCityFilter);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Silme işlemi başarısız.'));
    }
  };

  const handleChange = (pagination: any, _filters: any, sorter: any) => {
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
    let qs = `?search=${encodeURIComponent(searchText)}`;
    if (selectedCityFilter) qs += `&cityId=${selectedCityFilter}`;
    return qs;
  };

  const columns = [
    { 
      title: 'İlçe Adı', dataIndex: 'name', key: 'name',
      sorter: (a: DistrictType, b: DistrictType) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
    },
    { 
      title: 'Bağlı Olduğu İl', dataIndex: 'cityName', key: 'cityName',
      sorter: (a: DistrictType, b: DistrictType) => a.cityName.localeCompare(b.cityName),
      sortOrder: sortedInfo.columnKey === 'cityName' ? sortedInfo.order : null,
    },
    {
      title: 'İşlemler', key: 'actions', width: '15%', align: 'right' as const,
      render: (_: any, record: DistrictType) => (
        <Space>
          {hasPermission('Permissions.Districts.Edit') && (
            <Button type="text" icon={<EditOutlined />} style={{ color: '#1890ff' }} onClick={() => openModalForEdit(record)} title="Düzenle" />
          )}
          {hasPermission('Permissions.Districts.Delete') && (
            <Popconfirm title="İlçeyi Sil" description="Bu ilçeyi kalıcı olarak silmek istediğinize emin misiniz?" onConfirm={() => deleteDistrict(record.id)} okText="Evet" cancelText="İptal">
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
          <Col span={6}>
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder="İle Göre Filtrele..."
              optionFilterProp="children"
              filterOption={filterOptionTurkish}
              value={selectedCityFilter}
              onChange={(value) => {
                setSelectedCityFilter(value);
                setCurrentPage(1);
              }}
              loading={cities.length === 0}
            >
              {cities.map(city => (
                <Option key={city.id} value={city.id}>{city.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Input.Search
              placeholder="İlçe Adı Ara... (En az 3 karakter)"
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                isManualSearch.current = false;
              }}
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchDistricts(1, pageSize, value, selectedCityFilter);
              }}
              enterButton
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchDistricts(currentPage, pageSize, searchText, selectedCityFilter)} loading={loading}>Yenile</Button>
              {hasPermission('Permissions.Districts.Create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setEditingDistrict(null);
                  form.resetFields();
                  if (selectedCityFilter) {
                    form.setFieldsValue({ cityId: selectedCityFilter });
                  }
                  setIsFormDirty(false);
                  setIsModalOpen(true);
                }}>Yeni İlçe Ekle</Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable 
        tableName="Ilce_Listesi" 
        tableTitle="İlçe Tanımları" 
        titleIcon={<EnvironmentOutlined />} 
        dataSource={districts} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        onChange={handleChange}
        pagination={{ 
          current: currentPage, 
          pageSize: pageSize, 
          total: totalCount, 
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} arası gösteriliyor. Toplam: ${total} kayıt` 
        }}
        exportExcelUrl={`/Districts/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/Districts/export/pdf${getExportQueryString()}`}
      />

      <Modal title={editingDistrict ? "İlçe Bilgilerini Güncelle" : "Yeni İlçe Ekle"} open={isModalOpen} onCancel={handleModalClose} footer={null} maskClosable={false} destroyOnHidden width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={() => setIsFormDirty(true)}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="cityId" label="Bağlı Olduğu İl" rules={[{ required: true, message: 'Lütfen bir il seçiniz' }]}>
                <Select showSearch placeholder="İl Seçiniz" loading={cities.length === 0} size="large" optionFilterProp="children" filterOption={filterOptionTurkish}>
                  {cities.map(city => (
                    <Option key={city.id} value={city.id}>{city.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="name" label="İlçe Adı" rules={[{ required: true, message: 'İlçe adı zorunlu' }]}>
                <Input size="large" placeholder="Örn: Kadıköy" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              {editingDistrict ? "Değişiklikleri Kaydet" : "Sisteme Kaydet"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IlceYonetimi;