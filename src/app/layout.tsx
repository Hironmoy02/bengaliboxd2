import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bengaliboxd | Bengali Audio Stories Rating & Review',
  description: 'Explore, rate, and review your favorite Bengali audio stories from Sunday Suspense, Goppo Mirer Thek, Midnight Horror Station, Kahon, and more! Your Bengali audio story journal.',
  keywords: ['bengali audio story', 'sunday suspense', 'mirchi bangla', 'goppo mirer thek', 'midnight horror station', 'rating', 'review', 'podcast'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <footer className="footer">
            <div className="container">
              <p className="footer-text">
                &copy; {new Date().getFullYear()} Bengaliboxd. Made for Bengali Audio Story lovers.
              </p>
              <p className="footer-text" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                Bengaliboxd is an independent rating system. All audio stories are embedded directly from official YouTube channels.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
