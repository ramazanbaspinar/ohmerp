import React, { useState, useEffect, useMemo } from 'react';
import { 
  Button, Drawer, Form, Input, InputNumber, Switch, 
  Row, Col, message, Tag, Space, Alert, Typography, Select 
} from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import { OhmTable } from '../components/OhmTable';
import { codeTemplateService } from '../services/codeTemplateService';
import { useDebounce } from '../hooks/useDebounce';
import type { CodeTemplateDto, UpdateCodeTemplateRequest } from '../services/codeTemplateService';

const { Text, Title } = Typography;

const NumaratorYonetimi: React.FC = () => {
  const [data, setData] = useState<CodeTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isManualSearch, setIsManualSearch] = useState(false);
  const debouncedSearchText = useDebounce(searchText, 500);
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form] = Form.useForm<UpdateCodeTemplateRequest>();
  
  const [previewPrefix, setPreviewPrefix] = useState('');
  const [previewSuffix, setPreviewSuffix] = useState('');
  const [previewPadding, setPreviewPadding] = useState(5);
  const [previewUseDate, setPreviewUseDate] = useState(false);
  const [previewDateFormat, setPreviewDateFormat] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await codeTemplateService.getAll();
      setData(result);
    } catch (error) {
      message.error('Numaratör şablonları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openDrawerForCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      padding: 5,
      useDate: false,
      isActive: true,
      isManualEntryAllowed: false,
      currentNumber: 1
    });
    setPreviewPrefix('');
    setPreviewSuffix('');
    setPreviewPadding(5);
    setPreviewUseDate(false);
    setPreviewDateFormat('');
    setIsDrawerVisible(true);
  };

  const openDrawerForEdit = (record: CodeTemplateDto) => {
    setEditingId(record.id);
    form.setFieldsValue({
      documentType: record.documentType,
      prefix: record.prefix,
      suffix: record.suffix,
      padding: record.padding,
      useDate: record.useDate,
      dateFormat: record.dateFormat,
      isActive: record.isActive,
      isManualEntryAllowed: record.isManualEntryAllowed,
      currentNumber: record.currentNumber
    } as any);
    setPreviewPrefix(record.prefix || '');
    setPreviewSuffix(record.suffix || '');
    setPreviewPadding(record.padding || 5);
    setPreviewUseDate(record.useDate || false);
    setPreviewDateFormat(record.dateFormat || '');
    setIsDrawerVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!values.useDate) {
        values.dateFormat = null;
      }

      setFormLoading(true);
      if (editingId) {
        await codeTemplateService.update(editingId, values);
        message.success('Şablon başarıyla güncellendi.');
      } else {
        await codeTemplateService.create(values);
        message.success('Şablon başarıyla oluşturuldu.');
      }
      setIsDrawerVisible(false);
      fetchTemplates();
    } catch (error) {
    } finally {
      setFormLoading(false);
    }
  };

  const getDocumentTypeName = (type: number) => {
    switch (type) {
      case 1: return 'Cari Kart';
      case 2: return 'Malzeme Kartı';
      case 3: return 'Makine Tanımları';
      default: return `Bilinmeyen (${type})`;
    }
  };

  const filteredData = useMemo(() => {
    const searchToUse = isManualSearch ? searchText : debouncedSearchText;
    
    if (!isManualSearch && searchToUse.length > 0 && searchToUse.length < 3) {
      return data;
    }

    if (!searchToUse) return data;

    const lowerSearch = searchToUse.toLowerCase();
    return data.filter(item => {
      const moduleName = getDocumentTypeName(item.documentType).toLowerCase();
      const prefixName = (item.prefix || '').toLowerCase();
      return moduleName.includes(lowerSearch) || prefixName.includes(lowerSearch);
    });
  }, [data, searchText, debouncedSearchText, isManualSearch]);

  const columns = [
    { 
      title: 'Modül / Kayıt Tipi', 
      dataIndex: 'documentType', 
      key: 'documentType',
      sorter: (a: CodeTemplateDto, b: CodeTemplateDto) => getDocumentTypeName(a.documentType).localeCompare(getDocumentTypeName(b.documentType)),
      render: (type: number) => <Text strong>{getDocumentTypeName(type)}</Text>
    },
    { 
      title: 'Önek', 
      dataIndex: 'prefix', 
      key: 'prefix',
      sorter: (a: CodeTemplateDto, b: CodeTemplateDto) => (a.prefix || '').localeCompare(b.prefix || '')
    },
    { 
      title: 'Sonek', 
      dataIndex: 'suffix', 
      key: 'suffix',
      sorter: (a: CodeTemplateDto, b: CodeTemplateDto) => (a.suffix || '').localeCompare(b.suffix || '')
    },
    { title: 'Sayı Uzunluğu', dataIndex: 'padding', key: 'padding' },
    { title: 'Tarih Formatı', dataIndex: 'dateFormat', key: 'dateFormat' },
    { title: 'Son Numara', dataIndex: 'currentNumber', key: 'currentNumber' },
    { 
      title: 'Manuel Giriş', 
      dataIndex: 'isManualEntryAllowed', 
      key: 'isManualEntryAllowed',
      render: (allowed: boolean) => allowed ? <Tag color="orange">Açık</Tag> : <Tag color="blue">Kapalı</Tag>
    },
    { 
      title: 'Durum', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (active: boolean) => active ? <Tag color="success">Aktif</Tag> : <Tag color="error">Pasif</Tag>
    },
    {
      title: 'İşlemler',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: CodeTemplateDto) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EditOutlined />} 
          onClick={() => openDrawerForEdit(record)}
        >
          Düzenle
        </Button>
      )
    }
  ];

  const generatedPreview = useMemo(() => {
    let result = '';
    if (previewPrefix) result += previewPrefix + '-';
    
    if (previewUseDate && previewDateFormat) {
      const today = new Date();
      let yyyy = today.getFullYear().toString();
      let yy = yyyy.substring(2);
      let mm = (today.getMonth() + 1).toString().padStart(2, '0');
      let dd = today.getDate().toString().padStart(2, '0');
      
      let formattedDate = previewDateFormat;
      formattedDate = formattedDate.replace('yyyy', yyyy);
      formattedDate = formattedDate.replace('yy', yy);
      formattedDate = formattedDate.replace('MM', mm);
      formattedDate = formattedDate.replace('dd', dd);
      
      result += formattedDate + '-';
    }

    const num = '1'.padStart(previewPadding, '0');
    result += num;
    if (previewSuffix) result += '-' + previewSuffix;
    return result;
  }, [previewPrefix, previewSuffix, previewPadding, previewUseDate, previewDateFormat]);

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col span={16}>
            <Space align="center">
              <SettingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>Numaratör Yönetimi</Title>
            </Space>
          </Col>
          <Col span={8}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Input.Search 
                placeholder="Modül veya Önek Ara... (En az 3 karakter)" 
                allowClear
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setIsManualSearch(false);
                }}
                onSearch={(value) => {
                  setSearchText(value);
                  setIsManualSearch(true);
                }}
                style={{ width: 250 }}
              />
              <Button type="primary" onClick={openDrawerForCreate}>Yeni Ekle</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <OhmTable 
        tableName="Numarator_Yonetimi"
        tableTitle="Numaratör Şablonları"
        exportExcelUrl="/CodeTemplates/export/excel"
        exportPdfUrl="/CodeTemplates/export/pdf"
        dataSource={filteredData} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        pagination={false}
      />

      <Drawer
        title="Şablon Düzenle"
        width={500}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)}>İptal</Button>
            <Button type="primary" loading={formLoading} onClick={handleSave}>Kaydet</Button>
          </Space>
        }
      >
        <Form 
          layout="vertical" 
          form={form}
          onValuesChange={(changedValues) => {
            if (changedValues.prefix !== undefined) setPreviewPrefix(changedValues.prefix);
            if (changedValues.suffix !== undefined) setPreviewSuffix(changedValues.suffix);
            if (changedValues.padding !== undefined) setPreviewPadding(changedValues.padding);
            if (changedValues.useDate !== undefined) setPreviewUseDate(changedValues.useDate);
            if (changedValues.dateFormat !== undefined) setPreviewDateFormat(changedValues.dateFormat);
          }}
        >
          <Alert 
            message="Canlı Önizleme" 
            description={<Text strong style={{ fontSize: '18px', color: '#1890ff' }}>{generatedPreview}</Text>} 
            type="info" 
            showIcon 
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="documentType" label="Modül / Kayıt Tipi" rules={[{ required: true, message: 'Zorunlu' }]}>
                <Select disabled={!!editingId}>
                  <Select.Option value={1}>Cari Kart</Select.Option>
                  <Select.Option value={2}>Malzeme Kartı</Select.Option>
                  <Select.Option value={3}>Makine Tanımları</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prefix" label="Önek">
                <Input placeholder="Örn: CAR" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="suffix" label="Sonek">
                <Input placeholder="İsteğe bağlı" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="padding" label="Sayı Uzunluğu" rules={[{ required: true, message: 'Zorunlu' }]}>
                <InputNumber min={3} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentNumber" label="Son Numara" rules={[{ required: true, message: 'Zorunlu' }]}>
                <InputNumber min={1} max={2147483647} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="useDate" label="Tarih Kullan" valuePropName="checked">
                <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.useDate !== currentValues.useDate}
              >
                {({ getFieldValue }) => (
                  <Form.Item name="dateFormat" label="Tarih Formatı">
                    <Select disabled={!getFieldValue('useDate')} placeholder="Seçiniz" allowClear>
                      <Select.Option value="yyyy">yyyy</Select.Option>
                      <Select.Option value="yy">yy</Select.Option>
                      <Select.Option value="yyyyMM">yyyyMM</Select.Option>
                      <Select.Option value="yyMM">yyMM</Select.Option>
                      <Select.Option value="yyyyMMdd">yyyyMMdd</Select.Option>
                      <Select.Option value="yyMMdd">yyMMdd</Select.Option>
                      <Select.Option value="MMyy">MMyy</Select.Option>
                    </Select>
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isManualEntryAllowed" label="Manuel Girişe İzin Ver" valuePropName="checked">
                <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Durum" valuePropName="checked">
                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Drawer>
    </>
  );
};

export default NumaratorYonetimi;
