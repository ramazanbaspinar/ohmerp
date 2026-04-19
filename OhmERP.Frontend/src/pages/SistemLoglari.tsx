import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Modal, Button, Tag, Typography, Row, Col, Select, Input, Space, DatePicker } from 'antd';
import { SafetyCertificateOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import api from '../services/api';
import { OhmTable } from '../components/OhmTable';
import dayjs from 'dayjs';
import { filterOptionTurkish } from '../utils/turkishSearch';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AuditLogType {
  id: string;
  userId: string | null;
  type: string;
  tableName: string;
  dateTime: string;
  oldValues: string;
  newValues: string;
  affectedColumns: string;
  primaryKey: string;
}

interface UserLookupType {
  id: string;
  firstName: string;
  lastName: string;
}

const SistemLoglari: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [userDictionary, setUserDictionary] = useState<Record<string, string>>({});
  const [usersList, setUsersList] = useState<UserLookupType[]>([]); 
  
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);

  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterTableName, setFilterTableName] = useState<string>('');
  const debouncedTableName = useDebounce(filterTableName, 500);
  const isManualSearch = useRef(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchUserDictionary = async () => {
    try {
      const response = await api.get('/User?page=1&pageSize=1000'); 
      const users: UserLookupType[] = response.data.items || [];
      
      setUsersList(users); 
      
      const dictionary: Record<string, string> = {};
      users.forEach(u => {
        dictionary[u.id] = `${u.firstName} ${u.lastName}`;
      });
      setUserDictionary(dictionary);
    } catch (error) {
      console.error('Kullanıcı sözlüğü yüklenemedi');
    }
  };

  const fetchLogs = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    userId = filterUserId, 
    type = filterType, 
    tableName = debouncedTableName,
    dates = dateRange
  ) => {
    setLoading(true);
    try {
      let query = `/AuditLog?page=${page}&pageSize=${size}`;
      if (userId) query += `&userId=${userId}`;
      if (type) query += `&type=${type}`;
      if (tableName) query += `&tableName=${encodeURIComponent(tableName)}`;
      
      if (dates && dates.length === 2) {
        query += `&startDate=${dates[0].format('YYYY-MM-DDTHH:mm:ss')}&endDate=${dates[1].format('YYYY-MM-DDTHH:mm:ss')}`;
      }

      const response = await api.get(query);
      setLogs(response.data.items);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Loglar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterUserId, filterType, debouncedTableName, dateRange]);

  useEffect(() => { 
    fetchUserDictionary(); 
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTableName]);

  useEffect(() => {
    if (isManualSearch.current) {
      isManualSearch.current = false;
      return;
    }
    if (debouncedTableName.length === 0 || debouncedTableName.length >= 3) {
      fetchLogs(currentPage, pageSize, filterUserId, filterType, debouncedTableName, dateRange);
    }
  }, [fetchLogs, currentPage, pageSize, filterUserId, filterType, debouncedTableName, dateRange]);

  const handleTableChange = (pagination: any) => {
    if (pagination.current && pagination.current !== currentPage) setCurrentPage(pagination.current);
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1);
    }
  };

  const showDetails = (record: AuditLogType) => {
    setSelectedLog(record);
    setIsModalVisible(true);
  };

  const clearFilters = () => {
    setFilterUserId(null);
    setFilterType(null);
    setFilterTableName('');
    setDateRange(null);
    setCurrentPage(1);
    fetchLogs(1, pageSize, null, null, '', null);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchLogs(1, pageSize, filterUserId, filterType, debouncedTableName, dateRange);
  };

  const getActionTag = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ADDED': return <Tag color="green">YENİ KAYIT</Tag>;
      case 'MODIFIED': return <Tag color="orange">GÜNCELLEME</Tag>;
      case 'DELETED': return <Tag color="red">KALICI SİLME</Tag>;
      case 'SOFTDELETED': return <Tag color="volcano">SİLME (ÇÖP)</Tag>;
      case 'RESTORED': return <Tag color="blue">GERİ YÜKLEME</Tag>;
      default: return <Tag color="default">{type}</Tag>;
    }
  };

  const formatDateTime = (utcDateString: string) => {
    if (!utcDateString) return '-';
    return dayjs(utcDateString).format('DD.MM.YYYY HH:mm');
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') return 'Sistem (Otomatik)';
    return userDictionary[userId] || userId; 
  };

  const getExportQueryString = () => {
    let qs = '';
    const params = [];
    if (filterUserId) params.push(`userId=${filterUserId}`);
    if (filterType) params.push(`type=${filterType}`);
    if (filterTableName) params.push(`tableName=${encodeURIComponent(filterTableName)}`);
    if (dateRange && dateRange.length === 2) {
      params.push(`startDate=${dateRange[0].format('YYYY-MM-DDTHH:mm:ss')}`);
      params.push(`endDate=${dateRange[1].format('YYYY-MM-DDTHH:mm:ss')}`);
    }
    if (params.length > 0) {
      qs = '?' + params.join('&');
    }
    return qs;
  };

  const columns = [
    {
      title: 'İşlem Zamanı', dataIndex: 'dateTime', key: 'dateTime', width: '20%',
      sorter: (a: AuditLogType, b: AuditLogType) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      render: (text: string) => formatDateTime(text) 
    },
    {
      title: 'İşlemi Yapan', dataIndex: 'userId', key: 'userId', width: '15%',
      sorter: (a: AuditLogType, b: AuditLogType) => getUserName(a.userId).localeCompare(getUserName(b.userId)),
      render: (text: string) => <Text strong>{getUserName(text)}</Text> 
    },
    {
      title: 'İşlem Tipi', dataIndex: 'type', key: 'type', width: '15%',
      sorter: (a: AuditLogType, b: AuditLogType) => a.type.localeCompare(b.type),
      render: (text: string) => getActionTag(text)
    },
    {
      title: 'Modül / Tablo', dataIndex: 'tableName', key: 'tableName', width: '15%',
      sorter: (a: AuditLogType, b: AuditLogType) => a.tableName.localeCompare(b.tableName),
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'İşlemler', key: 'actions', align: 'right' as const, width: '10%',
      render: (_: any, record: AuditLogType) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => showDetails(record)}>
          Detay
        </Button>
      )
    }
  ];

  const formatJson = (str: string) => {
    try { 
      const obj = JSON.parse(str); 
      const beautifiedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.includes('T') && value.includes('Z') === false && !value.includes(' ')) {
             const dateAttempt = new Date(value);
             if (!isNaN(dateAttempt.getTime()) && value.length > 10) {
                 beautifiedObj[key] = formatDateTime(value);
                 continue;
             }
        }
        if ((key === 'CreatedBy' || key === 'UpdatedBy' || key === 'DeletedBy') && typeof value === 'string') {
            beautifiedObj[key] = getUserName(value);
            continue;
        }
        beautifiedObj[key] = value;
      }
      return JSON.stringify(beautifiedObj, null, 2); 
    } catch { return "Veri yok veya okunamadı"; }
  };

  const safeExtractPrimaryKey = (str: string) => {
    try {
      const obj = JSON.parse(str);
      return obj.Id || obj.id || str;
    } catch {
      return str;
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16, padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <RangePicker 
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }} 
              format="DD.MM.YYYY HH:mm"
              placeholder={['Başlangıç', 'Bitiş']}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
              }}
            />
          </Col>
          <Col span={4}>
            <Select
              showSearch
              allowClear
              placeholder="Kullanıcı"
              style={{ width: '100%' }}
              optionFilterProp="children"
              filterOption={filterOptionTurkish}
              value={filterUserId}
              onChange={(value) => setFilterUserId(value)}
            >
              {usersList.map(u => <Option key={u.id} value={u.id}>{u.firstName} {u.lastName}</Option>)}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={filterOptionTurkish}
              placeholder="İşlem Tipi"
              style={{ width: '100%' }}
              value={filterType}
              onChange={(value) => setFilterType(value)}
            >
              <Option value="Added">YENİ KAYIT</Option>
              <Option value="Modified">GÜNCELLEME</Option>
              <Option value="Deleted">KALICI SİLME</Option>
              <Option value="SoftDeleted">SİLME (ÇÖP)</Option>
              <Option value="Restored">GERİ YÜKLEME</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Input.Search
              placeholder="Tablo Adı (En az 3 karakter)"
              value={filterTableName}
              onChange={(e) => {
                setFilterTableName(e.target.value);
                isManualSearch.current = false;
              }}
              onSearch={(value) => {
                isManualSearch.current = true;
                setCurrentPage(1);
                fetchLogs(1, pageSize, filterUserId, filterType, value, dateRange);
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              {(filterUserId || filterType || filterTableName || dateRange) && (
                 <Button danger icon={<ClearOutlined />} onClick={clearFilters}>Temizle</Button>
              )}
              <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters}>Filtrele</Button>
              <Button icon={<ReloadOutlined />} onClick={applyFilters}>Yenile</Button>
            </Space>
          </Col>
        </Row>
      </div>
      <OhmTable
        tableName="Sistem_Loglari"
        tableTitle="Sistem Denetim İzleri (Audit Logs)"
        titleIcon={<SafetyCertificateOutlined />}
        dataSource={logs}
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
        exportExcelUrl={`/AuditLog/export/excel${getExportQueryString()}`}
        exportPdfUrl={`/AuditLog/export/pdf${getExportQueryString()}`}
      />

      <Modal
        title={<><SafetyCertificateOutlined /> İşlem Detayları</>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedLog && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <Text type="secondary">İşlemi Yapan Kişi:</Text> <br/>
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>{getUserName(selectedLog.userId)}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">İşlem Zamanı:</Text> <br/>
                <Text strong>{formatDateTime(selectedLog.dateTime)}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Sistem Kayıt ID (Primary Key):</Text> <br/>
                <Text strong>{safeExtractPrimaryKey(selectedLog.primaryKey)}</Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>Eski Veri Durumu</Title>
                <div style={{ padding: 15, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', fontSize: '14px', color: '#cf1322' }}>
                    {formatJson(selectedLog.oldValues)}
                  </pre>
                </div>
              </Col>
              <Col span={12}>
                <Title level={5}>Yeni Veri Durumu</Title>
                <div style={{ padding: 15, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
                   <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', fontSize: '14px', color: '#389e0d' }}>
                    {formatJson(selectedLog.newValues)}
                  </pre>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SistemLoglari;