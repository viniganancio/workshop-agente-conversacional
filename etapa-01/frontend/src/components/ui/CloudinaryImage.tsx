import React, { useState } from 'react';
import { buildCloudinaryUrl, getCloudinaryImage, cloudinaryImages, type ImageCategory } from '../../config/cloudinary';

interface CloudinaryImageProps {
  // Option 1: Direct URL
  src?: string;
  // Option 2: Typed image from config
  category?: keyof typeof cloudinaryImages;
  image?: string;
  
  // Standard image props
  alt: string;
  className?: string;
  
  // Cloudinary optimizations
  width?: number;
  height?: number;
  quality?: number | 'auto';
  responsive?: boolean;
  priority?: boolean;
  
  // Advanced props
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const CloudinaryImage = ({
  src,
  category,
  image,
  alt,
  className = '',
  width,
  height,
  quality = 'auto',
  responsive = true,
  priority = false,
  fallback,
  onLoad,
  onError
}: CloudinaryImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate image URL
  const getImageUrl = (targetWidth?: number) => {
    if (src) {
      return buildCloudinaryUrl(src, {
        width: targetWidth || width,
        height,
        quality,
        format: 'auto',
        crop: 'fill',
        gravity: 'auto'
      });
    }
    
    if (category && image) {
      return getCloudinaryImage(category as keyof typeof import('../../config/cloudinary').cloudinaryImages, image as string, {
        width: targetWidth || width,
        height,
        quality,
        format: 'auto',
        crop: 'fill',
        gravity: 'auto'
      });
    }
    
    return fallback || '';
  };

  // Generate srcSet for responsiveness
  const generateSrcSet = () => {
    if (!responsive || !width) return undefined;
    
    const sizes = [
      Math.round(width * 0.5),  // 50%
      Math.round(width * 0.75), // 75%
      width,                    // 100%
      Math.round(width * 1.5),  // 150% (retina)
      Math.round(width * 2)     // 200% (high-dpi)
    ];
    
    return sizes
      .map(size => `${getImageUrl(size)} ${size}w`)
      .join(', ');
  };

  // Generate sizes attribute for responsiveness
  const generateSizes = () => {
    if (!responsive || !width) return undefined;
    
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${width}px`;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const imageUrl = getImageUrl();

  if (!imageUrl && !fallback) {
    console.warn('CloudinaryImage: Neither src nor category/image provided');
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {/* Main image */}
      <img
        src={hasError && fallback ? fallback : imageUrl}
        srcSet={!hasError ? generateSrcSet() : undefined}
        sizes={!hasError ? generateSizes() : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${hasError ? 'grayscale' : ''}
        `}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
};

export default CloudinaryImage;
