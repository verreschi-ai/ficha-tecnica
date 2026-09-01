import React from 'react';

interface MercadoPagoLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const MercadoPagoLogo: React.FC<MercadoPagoLogoProps> = ({
  className = '',
  size = 24,
  showText = true
}) => {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div 
        className="bg-[#009ee3] text-white font-black rounded-lg flex items-center justify-center shadow-xs tracking-tighter"
        style={{ width: size * 1.4, height: size, fontSize: size * 0.45 }}
      >
        MP
      </div>
      {showText && (
        <span className="font-fredoka font-black tracking-tight text-slate-900" style={{ fontSize: size * 0.55 }}>
          Mercado <span className="text-[#009ee3]">Pago</span>
        </span>
      )}
    </div>
  );
};
