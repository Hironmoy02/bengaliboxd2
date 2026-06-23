import type { Metadata } from 'next';
import StoreProvider from '@/store/StoreProvider';
import ThemeProvider from '@/components/ThemeProvider';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <footer className="footer">
              <div className="container">
                <p className="footer-text">
                  &copy; {new Date().getFullYear()} Bengaliboxd. A personalized home for Bengali audio story lovers.
                </p>
                <p className="footer-text" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  Discover, rate, and review your favorite Bengali audio stories. All stories are streamed directly from official YouTube channels.
                </p>
              </div>
            </footer>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
