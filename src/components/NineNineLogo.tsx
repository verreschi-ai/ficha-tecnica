import React from 'react';

interface NineNineLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  light?: boolean; // true = para uso sobre fundo escuro (texto branco)
}

export const NineNineLogo: React.FC<NineNineLogoProps> = ({
  className = '',
  size = 24,
  showText = true,
  light = false
}) => {
  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <div
        className="bg-black text-[#FFCC00] font-black rounded-lg flex items-center justify-center shadow-xs tracking-tighter"
        style={{ width: size * 1.4, height: size, fontSize: size * 0.5 }}
      >
        99
      </div>
      {showText && (
        <span
          className={`font-fredoka font-black tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}
          style={{ fontSize: size * 0.55 }}
        >
          99<span className="text-[#FFCC00]">Food</span>
        </span>
      )}
    </div>
  );
};
