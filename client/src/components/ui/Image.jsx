import { useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Image with a branded placeholder for missing or failed sources, native lazy
 * loading and explicit dimensions to avoid layout shift (Core Web Vitals: CLS).
 *
 * `priority` opts an image out of lazy loading — use it for the LCP hero image.
 */
const Image = ({
  src,
  alt = '',
  width,
  height,
  className = '',
  priority = false,
  placeholderLabel = 'Image coming soon',
  objectFit = 'cover',
  ratio,
  style,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);
  const ratioStyle = ratio ? { aspectRatio: ratio.replace('/', ' / ') } : null;

  if (!src || failed) {
    return (
      <span
        className={`media-placeholder ${className}`.trim()}
        role="img"
        aria-label={alt || placeholderLabel}
        style={{ ...ratioStyle, ...style }}
      >
        <Icon name="image" size={40} />
        <span>{placeholderLabel}</span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchpriority={priority ? 'high' : undefined}
      onError={() => setFailed(true)}
      style={{ objectFit, ...ratioStyle, ...style }}
      {...rest}
    />
  );
};

export default Image;
