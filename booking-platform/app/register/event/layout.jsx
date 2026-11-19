export const metadata = {
  title: 'Register Your Event | Magnevents',
  description: 'Tell us about your upcoming event, wedding, party, or corporate function. Connect with verified top musical artists directly.',
  alternates: {
    canonical: 'https://www.magnevents.in/register/event',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Register Your Event | Magnevents',
    description: 'Tell us about your upcoming event, wedding, party, or corporate function. Connect with verified top musical artists directly.',
    url: 'https://www.magnevents.in/register/event',
  }
};

export default function RegisterEventLayout({ children }) {
  return <>{children}</>;
}

