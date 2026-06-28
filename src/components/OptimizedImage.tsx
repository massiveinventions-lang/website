/**
 * OptimizedImage
 *
 * Wraps <picture> + <source type="image/webp"> so the browser automatically
 * picks WebP (60-80% smaller) when supported, and falls back to the original
 * PNG/JPG on older browsers or when a WebP sibling does not exist.
 *
 * Usage:
 *   <OptimizedImage src="/speaker-1.png" alt="Speaker" className="..." />
 *
 * The component derives the WebP path by replacing the extension:
 *   /speaker-1.png  →  /speaker-1.webp  (source)
 *   /speaker-1.png  →  /speaker-1.png   (img fallback)
 *
 * If the src is a remote URL (starts with http), it renders a plain <img>
 * without the <picture> wrapper.
 */

import { ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  objectPosition?: string;
}

function toWebP(src: string): string {
  return src.replace(/\.(png|jpg|jpeg)(\?.*)?$/i, ".webp$2");
}

function isLocal(src: string): boolean {
  return src.startsWith("/") || src.startsWith("./") || src.startsWith("../");
}

export default function OptimizedImage({
  src,
  alt,
  className,
  style,
  objectPosition,
  loading = "lazy",
  decoding = "async",
  ...rest
}: OptimizedImageProps) {
  // For remote URLs (like Dicebear avatars), use a plain img tag.
  if (!isLocal(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    );
  }

  const webpSrc = toWebP(src);
  // Only add WebP source if the original is a raster image.
  const canConvert = /\.(png|jpg|jpeg)(\?.*)?$/i.test(src);

  if (!canConvert) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ objectPosition, ...style }}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ objectPosition, ...style }}
        loading={loading}
        decoding={decoding}
        {...rest}
      />
    </picture>
  );
}
