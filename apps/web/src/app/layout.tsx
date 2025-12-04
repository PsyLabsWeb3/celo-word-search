import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

import Navbar from '@/components/navbar';
import Providers from "@/components/providers"

const pressStart2P = localFont({
  src: '../assets/fonts/PressStart2P.ttf',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
const frame = {
  version: "1",
  imageUrl: `${appUrl}/embed-image.png`, // Must be 3:2 aspect ratio
  button: {
    title: "Launch Onchain Crossword",
    action: {
      type: "launch_frame",
      name: "Onchain Crossword",
      url: appUrl,
      splashImageUrl: `${appUrl}/image.png?v=2`, // Must be 200x200px - v=2 forces cache refresh
      splashBackgroundColor: "#FEEF89",
    },
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'celo-crossword',
  description: 'A crossword in the celo chain ',
  openGraph: {
    title: 'celo-crossword',
    description: 'A crossword in the celo chain ',
    images: [`${appUrl}/homeimage.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "celo-crossword",
    description: "A crossword in the celo chain ",
    images: [`${appUrl}/homeimage.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(frame), // Primary meta tag for Mini Apps
    "fc:frame": JSON.stringify(frame),   // Backward compatibility for legacy Mini Apps
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={pressStart2P.className}>
        {/* Navbar is included on all pages */}
        <div className="relative flex flex-col min-h-screen">
          <Providers>
            <Navbar />
            <main className="flex-1 pb-16 sm:pb-0">
              {children}
            </main>
            <footer className="p-4 text-center text-gray-600">
              Powered by CELO Blockchain, made with passion ❤️ by Psylabs
            </footer>
          </Providers>
        </div>
      </body>
    </html>
  );
}
