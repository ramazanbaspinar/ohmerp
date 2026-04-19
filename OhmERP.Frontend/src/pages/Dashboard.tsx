import React from 'react';
import { Typography, Row, Col, Card, Statistic } from 'antd';
import { UserOutlined, ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={4}>Genel Bakış</Title>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Statistic title="Toplam Cari" value={1128} prefix={<UserOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Statistic title="Aktif Stok Kalemi" value={452} prefix={<ShopOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Statistic title="Açık Siparişler" value={93} prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;