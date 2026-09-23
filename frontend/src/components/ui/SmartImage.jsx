import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

// Renders a graceful placeholder both when there's no image (src falsy) and
// when the src 404s / fails to load (e.g. a DB row pointing at a file that
// no longer exists on disk) — an <img> alone only covers the first case and
// falls back to the browser's native broken-image icon for the second.
export default function SmartImage({ src, alt = '', className = '', iconClassName = 'size-8' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 text-neutral-300 ${className}`}>
        <ImageOff className={iconClassName} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
