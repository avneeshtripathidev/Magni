import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting to Artist Registration | Magnevents',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  redirect('https://artists.magnevents.in/register');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff', fontFamily: 'sans-serif', textAlign: 'center', padding: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Redirecting to Artist Registration Portal...</h2>
        <p style={{ marginTop: '12px', color: '#aaa', fontSize: '1rem' }}>
          If you are not redirected automatically,{' '}
          <a href="https://artists.magnevents.in/register" style={{ color: '#00d4ff', textDecoration: 'underline' }}>
            click here to open the Artist Registration Portal
          </a>.
        </p>
      </div>
    </div>
  );
}
