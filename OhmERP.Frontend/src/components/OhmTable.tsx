import React, { useState, useEffect } from 'react';
import { Table, Button, Dropdown, Space, Typography, message } from 'antd';
import { FileExcelOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import type { MenuProps, TableProps } from 'antd';
import 'react-resizable/css/styles.css';
import api from '../services/api';

const { Title } = Typography;

const resizeHandleStyle: React.CSSProperties = {
  position: 'absolute',
  right: -5,
  bottom: 0,
  zIndex: 1,
  width: 10,
  height: '100%',
  cursor: 'col-resize',
};

const ResizableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;
  if (!width) return <th {...restProps} />;
  return (
    <Resizable
      width={width}
      height={0}
      handle={<span style={resizeHandleStyle} onClick={(e) => { e.stopPropagation(); }} />}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} style={{ ...restProps.style, position: 'relative' }} />
    </Resizable>
  );
};

interface OhmTableProps<T> extends TableProps<T> {
  tableName?: string;
  tableTitle?: string;
  titleIcon?: React.ReactNode;
  extraActions?: React.ReactNode;
  hideExport?: boolean;
  enableResize?: boolean;
  scrollX?: boolean | number | string;
  exportExcelUrl?: string; 
  exportPdfUrl?: string;
}

export const OhmTable = <T extends object>({
  tableName = 'Liste',
  tableTitle,
  titleIcon,
  extraActions,
  hideExport = false,
  enableResize = false,
  scrollX,
  dataSource,
  columns,
  exportExcelUrl,
  exportPdfUrl,
  ...rest
}: OhmTableProps<T>) => {
  
  const [mergedColumns, setMergedColumns] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  useEffect(() => {
    if (columns) {
      const enhancedColumns = columns.map(col => {
        const c = col as any;
        if (c.key === 'actions' || c.dataIndex === 'actions') return col;
        return { ...col, ellipsis: c.ellipsis ?? true };
      });
      setMergedColumns(enhancedColumns);
    }
  }, [columns]);

  const handleResize = (index: number) => (_: React.SyntheticEvent<Element>, { size }: any) => {
    setMergedColumns((prev) => {
      const nextCols = [...prev];
      nextCols[index] = { ...nextCols[index], width: Math.max(size.width, 100) };
      return nextCols;
    });
  };

  const finalColumns = enableResize 
    ? mergedColumns.map((col, index) => ({
        ...col,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
      }))
    : columns;

  const exportToExcel = async () => {
    if (!exportExcelUrl) {
        message.warning("Bu sayfa için Excel dışa aktarım adresi tanımlanmamış.");
        return;
    }

    setExportLoading(true);

    try {
      message.loading({ content: 'Excel dosyası hazırlanıyor...', key: 'exportAction' });
      
      const response = await api.get(exportExcelUrl, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: 'İndirme başarılı!', key: 'exportAction', duration: 2 });
    } catch (error) {
      message.error({ content: 'Dışa aktarım başarısız oldu.', key: 'exportAction', duration: 2 });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPdf = async () => {
    if (!exportPdfUrl) {
        message.warning("Bu sayfa için PDF dışa aktarım adresi tanımlanmamış.");
        return;
    }

    setExportLoading(true);

    try {
      message.loading({ content: 'PDF belgesi hazırlanıyor...', key: 'exportAction' });
      
      const response = await api.get(exportPdfUrl, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: 'İndirme başarılı!', key: 'exportAction', duration: 2 });
    } catch (error) {
      message.error({ content: 'PDF oluşturulamadı.', key: 'exportAction', duration: 2 });
    } finally {
      setExportLoading(false);
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    { key: 'excel', icon: <FileExcelOutlined style={{ color: '#52c41a' }} />, label: 'Excel (.xlsx) Olarak İndir', onClick: exportToExcel, disabled: exportLoading },
    { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#f5222d' }} />, label: 'PDF Olarak İndir', onClick: exportToPdf, disabled: exportLoading }
  ];

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Space>
        {titleIcon && <span style={{ fontSize: '24px', color: '#1890ff' }}>{titleIcon}</span>}
        {tableTitle && <Title level={4} style={{ margin: 0 }}>{tableTitle}</Title>}
      </Space>
      <Space>
        {extraActions}
        {!hideExport && (
          <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} disabled={exportLoading}>
            <Button icon={<DownloadOutlined />} loading={exportLoading}>Dışa Aktar</Button>
          </Dropdown>
        )}
      </Space>
    </div>
  );

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {renderHeader()}
      <Table
        tableLayout="fixed"
        components={enableResize ? { header: { cell: ResizableTitle } } : undefined}
        dataSource={dataSource}
        columns={finalColumns}
        size="middle"
        scroll={scrollX ? { x: scrollX } : undefined} 
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: true,
          showTotal: (total, range) => `Toplam ${total} kayıttan ${range[0]}-${range[1]} arası gösteriliyor`,
        }}
        {...rest}
      />
    </div>
  );
};