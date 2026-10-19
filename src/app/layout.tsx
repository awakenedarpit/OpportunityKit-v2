import type { Metadata } from 'next';
import './globals.css';
import './website-preview.css';
import { AppShell } from '@/components/app-shell';
export const metadata: Metadata={title:'OpportunityKit — Find Your Next Opportunity',description:'Discover hackathons, internships, scholarships and open-source programs. Track applications and import opportunities with Telegram AI.',applicationName:'OpportunityKit',icons:{icon:'/icon.svg'},themeColor:'#101d46'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
