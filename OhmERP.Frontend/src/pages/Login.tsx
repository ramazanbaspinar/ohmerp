import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/Auth/login', {
        email: values.email,
        password: values.password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);

      message.success('Giriş başarılı, sisteme yönlendiriliyorsunuz...');
      navigate('/kullanicilar');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Sunucuya bağlanılamadı!';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card 
        style={{ width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderRadius: '12px' }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff', fontWeight: 700 }}>OhmERP</Title>
          <Text type="secondary">Kurumsal Yönetim Sistemine Giriş Yapın</Text>
        </div>

        <Form name="login_form" layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Lütfen e-posta adresinizi girin!' },
              { type: 'email', message: 'Lütfen geçerli bir e-posta girin!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="E-posta Adresi" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Şifre" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Beni Hatırla</Checkbox>
            </Form.Item>
            <Link to="/sifremi-unuttum" style={{ color: '#1890ff' }}>Şifremi Unuttum</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '40px', fontWeight: 600 }}>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;