'use client';

import { useState } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { WebsitePreview } from '@/components/website-preview';

export default function LinkPreviewPage() {
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [error, setError] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      setSubmitted(parsed.toString());
    } catch { setError('Enter a complete website URL starting with https://'); }
  }
  return <section className="link-preview-page">
    <div className="page-heading"><div><div className="eyebrow">WEBSITE TO PREVIEW</div><h1>Link preview</h1><p>Turn a website URL into a rich preview with its title, image, description, and domain.</p></div></div>
    <form className="link-preview-form" onSubmit={submit}><label htmlFor="preview-url">Website URL</label><div className="link-preview-input-row"><Link2 size={17}/><input id="preview-url" type="url" required placeholder="https://example.com/opportunity" value={url} onChange={(event) => setUrl(event.target.value)}/><button className="button button-primary" type="submit"><Sparkles size={15}/> Preview link</button></div>{error && <p className="error-note" role="alert">{error}</p>}</form>
    {submitted && <div className="link-preview-result"><div className="eyebrow">LIVE PREVIEW</div><WebsitePreview url={submitted}/></div>}
    <p className="link-preview-help">Some websites block automated previews or do not publish Open Graph metadata. In those cases, OpportunityKit shows its branded fallback image.</p>
  </section>;
}
