import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

const siteDescription = 'Discover hackathons, internships, scholarships and open-source programs. Track applications and import opportunities with Telegram AI.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || 'https://opportunitykit.vercel.app'),
  title: 'OpportunityKit — Find Your Next Opportunity',
  description: siteDescription,
  applicationName: 'OpportunityKit',
  icons: { icon: '/brand/opportunitykit-icon.svg' },
  themeColor: '#101d46',
  openGraph: {
    type: 'website',
    siteName: 'OpportunityKit',
    title: 'OpportunityKit — Find Your Next Opportunity',
    description: siteDescription,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'OpportunityKit — Find Your Next Opportunity' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpportunityKit — Find Your Next Opportunity',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
