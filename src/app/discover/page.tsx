import {OpportunitiesView} from '@/components/opportunities-view';import {demoOpportunities} from '@/lib/demo-data';import {getAdminSupabase} from '@/lib/supabase';
export const dynamic='force-dynamic';
export default async function DiscoverPage(){let items=demoOpportunities;const db=getAdminSupabase();if(db){const {data}=await db.from('opportunities').select('*').order('created_at',{ascending:false}).limit(100);if(data?.length)items=[...data,...demoOpportunities.filter(d=>!data.some(x=>x.url===d.url))] as typeof demoOpportunities;}return <OpportunitiesView items={items}/>;}
