
import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * A simple QR code component that uses the public QRServer API.
 * This avoids adding extra dependencies while providing the required functionality.
 */
export const QRCode: React.FC<QRCodeProps> = ({ value, size = 100, className = '' }) => {
  const encodedValue = encodeURIComponent(value);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=0&bgcolor=ffffff`;

  return (
    <div className={`inline-block bg-white p-1 border border-gray-200 rounded ${className}`}>
      <img 
        src={url} 
        alt="QR Code Verification" 
        width={size} 
        height={size}
        className="block"
        loading="lazy"
      />
    </div>
  );
};
