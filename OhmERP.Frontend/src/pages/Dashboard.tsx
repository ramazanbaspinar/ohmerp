import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Spin, message } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import api from '../services/api';

dayjs.locale('tr');

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ratesRes = await api.get('/CurrencyRates/today');
        setRates(ratesRes.data);
      } catch (err) {
        message.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRate = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);
  };

  const getInlineRate = (code: string) => {
    const rate = rates.find(r => r.currencyCode === code);
    if (!rate) return null;
    const isUsd = code === 'USD';
    const bgColor = isUsd ? '#003eb3' : '#a8071a'; // Koyu Mavi / Koyu Kırmızı
    const textColor = '#ffffff'; // Beyaz metin
    const symbol = isUsd ? '$' : '€';

    return (
      <div style={{ 
        background: bgColor, 
        color: textColor, 
        padding: '2px 8px', 
        borderRadius: '6px', 
        fontSize: '12px', 
        fontWeight: 600, 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        <span>{symbol}</span>
        <span>{formatRate(rate.buyingRate)} / {formatRate(rate.sellingRate)}</span>
      </div>
    );
  };

  if (loading) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '500px' }}>
              <Spin size="large" tip="Yükleniyor..."><div /></Spin>
          </div>
      );
  }

  const todayStr = dayjs().format('DD MMMM YYYY dddd');

  return (
    <div style={{ padding: '8px 24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <Title level={2} style={{ margin: 0, color: '#595959' }}>{todayStr}</Title>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getInlineRate('USD')}
              {getInlineRate('EUR')}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;