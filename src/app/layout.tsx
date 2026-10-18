import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
export const metadata: Metadata={title:'OpportunityKit — Student Opportunity Hub',description:'Discover hackathons, internships, scholarships and open-source programs. Track applications and import opportunities with Telegram AI.'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html>; }
