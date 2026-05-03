
import React from 'react';

import { APP_NAME, APP_AUTHOR, DEVELOPER } from '../config/branding';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * A simple QR code component that uses the public QRServer API.
 * This automatically appends developer branding to the encoded value.
 */
export const QRCode: React.FC<QRCodeProps> = ({ value, size = 100, className = '' }) => {
  const branding = `App: ${APP_NAME}\nAuthor: ${APP_AUTHOR}\nContact: ${DEVELOPER.contact}`;
  
  // Strip URLs and extract only the relevant ID/Reference
  const cleanValue = value.includes('http') 
    ? value.split('/').pop()?.replace('#', '') || value 
    : value;

  const finalValue = `Reference: ${cleanValue}\n\n--- Developer Info ---\n${branding}`;
  const encodedValue = encodeURIComponent(finalValue);
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
