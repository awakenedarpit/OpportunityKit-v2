'use client';
import Link from 'next/link'; import Image from 'next/image'; import {usePathname} from 'next/navigation'; import {Bell,Bookmark,BriefcaseBusiness,ChartNoAxesCombined,Compass,LayoutDashboard,LogOut,Menu,Settings,UserRound,WandSparkles,X} from 'lucide-react'; import {useEffect,useState} from 'react'; import {createClient} from '@/lib/supabase/client';
const nav=[{href:'/',label:'Overview',icon:LayoutDashboard},{href:'/discover',label:'Discover',icon:Compass},{href:'/saved',label:'Saved opportunities',icon:Bookmark},{href:'/tracker',label:'Application tracker',icon:BriefcaseBusiness},{href:'/ai-reports',label:'AI fit reports',icon:ChartNoAxesCombined}];
function displayName(user: { user_metadata?: Record<string, unknown>; email?: string }) {
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim();
  return user.email?.split('@')[0] || 'OpportunityKit user';
}
function initials(name: string) {
  return name.split(/[\\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'OK';
}
export function AppShell({children}:{children:React.ReactNode}) {
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const [userName,setUserName]=useState('OpportunityKit user');
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    void supabase.auth.getUser().then(({data}) => {
      if (mounted && data.user) setUserName(displayName(data.user));
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session?.user) setUserName(displayName(session.user));
      else if (mounted) setUserName('OpportunityKit user');
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  if(path==='/login'||path==='/signup'||path==='/reset-password')return <>{children}</>;
  async function signOut(){const supabase=createClient();await supabase.auth.signOut();window.location.href='/login';}
  return <div className="app-layout"><aside className={`sidebar ${open?'sidebar-open':''}`}><Link href="/" className="brand" onClick={()=>setOpen(false)}><span className="brand-mark"><Image src="/brand/opportunitykit-icon.svg" alt="" width={42} height={42} priority /></span><span>Opportunity<span className="brand-accent">Kit</span><small>STUDENT DISCOVERY HUB</small></span></Link><div className="nav-label">WORKSPACE</div><nav>{nav.map(n=>{const Icon=n.icon;const active=n.href==='/'?path==='/':path===n.href||path.startsWith(n.href+'/');return <Link key={n.href} href={n.href} className={`nav-link ${active?'active':''}`} onClick={()=>setOpen(false)}><Icon size={18}/><span>{n.label}</span>{n.href==='/saved'&&<span className="nav-dot"/>}</Link>})}</nav><div className="nav-label tools-label">PERSONAL</div><nav><Link className={`nav-link ${path==='/profile'?'active':''}`} href="/profile"><UserRound size={18}/><span>My profile</span></Link><Link className={`nav-link ${path==='/settings'?'active':''}`} href="/settings"><Settings size={18}/><span>Settings & integrations</span></Link></nav><div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-icon"><WandSparkles size={17}/></div><b>Your next opportunity awaits</b><p>Build your profile to get better AI matches.</p><Link href="/profile">Complete profile ↗</Link></div><div className="user-mini"><div className="avatar">{initials(userName)}</div><div><b>{userName}</b><small>Free workspace</small></div><button className="auth-signout" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={15}/></button><span className="status-dot"/></div></div></aside>{open&&<button aria-label="Close navigation" className="mobile-scrim" onClick={()=>setOpen(false)}><X/></button>}<main className="main-area"><header className="topbar"><button aria-label="Open menu" className="mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{nav.find(n=>n.href===path)?.label||({ '/discover':'Discover opportunities','/profile':'My profile','/settings':'Settings','/saved':'Saved opportunities','/tracker':'Application tracker','/ai-reports':'AI fit reports'} as Record<string,string>)[path]||'Opportunity details'}</b></div><div className="top-actions"><span className="live-pill"><i/> Opportunity feed</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="avatar avatar-small">{initials(userName)}</div></div></header><div className="page-content">{children}<footer className="footer"><span>© 2026 OpportunityKit</span><span>Built for students who build things.</span></footer></div></main></div>
}
