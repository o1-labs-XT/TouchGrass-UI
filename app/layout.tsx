import "../styles/globals.css";
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata = {
  title: 'TouchGrass - Social Photo Challenges',
  description: 'Complete daily photo challenges and compete with friends on Mina blockchain',
  icons: {
    icon: '/assets/favicon.ico',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#5461c8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
