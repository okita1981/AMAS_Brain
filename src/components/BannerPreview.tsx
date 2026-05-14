import React, { useEffect, useRef } from 'react';
import { BannerType, BannerDesignPreset } from '../types';

interface BannerPreviewProps {
  backgroundUrl: string;
  type: BannerType;
  preset: BannerDesignPreset;
  headline: string;
  cta: string;
  className?: string;
}

export default function BannerPreview({
  backgroundUrl,
  type,
  preset,
  headline,
  cta,
  className = ""
}: BannerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundUrl;

    img.onload = () => {
      // Set canvas dimensions based on type
      let width = 1200;
      let height = 1200;

      if (type === BannerType.Wide) {
        height = 628; // 1.91:1
      } else if (type === BannerType.Vertical) {
        width = 1080;
        height = 1920; // 9:16
      }

      canvas.width = width;
      canvas.height = height;

      // Draw background
      ctx.drawImage(img, 0, 0, width, height);

      // Add overlay for readability if needed
      if (preset === BannerDesignPreset.Impact) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
      } else if (preset === BannerDesignPreset.Catalog) {
        const gradient = ctx.createLinearGradient(width * 0.5, 0, width, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(width * 0.5, 0, width * 0.5, height);
      } else if (preset === BannerDesignPreset.Minimal) {
        const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
      }

      // Text settings
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Headline
      const headlineFontSize = width * 0.06;
      ctx.font = `bold ${headlineFontSize}px "Inter", sans-serif`;
      
      // CTA
      const ctaFontSize = width * 0.04;
      const ctaPadding = ctaFontSize * 0.8;

      if (preset === BannerDesignPreset.Impact) {
        // Center Headline
        ctx.fillText(headline, width / 2, height / 2 - ctaFontSize);
        
        // CTA Button
        const ctaWidth = ctx.measureText(cta).width + ctaPadding * 2;
        const ctaHeight = ctaFontSize + ctaPadding;
        ctx.fillStyle = '#2563eb'; // blue-600
        ctx.roundRect(width / 2 - ctaWidth / 2, height / 2 + ctaFontSize, ctaWidth, ctaHeight, 8);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${ctaFontSize}px "Inter", sans-serif`;
        ctx.fillText(cta, width / 2, height / 2 + ctaFontSize + ctaHeight / 2);

      } else if (preset === BannerDesignPreset.Catalog) {
        ctx.textAlign = 'right';
        const rightMargin = width * 0.05;
        
        // Headline
        ctx.fillText(headline, width - rightMargin, height / 2 - ctaFontSize);
        
        // CTA Button
        ctx.font = `bold ${ctaFontSize}px "Inter", sans-serif`;
        const ctaWidth = ctx.measureText(cta).width + ctaPadding * 2;
        const ctaHeight = ctaFontSize + ctaPadding;
        ctx.fillStyle = '#2563eb';
        ctx.roundRect(width - rightMargin - ctaWidth, height / 2 + ctaFontSize, ctaWidth, ctaHeight, 8);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(cta, width - rightMargin - ctaWidth / 2, height / 2 + ctaFontSize + ctaHeight / 2);

      } else if (preset === BannerDesignPreset.Minimal) {
        ctx.textAlign = 'left';
        const leftMargin = width * 0.05;
        const bottomMargin = height * 0.05;

        // Headline
        ctx.fillText(headline, leftMargin, height - bottomMargin - ctaFontSize * 2.5);

        // CTA Button
        ctx.font = `bold ${ctaFontSize}px "Inter", sans-serif`;
        const ctaWidth = ctx.measureText(cta).width + ctaPadding * 2;
        const ctaHeight = ctaFontSize + ctaPadding;
        ctx.fillStyle = '#2563eb';
        ctx.roundRect(leftMargin, height - bottomMargin - ctaHeight, ctaWidth, ctaHeight, 8);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(cta, leftMargin + ctaWidth / 2, height - bottomMargin - ctaHeight / 2);
      }
    };
  }, [backgroundUrl, type, preset, headline, cta]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%', 
          objectFit: 'contain',
          aspectRatio: type === BannerType.Square ? '1/1' : type === BannerType.Wide ? '1.91/1' : '9/16'
        }} 
      />
    </div>
  );
}

// Polyfill for roundRect if not available
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
