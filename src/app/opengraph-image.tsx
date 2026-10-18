import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OpportunityKit — Find Your Next Opportunity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #101d46 0%, #172d68 55%, #38236f 100%)', color: 'white', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 76, height: 76, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #20c7ef, #2878f0 55%, #a66af2)', fontSize: 42, fontWeight: 800 }}>O</div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>Opportunity<span style={{ color: '#a78bfa' }}>Kit</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 970 }}>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>Find your next opportunity.</div>
          <div style={{ display: 'flex', fontSize: 29, color: '#dbeafe', lineHeight: 1.35 }}>Discover internships, hackathons, scholarships and open-source programs — all in one place.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 24, fontSize: 21, color: '#c7d2fe' }}>
          <span>Discover. Track. Grow.</span><span>STUDENT OPPORTUNITY HUB</span>
        </div>
        <div style={{ position: 'absolute', right: -95, top: 145, width: 340, height: 340, borderRadius: 170, border: '2px solid rgba(166,106,242,0.3)' }} />
        <div style={{ position: 'absolute', right: -30, top: 210, width: 210, height: 210, borderRadius: 105, background: 'linear-gradient(135deg, rgba(40,120,240,0.28), rgba(166,106,242,0.3))' }} />
      </div>
    ),
    { ...size }
  );
}
