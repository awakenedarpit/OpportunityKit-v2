import {OpportunitiesView} from '@/components/opportunities-view';import {demoOpportunities} from '@/lib/demo-data';
export default function SavedPage(){return <OpportunitiesView items={demoOpportunities.slice(0,2)} heading="Saved opportunities" subheading="A shortlist of opportunities you want to come back to." savedOnly/>;}
