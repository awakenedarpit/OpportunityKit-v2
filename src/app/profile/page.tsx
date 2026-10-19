'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Save, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ProfileDetails = {
  name: string;
  education: string;
  skills: string;
  interests: string;
};

const emptyProfile: ProfileDetails = { name: '', education: '', skills: '', interests: '' };

export default function Profile() {
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      let stored: Partial<ProfileDetails> = {};
      try {
        const raw = localStorage.getItem('ok-profile');
        if (raw) stored = JSON.parse(raw) as Partial<ProfileDetails>;
      } catch {
        // Ignore invalid local profile data and continue with the signed-in account.
      }

      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!active) return;

        const accountName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
        setName(stored.name || accountName);
      } catch {
        if (active) setName(stored.name || '');
      }

      if (!active) return;
      setEducation(stored.education || '');
      setSkills(stored.skills || '');
      setInterests(stored.interests || '');
      setLoading(false);
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError('');
    setSaved(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;

      localStorage.setItem('ok-profile', JSON.stringify({
        name: name.trim(), education, skills, interests,
      }));
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your profile. Please try again.');
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR STORY, YOUR NEXT STEP</div>
          <h1>Student profile</h1>
          <p>Tell OpportunityKit what you&apos;re building toward to improve your recommendations.</p>
        </div>
      </div>
      <div className="profile-layout">
        <section className="panel profile-form">
          <div className="panel-title">
            <div className="profile-avatar"><UserRound /></div>
            <div><h2>Your profile</h2><p>Basic information and career interests</p></div>
          </div>
          <form onSubmit={saveProfile}>
            <label>Display name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" disabled={loading} /></label>
            <label>Education / current stage<input value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g. B.Tech Computer Science, 2nd year" /></label>
            <label>Skills <span>Separate with commas</span><textarea value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, React, UI design, public speaking" rows={3} /></label>
            <label>Interests and goals<textarea value={interests} onChange={e => setInterests(e.target.value)} placeholder="Hackathons, AI research, open source, internships…" rows={3} /></label>
            <button className="button button-primary" type="submit" disabled={loading}><Save size={16} /> Save profile</button>
            {saved && <p className="success-note"><CheckCircle2 size={15} /> Name saved to your Supabase account. Other profile details are saved in this browser.</p>}
            {saveError && <p className="error-note" role="alert">{saveError}</p>}
          </form>
        </section>
        <aside className="panel profile-aside">
          <div className="eyebrow">PROFILE CHECKLIST</div>
          <h3>Build a profile that works for you</h3>
          <p>More context helps AI explain why an opportunity might fit your goals.</p>
          <ul>
            <li><CheckCircle2 size={16} /> Add your education</li>
            <li><CheckCircle2 size={16} /> List your strongest skills</li>
            <li><CheckCircle2 size={16} /> Share your interests</li>
            <li><CheckCircle2 size={16} /> Keep your resume up to date</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
