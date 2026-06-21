export default function Onboarding({ onComplete }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '2rem'
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: 420, width: '100%', padding: '3rem 2.5rem', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        borderRadius: 24
      }}>
        <div style={{ fontSize: '4rem', margin: '0 auto' }}>🌍</div>
        
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}>
            Welcome to CarbonZero
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            The personalized platform to track your carbon footprint, learn about climate impact, and join a community acting for a better future.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left', background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>🧮</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>Calculate your impact</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>Chat with our AI Coach</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>Compete on the leaderboard</span>
          </div>
        </div>

        <button onClick={onComplete} className="btn-primary" style={{ width: '100%', minHeight: 48, fontSize: '1rem', marginTop: '0.5rem' }}>
          Get Started
        </button>
      </div>
    </div>
  );
}
