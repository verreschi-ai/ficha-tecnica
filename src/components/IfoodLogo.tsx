import React from 'react';

interface IfoodLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  light?: boolean; // true = para uso sobre fundo escuro/vermelho (texto branco)
}

export const IfoodLogo: React.FC<IfoodLogoProps> = ({
  className = '',
  size = 24,
  showText = true,
  light = false
}) => {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div
        className="bg-white text-[#EA1D2C] font-black rounded-lg flex items-center justify-center shadow-xs tracking-tighter"
        style={{ width: size * 1.4, height: size, fontSize: size * 0.5 }}
      >
        iF
      </div>
      {showText && (
        <span
          className={`font-fredoka font-black tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}
          style={{ fontSize: size * 0.55 }}
        >
          i<span className={light ? 'text-white' : 'text-[#EA1D2C]'}>Food</span>
        </span>
      )}
    </div>
  );
};
