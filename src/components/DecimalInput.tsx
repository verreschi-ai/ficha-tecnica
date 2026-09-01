import React, { useState, useEffect } from 'react';
import { obterValorNumerico } from '../utils/formatters';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  decimalPlaces?: number;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  decimalPlaces = 2,
  ...props
}) => {
  const formatVal = (v: number | string) => {
    const num = Number(v);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces
    });
  };

  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null && value !== '' && Number(value) !== 0 ? formatVal(value) : ''
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      if (value !== undefined && value !== null && value !== '' && Number(value) !== 0) {
        const num = Number(value);
        if (!isNaN(num)) {
          setDisplayValue(formatVal(num));
        } else {
          setDisplayValue('');
        }
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    if (!raw.trim()) {
      onChange(0);
    } else {
      const num = obterValorNumerico(raw);
      onChange(num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue.trim()) {
      setDisplayValue('');
      onChange(0);
      return;
    }
    const num = obterValorNumerico(displayValue);
    onChange(num);
    setDisplayValue(num === 0 ? '' : formatVal(num));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};
