export const metadata = {
  title: 'Thank You for Your Inquiry | Magnevents',
  description: 'Your live artist booking inquiry has been received by Magnevents.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ThankYouLayout({ children }) {
  return <>{children}</>;
}

