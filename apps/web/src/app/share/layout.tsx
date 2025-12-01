import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onchain Crossword | Share",
  description: "Share your crossword puzzle experience on Celo",
  openGraph: {
    title: "Onchain Crossword",
    description: "Solve puzzles, earn rewards on Celo blockchain",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Onchain Crossword",
    description: "Solve puzzles, earn rewards on Celo blockchain",
    images: ["/opengraph-image.png"],
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}