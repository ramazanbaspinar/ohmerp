import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Space, Typography, Modal, Form, Input, Select, InputNumber, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../services/api';
import { getErrorMessage } from '../utils/turkishSearch';

const { Text } = Typography;
const { Option } = Select;

interface ItemCategoryDto {
  id: string;
  code: string;
  name: string;
  showInMenu: boolean;
  defaultUnitOfMeasureId?: string;
}

interface CategoryAttributeDto {
  id: string;
  itemCategoryId: string;
  name: string;
  dataType: string;
  precision?: number;
  isRequired: boolean;
}

const CategorySettings: React.FC = () => {
  // Category State
  const [categories, setCategories] = useState<ItemCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm] = Form.useForm();
  const [savingCategory, setSavingCategory] = useState(false);

  // Attribute State
  const [attributes, setAttributes] = useState<CategoryAttributeDto[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Attribute Modal State
  const [isAttrModalVisible, setIsAttrModalVisible] = useState(false);
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [attrForm] = Form.useForm();
  const [savingAttr, setSavingAttr] = useState(false);
  const dataType = Form.useWatch('dataType', attrForm);

  // Search State
  const [categorySearch, setCategorySearch] = useState('');
  const [attrSearch, setAttrSearch] = useState('');

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAttributes = attributes.filter(a => 
    a.name.toLowerCase().includes(attrSearch.toLowerCase())
  );

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      // Using lookup for a lighter payload, or simple getAll
      const response = await api.get('/ItemCategory?pageSize=1000');
      setCategories(response.data?.items ?? []);
    } catch {
      message.error('Kategoriler yüklenemedi.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchAttributes = useCallback(async (categoryId: string) => {
    setLoadingAttributes(true);
    try {
      const response = await api.get(`/CategoryAttribute/byCategory/${categoryId}`);
      setAttributes(response.data ?? []);
    } catch {
      message.error('Özellikler yüklenemedi.');
    } finally {
      setLoadingAttributes(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchAttributes(selectedCategoryId);
    } else {
      setAttributes([]);
    }
  }, [selectedCategoryId, fetchAttributes]);

  // CATEGORY ACTIONS
  const openCategoryModal = (record?: ItemCategoryDto) => {
    categoryForm.resetFields();
    if (record) {
      setEditingCategoryId(record.id);
      categoryForm.setFieldsValue(record);
    } else {
      setEditingCategoryId(null);
      categoryForm.setFieldsValue({ isActive: true, showInMenu: false });
    }
    setIsCategoryModalVisible(true);
  };

  const saveCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      setSavingCategory(true);
      if (editingCategoryId) {
        await api.put(`/ItemCategory/${editingCategoryId}`, values);
        message.success('Kategori güncellendi.');
      } else {
        await api.post('/ItemCategory', values);
        message.success('Kategori eklendi.');
      }
      setIsCategoryModalVisible(false);
      fetchCategories();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(getErrorMessage(err));
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/ItemCategory/${id}`);
      message.success('Kategori silindi.');
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      fetchCategories();
    } catch (err: any) {
      message.error(getErrorMessage(err));
    }
  };

  // ATTRIBUTE ACTIONS
  const openAttrModal = (record?: CategoryAttributeDto) => {
    attrForm.resetFields();
    if (record) {
      setEditingAttrId(record.id);
      attrForm.setFieldsValue(record);
    } else {
      setEditingAttrId(null);
      attrForm.setFieldsValue({ dataType: 'Text', isRequired: false });
    }
    setIsAttrModalVisible(true);
  };

  const saveAttribute = async () => {
    try {
      const values = await attrForm.validateFields();
      setSavingAttr(true);
      
      const payload = {
        ...values,
        itemCategoryId: selectedCategoryId
      };

      if (editingAttrId) {
        await api.put(`/CategoryAttribute/${editingAttrId}`, payload);
        message.success('Özellik güncellendi.');
      } else {
        await api.post('/CategoryAttribute', payload);
        message.success('Özellik eklendi.');
      }
      setIsAttrModalVisible(false);
      if (selectedCategoryId) fetchAttributes(selectedCategoryId);
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(getErrorMessage(err));
    } finally {
      setSavingAttr(false);
    }
  };

  const deleteAttribute = async (id: string) => {
    try {
      await api.delete(`/CategoryAttribute/${id}`);
      message.success('Özellik silindi.');
      if (selectedCategoryId) fetchAttributes(selectedCategoryId);
    } catch (err: any) {
      message.error(getErrorMessage(err));
    }
  };

  const categoryColumns = [
    { title: 'Kod', dataIndex: 'code', key: 'code', width: '30%' },
    { title: 'Ad', dataIndex: 'name', key: 'name', width: '50%' },
    {
      title: 'İşlem', key: 'action', align: 'right' as const,
      render: (_: any, record: ItemCategoryDto) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openCategoryModal(record); }} />
          <Popconfirm title="Silinsin mi?" onConfirm={(e) => { e?.stopPropagation(); deleteCategory(record.id); }} onCancel={e => e?.stopPropagation()}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const attrColumns = [
    { title: 'Sıra No', dataIndex: 'sortOrder', key: 'sortOrder', width: 80, align: 'center' as const },
    { title: 'Özellik Adı', dataIndex: 'name', key: 'name' },
    { title: 'Veri Tipi', dataIndex: 'dataType', key: 'dataType', render: (val: string) => <Text>{val === 'Number' ? 'Sayısal' : 'Metin'}</Text> },
    { title: 'Ondalık Hassasiyet', dataIndex: 'precision', key: 'precision', render: (val: number) => val ?? '-' },
    { title: 'Zorunlu', dataIndex: 'isRequired', key: 'isRequired', render: (val: boolean) => val ? <Text type="danger">Evet</Text> : <Text type="secondary">Hayır</Text> },
    {
      title: 'İşlem', key: 'action', align: 'right' as const,
      render: (_: any, record: CategoryAttributeDto) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openAttrModal(record)} />
          <Popconfirm title="Silinsin mi?" onConfirm={() => deleteAttribute(record.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card 
          title="Kategoriler" 
          extra={
            <Space>
              <Input.Search 
                placeholder="Kategori Ara... (En az 3 karakter)" 
                allowClear 
                onChange={e => {
                  const val = e.target.value;
                  if (val.length >= 3 || val.length === 0) {
                    setCategorySearch(val);
                  }
                }}
                onSearch={value => setCategorySearch(value)}
                style={{ width: 150 }} 
                size="small"
              />
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCategoryModal()}>Ekle</Button>
            </Space>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table
            size="small"
            columns={categoryColumns}
            dataSource={filteredCategories}
            rowKey="id"
            loading={loadingCategories}
            pagination={{ pageSize: 15 }}
            onRow={(record) => ({
              onClick: () => setSelectedCategoryId(record.id),
              style: { 
                cursor: 'pointer', 
                background: selectedCategoryId === record.id ? '#e6f7ff' : undefined 
              }
            })}
          />
        </Card>
      </Col>
      <Col span={16}>
        <Card 
          title={<Space><SettingOutlined /> <Text>Kategori Özellikleri (Şablon)</Text></Space>}
          extra={
            <Space>
              <Input.Search 
                placeholder="Özellik Ara... (En az 3 karakter)" 
                allowClear 
                onChange={e => {
                  const val = e.target.value;
                  if (val.length >= 3 || val.length === 0) {
                    setAttrSearch(val);
                  }
                }}
                onSearch={value => setAttrSearch(value)}
                style={{ width: 150 }} 
                size="small"
                disabled={!selectedCategoryId}
              />
              <Button 
                type="primary" 
                size="small"
                icon={<PlusOutlined />} 
                onClick={() => openAttrModal()} 
                disabled={!selectedCategoryId}
              >
                Yeni Özellik Ekle
              </Button>
            </Space>
          }
        >
          {!selectedCategoryId ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              Özelliklerini yönetmek için sol taraftan bir kategori seçiniz.
            </div>
          ) : (
            <Table
              size="small"
              columns={attrColumns}
              dataSource={filteredAttributes}
              rowKey="id"
              loading={loadingAttributes}
              pagination={false}
            />
          )}
        </Card>
      </Col>

      {/* Category Modal */}
      <Modal
        title={editingCategoryId ? "Kategori Düzenle" : "Yeni Kategori"}
        open={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        confirmLoading={savingCategory}
        destroyOnHidden={true}
        okButtonProps={{ htmlType: 'submit', form: 'categoryForm' }}
      >
        <Form id="categoryForm" form={categoryForm} layout="vertical" onFinish={saveCategory}>
          <Form.Item name="code" label="Kod" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Ad" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Durum" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Attribute Modal */}
      <Modal
        title={editingAttrId ? "Özellik Düzenle" : "Yeni Özellik Ekle"}
        open={isAttrModalVisible}
        onCancel={() => setIsAttrModalVisible(false)}
        confirmLoading={savingAttr}
        destroyOnHidden={true}
        okButtonProps={{ htmlType: 'submit', form: 'attrForm' }}
      >
        <Form id="attrForm" form={attrForm} layout="vertical" onFinish={saveAttribute}>
          <Form.Item name="name" label="Özellik Adı (Örn: Tel Çapı)" rules={[{ required: true, message: 'Özellik adı zorunludur' }]}>
            <Input maxLength={100} />
          </Form.Item>
          
          <Form.Item name="dataType" label="Veri Tipi" rules={[{ required: true }]}>
            <Select>
              <Option value="Text">Metin (Text)</Option>
              <Option value="Number">Sayısal (Number)</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="precision" 
            label="Ondalık Hassasiyet" 
            rules={[{ required: dataType === 'Number', message: 'Sayısal tipler için hassasiyet giriniz.' }]}
          >
            <InputNumber 
              min={0} 
              max={4} 
              disabled={dataType !== 'Number'} 
              style={{ width: '100%' }} 
              placeholder="Örn: 2"
            />
          </Form.Item>

          <Form.Item name="sortOrder" label="Sıra No">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Örn: 1" />
          </Form.Item>

          <Form.Item name="isRequired" label="Zorunlu Alan Mı?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default CategorySettings;
