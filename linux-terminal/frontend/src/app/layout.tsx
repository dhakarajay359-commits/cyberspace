import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KaliLinux Terminal — Real Linux Shell in Your Browser',
  description:
    'A production-ready browser-based Linux terminal. Real commands, real output — powered by node-pty and Docker isolation.',
  keywords: ['linux terminal', 'kali linux', 'browser terminal', 'online shell', 'docker sandbox'],
  openGraph: {
    title: 'KaliLinux Terminal',
    description: 'Real Linux terminal in your browser',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-kali-bg">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
