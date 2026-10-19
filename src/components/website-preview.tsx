'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Globe2 } from 'lucide-react';

type PreviewData = { title: string; description: string; image: string | null; url: string; domain: string };
type Props = { url: string; titleFallback?: string; descriptionFallback?: string; compact?: boolean };

export function WebsitePreview({ url, titleFallback, descriptionFallback, compact = false }: Props) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [failedImage, setFailedImage] = useState(false);

  useEffect(() => {
    let active = true;
    setData(null);
    setFailedImage(false);
    fetch('/api/link-preview?url=' + encodeURIComponent(url))
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((value: PreviewData) => { if (active) setData(value); })
      .catch(() => { if (active) setData({ title: titleFallback || 'Official website', description: descriptionFallback || 'Open the source website to view full details.', image: null, url, domain: safeDomain(url) }); });
    return () => { active = false; };
  }, [url, titleFallback, descriptionFallback]);

  const image = data?.image && !failedImage ? data.image : '/opportunity-placeholder.svg';
  return (
    <a className={`website-preview ${compact ? 'website-preview-compact' : ''}`} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${data?.title || titleFallback || 'website'} in a new tab`}>
      <div className="website-preview-image"><img src={image} alt="" loading="lazy" onError={() => setFailedImage(true)} /></div>
      <div className="website-preview-copy">
        <div className="website-preview-domain"><Globe2 size={12}/><span>{data?.domain || safeDomain(url)}</span><ExternalLink size={12}/></div>
        <h4>{data?.title || titleFallback || 'Loading website preview…'}</h4>
        {!compact && <p>{data?.description || descriptionFallback || 'Previewing website details…'}</p>}
      </div>
    </a>
  );
}

function safeDomain(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return 'Website'; }
}
