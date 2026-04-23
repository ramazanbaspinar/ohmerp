import React from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

export const OhmInputNumber: React.FC<InputNumberProps> = ({ precision, ...props }) => {
  const getPlaceholder = () => {
    if (!precision || precision <= 0) return '0';
    return `0,${'0'.repeat(precision)}`;
  };

  return (
    <InputNumber
      {...props}
      placeholder={props.placeholder || getPlaceholder()}
      decimalSeparator=","
      formatter={(value) => {
        if (value === undefined || value === null || value === '') return '';
        const parts = value.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return parts.join(',');
      }}
      parser={(value) => {
        if (!value) return '' as any;
        let parsed = value.replace(/\$\s?|(\.*)/g, '').replace(',', '.');
        if (precision !== undefined && precision > 0) {
            const p = parsed.split('.');
            if (p.length > 1 && p[1].length > precision) {
                parsed = `${p[0]}.${p[1].substring(0, precision)}`;
            }
        } else if (precision === 0) {
            parsed = parsed.split('.')[0];
        }
        return parsed as any;
      }}
    />
  );
};
