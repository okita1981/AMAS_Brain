import React from 'react';
import { BannerType } from '../types';

interface BannerPreviewProps {
  backgroundUrl: string;
  type: BannerType;
  className?: string;
}

export default function BannerPreview({
  backgroundUrl,
  type,
  className = ""
}: BannerPreviewProps) {
  const aspectRatio =
    type === BannerType.Square ? '1/1' :
    type === BannerType.Wide ? '1.91/1' : '9/16';

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <img
        src={backgroundUrl}
        alt=""
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          aspectRatio,
        }}
      />
    </div>
  );
}
