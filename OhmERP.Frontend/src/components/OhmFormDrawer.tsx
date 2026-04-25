import React, { useState, useEffect } from 'react';
import { Drawer, Space, Button, Modal, Form } from 'antd';
import type { FormInstance } from 'antd';
import { ExclamationCircleOutlined, UndoOutlined } from '@ant-design/icons';

interface OhmFormDrawerProps {
  title: string;
  width?: number;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  form: FormInstance;
  children: React.ReactNode;
  initialValues?: any;
}

export const OhmFormDrawer: React.FC<OhmFormDrawerProps> = ({
  title,
  width = 500,
  open,
  onClose,
  onSave,
  loading,
  form,
  children,
  initialValues
}) => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (open) {
      setIsDirty(false);
    }
  }, [open]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCloseClick = () => {
    if (isDirty) {
      Modal.confirm({
        title: 'Kaydedilmemiş değişiklikleriniz var!',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: 'Çıkmak istediğinize emin misiniz? Yaptığınız değişiklikler kaybolacak.',
        okText: 'Evet',
        cancelText: 'Hayır',
        centered: true,
        onOk: () => {
          setIsDirty(false);
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  const handleUndo = () => {
    form.resetFields();
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
    setIsDirty(false);
  };

  return (
    <Drawer
      title={title}
      width={width}
      onClose={handleCloseClick}
      open={open}
      destroyOnHidden
      maskClosable={!isDirty}
      extra={
        <Space>
          <Button icon={<UndoOutlined />} disabled={!isDirty || loading} onClick={handleUndo}>Geri Al</Button>
          <Button onClick={handleCloseClick} disabled={loading}>İptal</Button>
          <Button type="primary" onClick={onSave} loading={loading}>Kaydet</Button>
        </Space>
      }
    >
      <Form
        layout="vertical"
        form={form}
        disabled={loading}
        onValuesChange={() => setIsDirty(true)}
        initialValues={initialValues}
      >
        {children}
      </Form>
    </Drawer>
  );
};
