import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Dragger } = Upload;

interface OhmImageUploadProps {
  value?: string[]; // Array of base64 strings
  onChange?: (images: string[]) => void;
  maxCount?: number;
}

const OhmImageUpload: React.FC<OhmImageUploadProps> = ({ value = [], onChange, maxCount = 3 }) => {
  const [fileList, setFileList] = useState<UploadFile[]>(
    value.map((base64, index) => ({
      uid: `-val-${index}`,
      name: `image-${index}.png`,
      status: 'done',
      url: base64,
    }))
  );

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleChange: UploadProps['onChange'] = async (info) => {
    let newFileList = [...info.fileList];

    // Read all selected files as base64
    const base64Images: string[] = [];
    for (const file of newFileList) {
      if (file.originFileObj) {
        const base64 = await getBase64(file.originFileObj as File);
        base64Images.push(base64);
        file.url = base64; // Update url for preview
      } else if (file.url) {
        base64Images.push(file.url);
      }
    }

    setFileList(newFileList);
    if (onChange) {
      onChange(base64Images);
    }
  };

  return (
    <Dragger
      name="file"
      multiple={true}
      maxCount={maxCount}
      listType="picture"
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={(file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          message.error(`${file.name} bir resim dosyası değil!`);
        }
        return false; // Prevent automatic upload
      }}
      accept="image/*"
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Resimleri sürükleyip bırakın veya seçmek için tıklayın</p>
      <p className="ant-upload-hint">
        Maksimum {maxCount} resim yüklenebilir. Sadece resim formatları desteklenir.
      </p>
    </Dragger>
  );
};

export default OhmImageUpload;
