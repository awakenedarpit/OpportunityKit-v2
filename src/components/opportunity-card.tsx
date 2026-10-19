'use client';
import Link from 'next/link';
import { Bookmark, ArrowUpRight, MapPin, CalendarDays, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Opportunity } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { WebsitePreview } from '@/components/website-preview';

export function OpportunityCard({ opportunity: o, initialSaved = false }: { opportunity: Opportunity; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const deadline = o.deadline ? new Date(o.deadline + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified';

  useEffect(() => {
    let active = true;
    async function checkSaved() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('saved_opportunities').select('id').eq('user_id', user.id).eq('opportunity_id', o.id).maybeSingle();
        if (active) setSaved(Boolean(data));
      } catch { /* Keep the card usable if saved data is not configured yet. */ }
    }
    void checkSaved();
    return () => { active = false; };
  }, [o.id]);

  async function toggleSaved() {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { setNotice('Please sign in to save opportunities.'); return; }
      if (saved) {
        const { error } = await supabase.from('saved_opportunities').delete().eq('user_id', user.id).eq('opportunity_id', o.id);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase.from('saved_opportunities').upsert({ user_id: user.id, opportunity_id: o.id, opportunity: o }, { onConflict: 'user_id,opportunity_id' });
        if (error) throw error;
        setSaved(true);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update bookmark. Run the Supabase migration first.');
    } finally { setBusy(false); }
  }

  return <article className="opportunity-card">
    <div className="card-topline"><span className={`category-icon category-${o.category.toLowerCase().replace(/[^a-z]/g, '-').slice(0, 12)}`}>{o.category.toLowerCase().includes('hack') ? '⚡' : o.category.toLowerCase().includes('intern') ? '◈' : o.category.toLowerCase().includes('open') ? '⌘' : '✳'}</span><div className="card-heading"><div className="org-name">{o.organization}</div><h3><Link href={`/opportunities/${encodeURIComponent(o.id)}`}>{o.title}</Link></h3></div><button className={`bookmark-button ${saved ? 'bookmarked' : ''}`} aria-label={saved ? 'Remove bookmark' : 'Save opportunity'} aria-pressed={saved} disabled={busy} onClick={() => void toggleSaved()}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/></button></div>
    <WebsitePreview url={o.url} titleFallback={o.title} descriptionFallback={o.description} compact /><p className="card-description">{o.description}</p><div className="tag-row"><span className="soft-tag">{o.category}</span><span className="soft-tag">{o.mode || 'Flexible'}</span>{o.featured && <span className="match-tag"><Sparkles size={12}/> Featured</span>}</div>
    <div className="card-meta"><span><MapPin size={14}/>{o.location || 'Location flexible'}</span><span><CalendarDays size={14}/>{deadline}</span></div>
    {notice && <p className="error-note" role="status">{notice}</p>}
    <div className="card-footer"><span className="source-label">{o.source === 'Demo' ? 'Sample listing' : o.source || 'Verified source'}</span><Link href={`/opportunities/${encodeURIComponent(o.id)}`} className="text-link">View details <ArrowUpRight size={15}/></Link></div>
  </article>;
}
