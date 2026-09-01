import React, { useState, useEffect } from 'react';
import { obterValorNumerico, formatNumeroBRL } from '../utils/formatters';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  ...props
}) => {
  const formatVal = (v: number | string) => {
    const num = Number(v);
    if (isNaN(num)) return '';
    return formatNumeroBRL(num);
  };

  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null && value !== '' ? formatVal(value) : ''
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
    <div className="relative flex items-center">
      <span className="absolute left-3 text-xs font-bold text-amber-700 pointer-events-none select-none">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`${className} pl-9`}
        {...props}
      />
    </div>
  );
};

