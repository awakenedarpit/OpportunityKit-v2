'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ExternalLink, Trash2 } from 'lucide-react';
import type { Opportunity } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type SavedRow = { id: string; opportunity_id: string; opportunity: Opportunity; created_at: string };

export default function SavedOpportunitiesView() {
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { setItems([]); return; }
      const { data, error } = await supabase.from('saved_opportunities').select('id,opportunity_id,opportunity,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []) as SavedRow[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load saved opportunities. Make sure the Supabase migration has been run.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function remove(row: SavedRow) {
    const supabase = createClient();
    const { error } = await supabase.from('saved_opportunities').delete().eq('id', row.id);
    if (error) { setMessage(error.message); return; }
    setItems(current => current.filter(item => item.id !== row.id));
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR SHORTLIST</div><h1>Saved opportunities</h1><p>Bookmarks are saved to your account and follow you across devices.</p></div><span className="count-pill">{items.length} saved</span></div>
    {message && <p className="error-note" role="alert">{message}</p>}
    {loading ? <div className="empty-state"><p>Loading your saved opportunities…</p></div> : items.length === 0 ? <div className="empty-state"><div className="empty-icon"><Bookmark /></div><h3>Your shortlist starts here</h3><p>Save an opportunity from Discover and it will appear here.</p><Link className="button button-primary" href="/discover">Discover opportunities</Link></div> :
      <div className="opportunity-grid">{items.map(row => { const o = row.opportunity; return <article className="opportunity-card" key={row.id}><div className="card-topline"><span className="category-icon">✳</span><div className="card-heading"><div className="org-name">{o.organization}</div><h3><Link href={`/opportunities/${encodeURIComponent(o.id)}`}>{o.title}</Link></h3></div><button className="bookmark-button bookmarked" onClick={() => void remove(row)} aria-label="Remove saved opportunity"><Trash2 size={17}/></button></div><p className="card-description">{o.description}</p><div className="tag-row"><span className="soft-tag">{o.category}</span><span className="soft-tag">{o.mode || 'Flexible'}</span></div><div className="card-footer"><span className="source-label">Saved {new Date(row.created_at).toLocaleDateString()}</span><a className="text-link" href={o.url} target="_blank" rel="noreferrer">Official link <ExternalLink size={14}/></a></div></article>; })}</div>}
  </>;
}
