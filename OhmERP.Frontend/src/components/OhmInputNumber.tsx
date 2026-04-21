import React from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

export const OhmInputNumber: React.FC<InputNumberProps> = (props) => {
  const getPlaceholder = () => {
    if (!props.precision || props.precision <= 0) return '0';
    return `0,${'0'.repeat(props.precision)}`;
  };

  return (
    <InputNumber
      {...props}
      placeholder={props.placeholder || getPlaceholder()}
      decimalSeparator=","
      precision={props.precision}
      formatter={(value) => {
        if (value === undefined || value === null || value === '') return '';
        const parts = value.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return parts.join(',');
      }}
      parser={(value) => (value ? value.replace(/\./g, '').replace(',', '.') : '') as any}
    />
  );
};
