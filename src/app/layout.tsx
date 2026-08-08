import type { Metadata } from 'next';
import StoreProvider from '@/store/StoreProvider';
import ThemeProvider from '@/components/ThemeProvider';
import BadgeToastProvider from '@/components/BadgeToastProvider';
import Navbar from '@/components/Navbar';
import FooterTourButton from '@/components/FooterTourButton';
import { UserTourGuide } from '@/components/ui';
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider>
            <BadgeToastProvider>
              <UserTourGuide />
              <Navbar />
              <main style={{ flex: 1 }}>{children}</main>
              <footer className="footer">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <p className="footer-text" style={{ margin: 0 }}>
                    &copy; {new Date().getFullYear()} Bengaliboxd. A personalized home for Bengali audio story lovers.
                  </p>
                  <FooterTourButton />
                </div>
              </footer>
            </BadgeToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
