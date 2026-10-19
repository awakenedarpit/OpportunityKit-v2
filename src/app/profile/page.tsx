'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Save, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Profile() {
  const [name,setName]=useState('');
  const [education,setEducation]=useState('');
  const [skills,setSkills]=useState('');
  const [interests,setInterests]=useState('');
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saveError,setSaveError]=useState('');

  useEffect(()=>{
    let active=true;
    async function loadProfile(){
      try{
        const supabase=createClient();
        const {data:{user},error:authError}=await supabase.auth.getUser();
        if(authError)throw authError;
        if(!user)throw new Error('Please sign in again.');
        const {data,error}=await supabase.from('profiles').select('full_name,education,skills,interests').eq('id',user.id).maybeSingle();
        if(error)throw error;
        if(!active)return;
        setName(data?.full_name||user.user_metadata?.full_name||user.user_metadata?.name||'');
        setEducation(data?.education||'');setSkills(data?.skills||'');setInterests(data?.interests||'');
      }catch(error){
        if(active)setSaveError(error instanceof Error?error.message:'Could not load profile. Run the Supabase migration first.');
      }finally{if(active)setLoading(false);}
    }
    void loadProfile();
    return()=>{active=false;};
  },[]);

  async function saveProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaveError('');setSaved(false);
    try{
      const supabase=createClient();
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError)throw authError;
      if(!user)throw new Error('Please sign in again.');
      const cleanName=name.trim();
      const {error:profileError}=await supabase.from('profiles').upsert({
        id:user.id,full_name:cleanName,education:education.trim(),skills:skills.trim(),interests:interests.trim(),updated_at:new Date().toISOString()
      },{onConflict:'id'});
      if(profileError)throw profileError;
      const {error:authUpdateError}=await supabase.auth.updateUser({data:{full_name:cleanName}});
      if(authUpdateError)throw authUpdateError;
      setSaved(true);
    }catch(error){setSaveError(error instanceof Error?error.message:'Could not save your profile. Check the Supabase migration and try again.');}
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR STORY, YOUR NEXT STEP</div><h1>Student profile</h1><p>Your profile is saved securely to your account and available across devices.</p></div></div>
    <div className="profile-layout">
      <section className="panel profile-form">
        <div className="panel-title"><div className="profile-avatar"><UserRound/></div><div><h2>Your profile</h2><p>Basic information and career interests</p></div></div>
        <form onSubmit={saveProfile}>
          <label>Display name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" disabled={loading}/></label>
          <label>Education / current stage<input value={education} onChange={e=>setEducation(e.target.value)} placeholder="e.g. B.Tech Computer Science, 2nd year" disabled={loading}/></label>
          <label>Skills <span>Separate with commas</span><textarea value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Python, React, UI design, public speaking" rows={3} disabled={loading}/></label>
          <label>Interests and goals<textarea value={interests} onChange={e=>setInterests(e.target.value)} placeholder="Hackathons, AI research, open source, internships…" rows={3} disabled={loading}/></label>
          <button className="button button-primary" type="submit" disabled={loading}><Save size={16}/> Save profile</button>
          {saved&&<p className="success-note"><CheckCircle2 size={15}/> Profile saved to your account.</p>}
          {saveError&&<p className="error-note" role="alert">{saveError}</p>}
        </form>
      </section>
      <aside className="panel profile-aside"><div className="eyebrow">PROFILE CHECKLIST</div><h3>Build a profile that works for you</h3><p>More context helps you reflect on your goals and evaluate opportunities.</p><ul><li><CheckCircle2 size={16}/> Add your education</li><li><CheckCircle2 size={16}/> List your strongest skills</li><li><CheckCircle2 size={16}/> Share your interests</li><li><CheckCircle2 size={16}/> Keep your resume up to date</li></ul></aside>
    </div>
  </>;
}
