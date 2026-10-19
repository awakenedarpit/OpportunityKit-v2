'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ExternalLink, Plus, Trash2, BriefcaseBusiness } from 'lucide-react';
import type { Opportunity } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type Application = { id: string; opportunity_id: string; opportunity: Opportunity; status: string; applied_at: string | null; deadline: string | null; notes: string; updated_at: string };
const statuses = ['Saved','Applied','Assessment','Interview','Offer','Rejected','Withdrawn'];

export default function ApplicationTracker() {
  const [items, setItems] = useState<Application[]>([]);
  const [saved, setSaved] = useState<{opportunity_id:string;opportunity:Opportunity}[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;
      const [apps, bookmarks] = await Promise.all([
        supabase.from('applications').select('*').eq('user_id', user.id).order('updated_at', {ascending:false}),
        supabase.from('saved_opportunities').select('opportunity_id,opportunity').eq('user_id', user.id).order('created_at', {ascending:false}),
      ]);
      if (apps.error) throw apps.error;
      if (bookmarks.error) throw bookmarks.error;
      setItems((apps.data || []) as Application[]);
      setSaved((bookmarks.data || []) as typeof saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your tracker. Run the Supabase migration first.');
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function addOpportunity(row: {opportunity_id:string;opportunity:Opportunity}) {
    setMessage('');
    try {
      const supabase = createClient();
      const {data:{user},error:authError} = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');
      const {error} = await supabase.from('applications').upsert({
        user_id:user.id, opportunity_id:row.opportunity_id, opportunity:row.opportunity,
        status:'Saved', deadline:row.opportunity.deadline || null
      }, {onConflict:'user_id,opportunity_id'});
      if (error) throw error;
      setAdding(false); await load();
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Could not add this opportunity.'); }
  }
  async function updateStatus(item: Application, status: string) {
    const supabase = createClient();
    const patch = {status, applied_at: status === 'Applied' && !item.applied_at ? new Date().toISOString().slice(0,10) : item.applied_at, updated_at:new Date().toISOString()};
    const {error} = await supabase.from('applications').update(patch).eq('id',item.id);
    if (error) { setMessage(error.message); return; }
    setItems(current=>current.map(row=>row.id===item.id?{...row,...patch}:row));
  }
  async function updateNotes(item: Application, notes: string) {
    const supabase = createClient();
    const {error} = await supabase.from('applications').update({notes,updated_at:new Date().toISOString()}).eq('id',item.id);
    if (error) { setMessage(error.message); return; }
    setItems(current=>current.map(row=>row.id===item.id?{...row,notes}:row));
  }
  async function remove(item: Application) {
    const supabase=createClient();
    const {error}=await supabase.from('applications').delete().eq('id',item.id);
    if(error){setMessage(error.message);return;}
    setItems(current=>current.filter(row=>row.id!==item.id));
  }

  const counts = useMemo(()=>({active:items.filter(i=>!['Offer','Rejected','Withdrawn'].includes(i.status)).length, interviews:items.filter(i=>i.status==='Interview').length, offers:items.filter(i=>i.status==='Offer').length}),[items]);
  const groups = statuses.map(status=>({status,items:items.filter(i=>i.status===status)})).filter(g=>g.items.length);
  return <>
    <div className="page-heading"><div><div className="eyebrow">STAY ON TRACK</div><h1>Application tracker</h1><p>Move each opportunity from saved to applied, interview, and beyond. Your changes sync to your account.</p></div><button className="button button-primary" onClick={()=>setAdding(v=>!v)}><Plus size={16}/> Add from saved</button></div>
    <div className="tracker-summary"><div><span>In progress</span><b>{counts.active}</b></div><div><span>Interviews</span><b>{counts.interviews}</b></div><div><span>Offers</span><b>{counts.offers}</b></div><div><span>Total tracked</span><b>{items.length}</b></div></div>
    {message && <p className="error-note" role="alert">{message}</p>}
    {adding && <section className="panel" style={{padding:20,marginBottom:20}}><h3>Add a saved opportunity</h3>{saved.filter(s=>!items.some(i=>i.opportunity_id===s.opportunity_id)).length===0?<p>All saved opportunities are already tracked. Save more from Discover first.</p>:<div className="quick-links">{saved.filter(s=>!items.some(i=>i.opportunity_id===s.opportunity_id)).map(row=><button key={row.opportunity_id} onClick={()=>void addOpportunity(row)}><BriefcaseBusiness size={17}/><span><b>{row.opportunity.title}</b><small>{row.opportunity.organization}</small></span><Plus size={16}/></button>)}</div>}</section>}
    {loading ? <div className="empty-state"><p>Loading your applications…</p></div> : items.length===0 ? <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness/></div><h3>Your tracker is ready</h3><p>Save opportunities from Discover, then add them here to track applications and interviews.</p><Link className="button button-primary" href="/discover">Explore opportunities</Link></div> :
      <div className="kanban">{groups.map(group=><section className="kanban-column" key={group.status}><div className="kanban-head"><span className="stage-dot blue"/><b>{group.status}</b><span className="kanban-count">{group.items.length}</span></div>{group.items.map(item=><article className="tracker-card" key={item.id}><small>{item.opportunity.organization}</small><h3>{item.opportunity.title}</h3><div className="tracker-date"><CalendarDays size={13}/>{item.deadline?new Date(item.deadline+'T00:00:00').toLocaleDateString(): 'No deadline set'}</div><label style={{display:'grid',gap:6,marginTop:12,fontSize:12}}>Status<select aria-label={`Status for ${item.opportunity.title}`} value={item.status} onChange={e=>void updateStatus(item,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label style={{display:'grid',gap:6,marginTop:10,fontSize:12}}>Notes<textarea rows={2} defaultValue={item.notes} placeholder="Interview date, follow-up, notes…" onBlur={e=>{if(e.target.value!==item.notes)void updateNotes(item,e.target.value)}}/></label><div className="tracker-card-footer"><a href={item.opportunity.url} target="_blank" rel="noreferrer" aria-label="Open official opportunity"><ExternalLink size={15}/></a><button onClick={()=>void remove(item)} aria-label="Remove from tracker"><Trash2 size={15}/></button></div></article>)}</section>)}</div>}
  </>;
}
