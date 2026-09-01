import React from 'react';

interface BaseChefLogoProps {
  className?: string;
  size?: number;
}

export const BaseChefLogo: React.FC<BaseChefLogoProps> = ({ className = "w-10 h-10", size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Fundo Dark Café Torrado */}
      <rect width="100" height="100" rx="22" fill="#1A1513"/>
      
      {/* Ponto de IA Azul Vibrante */}
      <circle cx="50" cy="24" r="8" fill="#2563EB"/>
      
      {/* Tampa da Panela */}
      <rect x="25" y="38" width="50" height="6" rx="3" fill="#F7F5F3"/>
      
      {/* Corpo da Panela */}
      <path d="M26 48 H74 V66 C74 75 66 80 50 80 C34 80 26 75 26 66 Z" fill="#F7F5F3"/>
      
      {/* Alça Esquerda */}
      <path d="M18 52 C14 52 14 60 18 60 H26 V52 Z" fill="#F7F5F3"/>
      
      {/* Alça Direita */}
      <path d="M82 52 C86 52 86 60 82 60 H74 V52 Z" fill="#F7F5F3"/>
    </svg>
  );
};
