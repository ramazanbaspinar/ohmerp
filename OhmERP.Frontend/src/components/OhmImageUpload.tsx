import React, { useState, useEffect } from 'react';
import { Upload, message, Modal, Button } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface OhmImageUploadProps {
  value?: string[];
  onChange?: (images: string[]) => void;
  maxCount?: number;
}

const OhmImageUpload: React.FC<OhmImageUploadProps> = ({ value = [], onChange, maxCount = 20 }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    const formattedValue = Array.isArray(value) ? value : [];
    
    if (formattedValue.length !== fileList.length || !fileList.every((f, i) => f.response === formattedValue[i])) {
      setFileList(
        formattedValue.filter(Boolean).map((pathOrBase64, index) => {
          const isBase64 = pathOrBase64.startsWith('data:image');
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7138/api';
          const baseUrl = apiBaseUrl.replace('/api', '');
          const url = isBase64 ? pathOrBase64 : (pathOrBase64.startsWith('http') ? pathOrBase64 : `${baseUrl}${pathOrBase64}`);
          
          return {
            uid: `-val-${index}`,
            name: `image-${index}.png`,
            status: 'done',
            url: url,
            response: pathOrBase64 
          };
        })
      );
    }
  }, [value, fileList]);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleChange: UploadProps['onChange'] = async (info) => {
    let newFileList = [...info.fileList];

    const resultPaths: string[] = [];
    for (const file of newFileList) {
      if (file.originFileObj) {
        const base64 = await getBase64(file.originFileObj as File);
        resultPaths.push(base64);
        file.url = base64; 
        file.response = base64;
      } else if (file.response) {
        resultPaths.push(file.response as string);
      } else if (file.url) {
        resultPaths.push(file.url);
      }
    }

    setFileList(newFileList);
    if (onChange) {
      onChange(resultPaths);
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      if (file.originFileObj) {
        file.preview = await getBase64(file.originFileObj as File);
      }
    }
    const imageUrl = file.url || (file.preview as string);
    setPreviewImage(imageUrl);
    setPreviewTitle(file.name || imageUrl.substring(imageUrl.lastIndexOf('/') + 1));
    setPreviewOpen(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = previewTitle || 'download.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Upload
        name="file"
        multiple={true}
        maxCount={maxCount}
        listType="picture-card"
        fileList={fileList}
        onChange={handleChange}
        onPreview={handlePreview}
        beforeUpload={(file) => {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
          const isImage = allowedTypes.includes(file.type);
          if (!isImage) {
            message.error(`${file.name} hatalı format! Sadece JPG/PNG/WEBP kabul edilir.`);
            return Upload.LIST_IGNORE;
          }
          
          const isLt10M = file.size / 1024 / 1024 < 10;
          if (!isLt10M) {
            message.error("Dosya boyutu 10 MB'tan küçük olmalıdır.");
            return Upload.LIST_IGNORE;
          }
          
          if (fileList.length >= maxCount) {
             message.error(`Maksimum ${maxCount} resim yükleyebilirsiniz!`);
             return Upload.LIST_IGNORE;
          }
          return false;
        }}
        accept="image/png, image/jpeg, image/webp"
      >
        {fileList.length >= maxCount ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Yükle</div>
          </div>
        )}
      </Upload>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            İndir
          </Button>,
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            Kapat
          </Button>
        ]}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%', objectFit: 'contain', maxHeight: '70vh' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default OhmImageUpload;
