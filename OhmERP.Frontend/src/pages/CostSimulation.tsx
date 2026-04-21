import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Select, Button, Statistic, Tabs, Table, message, Typography 
} from 'antd';
import { 
  CalculatorOutlined, DollarOutlined, EuroOutlined, PercentageOutlined,
  GoldOutlined, SettingOutlined, TagOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { OhmInputNumber } from '../components/OhmInputNumber';
import { filterOptionTurkish } from '../utils/turkishSearch';

const { Title, Text } = Typography;
const { Option } = Select;

interface BOMListDto {
  id: string;
  code: string;
  name: string;
  itemName: string;
}

interface MaterialCostDetail {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  scrapRate: number;
  netQuantity: number;
  unitPrice: number;
  currency: number;
  totalCost: number;
}

interface OperationCostDetail {
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  operationOrder: number;
  setupTime: number;
  runTime: number;
  totalTimeMinutes: number;
  hourlyMachineCost: number;
  hourlyLaborCost: number;
  currency: number;
  totalCost: number;
}

interface CostCalculationResult {
  totalMaterialCost: number;
  totalOperationCost: number;
  grandTotalCost: number;
  materialDetails: MaterialCostDetail[];
  operationDetails: OperationCostDetail[];
}

const CostSimulation: React.FC = () => {
  const [boms, setBoms] = useState<BOMListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [usdRate, setUsdRate] = useState<number>(0);
  const [eurRate, setEurRate] = useState<number>(0);
  const [margin, setMargin] = useState<number>(20);
  
  const [result, setResult] = useState<CostCalculationResult | null>(null);

  useEffect(() => {
    const fetchBOMs = async () => {
      setLoading(true);
      try {
        const response = await api.get('/BOMs?pageSize=1000&isActive=true');
        setBoms(response.data.items || []);
      } catch {
        message.error('Reçete listesi alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBOMs();
  }, []);

  const handleCalculate = async () => {
    if (!selectedBomId) {
      message.warning('Lütfen hesaplama yapmak için bir reçete seçiniz.');
      return;
    }
    
    setCalculating(true);
    try {
      const response = await api.post('/CostEngine/calculate', {
        bomId: selectedBomId,
        currentUsdRate: usdRate || 0,
        currentEurRate: eurRate || 0
      });
      setResult(response.data);
      message.success('Maliyet hesaplaması başarıyla tamamlandı.');
    } catch {
      message.error('Maliyet hesaplanırken bir hata oluştu.');
    } finally {
      setCalculating(false);
    }
  };

  const getCurrencySymbol = (currencyEnum: number) => {
    switch (currencyEnum) {
      case 2: return '$';
      case 3: return '€';
      default: return '₺';
    }
  };

  const materialColumns = [
    { title: 'Malzeme Kodu', dataIndex: 'materialCode', key: 'materialCode' },
    { title: 'Malzeme Adı', dataIndex: 'materialName', key: 'materialName' },
    { title: 'Birim Fiyat', dataIndex: 'unitPrice', key: 'unitPrice', render: (val: number, rec: any) => `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${getCurrencySymbol(rec.currency)}` },
    { title: 'Reçete Miktarı', dataIndex: 'quantity', key: 'quantity', render: (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) },
    { title: 'Fire (%)', dataIndex: 'scrapRate', key: 'scrapRate', render: (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) },
    { title: 'Net Miktar (Fireli)', dataIndex: 'netQuantity', key: 'netQuantity', render: (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) },
    { title: 'Toplam Tutar (TL)', dataIndex: 'totalCost', key: 'totalCost', render: (val: number) => <Text strong>{val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text> }
  ];

  const operationColumns = [
    { title: 'İş Merkezi Kodu', dataIndex: 'workCenterCode', key: 'workCenterCode' },
    { title: 'İş Merkezi Adı', dataIndex: 'workCenterName', key: 'workCenterName' },
    { title: 'Sıra', dataIndex: 'operationOrder', key: 'operationOrder' },
    { title: 'Hazırlık (Dk)', dataIndex: 'setupTime', key: 'setupTime' },
    { title: 'İşlem (Dk)', dataIndex: 'runTime', key: 'runTime' },
    { title: 'Toplam Süre (Dk)', dataIndex: 'totalTimeMinutes', key: 'totalTimeMinutes', render: (val: number) => <Text strong>{val}</Text> },
    { title: 'Saatlik Maliyet', key: 'hourlyCost', render: (_: any, rec: any) => `${(rec.hourlyMachineCost + rec.hourlyLaborCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${getCurrencySymbol(rec.currency)}` },
    { title: 'Toplam Tutar (TL)', dataIndex: 'totalCost', key: 'totalCost', render: (val: number) => <Text strong>{val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text> }
  ];

  const suggestedPrice = result ? result.grandTotalCost * (1 + (margin || 0) / 100) : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}><CalculatorOutlined /> Satış ve Teklif Maliyet Simülatörü</Title>
      
      <Card bordered={false} style={{ marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: 8 }}><Text strong>Ürün Reçetesi (BOM)</Text></div>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Reçete Seçiniz"
              optionFilterProp="children"
              filterOption={filterOptionTurkish}
              loading={loading}
              value={selectedBomId}
              onChange={setSelectedBomId}
              size="large"
            >
              {boms.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.code} - {b.name} ({b.itemName})
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8 }}><Text strong><DollarOutlined /> Güncel USD Kuru</Text></div>
            <OhmInputNumber 
              value={usdRate} 
              onChange={(val: any) => setUsdRate(Number(val) || 0)} 
              precision={4} 
              style={{ width: '100%' }} 
              size="large" 
            />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8 }}><Text strong><EuroOutlined /> Güncel EUR Kuru</Text></div>
            <OhmInputNumber 
              value={eurRate} 
              onChange={(val: any) => setEurRate(Number(val) || 0)} 
              precision={4} 
              style={{ width: '100%' }} 
              size="large" 
            />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8 }}><Text strong><PercentageOutlined /> Kar Marjı (%)</Text></div>
            <OhmInputNumber 
              value={margin} 
              onChange={(val: any) => setMargin(Number(val) || 0)} 
              precision={2} 
              style={{ width: '100%' }} 
              size="large" 
            />
          </Col>
          <Col span={4} style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <Button 
              type="primary" 
              icon={<ArrowRightOutlined />} 
              size="large" 
              block 
              onClick={handleCalculate}
              loading={calculating}
              style={{ height: '40px' }}
            >
              Maliyeti Hesapla
            </Button>
          </Col>
        </Row>
      </Card>

      {result && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f', borderWidth: 1, borderStyle: 'solid' }}>
                <Statistic
                  title={<Text strong style={{ color: '#52c41a' }}><GoldOutlined /> Hammadde Maliyeti</Text>}
                  value={result.totalMaterialCost}
                  precision={2}
                  suffix="₺"
                  valueStyle={{ color: '#389e0d', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ background: '#e6f7ff', borderColor: '#91d5ff', borderWidth: 1, borderStyle: 'solid' }}>
                <Statistic
                  title={<Text strong style={{ color: '#1890ff' }}><SettingOutlined /> İşçilik & Makine Maliyeti</Text>}
                  value={result.totalOperationCost}
                  precision={2}
                  suffix="₺"
                  valueStyle={{ color: '#096dd9', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ background: '#fffb8f', borderColor: '#ffe58f', borderWidth: 1, borderStyle: 'solid' }}>
                <Statistic
                  title={<Text strong style={{ color: '#d48806' }}><CalculatorOutlined /> Net Üretim Maliyeti</Text>}
                  value={result.grandTotalCost}
                  precision={2}
                  suffix="₺"
                  valueStyle={{ color: '#ad6800', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ background: '#1890ff', color: 'white' }}>
                <Statistic
                  title={<Text strong style={{ color: '#e6f7ff' }}><TagOutlined /> Önerilen Satış Fiyatı</Text>}
                  value={suggestedPrice}
                  precision={2}
                  suffix="₺"
                  valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '28px' }}
                />
              </Card>
            </Col>
          </Row>

          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Tabs defaultActiveKey="1" size="large">
              <Tabs.TabPane tab={<span><GoldOutlined /> Hammadde Detayları</span>} key="1">
                <Table 
                  dataSource={result.materialDetails} 
                  columns={materialColumns} 
                  rowKey="materialId" 
                  pagination={false}
                  size="middle"
                  summary={pageData => {
                    let total = 0;
                    pageData.forEach(({ totalCost }) => {
                      total += totalCost;
                    });
                    return (
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={6}><Text strong>Genel Toplam</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1}><Text type="danger" strong>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span><SettingOutlined /> Operasyon Detayları</span>} key="2">
                <Table 
                  dataSource={result.operationDetails} 
                  columns={operationColumns} 
                  rowKey="workCenterId" 
                  pagination={false}
                  size="middle"
                  summary={pageData => {
                    let total = 0;
                    pageData.forEach(({ totalCost }) => {
                      total += totalCost;
                    });
                    return (
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={7}><Text strong>Genel Toplam</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1}><Text type="danger" strong>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default CostSimulation;
