import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardcall.statementflow.win"),
  title: "HardCall — 60ms 8kHz RTP Voice Barge-In Gateway & Open-Source Simulator",
  description:
    "Sub-60ms PSTN/SIP telephony barge-in architecture (FreeSWITCH + 8kHz raw RTP + SOXR VHQ + 0.16ms ring-buffer flush). Test full-duplex voice interruption free in your browser or book a $299 48h latency audit.",
  alternates: {
    canonical: "https://hardcall.statementflow.win",
  },
  openGraph: {
    title: "HardCall — 60ms 8kHz RTP Voice Gateway & Free Barge-In Simulator",
    description:
      "Eliminate 900ms+ WebSocket voice agent barge-in lag. Open-source browser simulator + enterprise 8kHz RTP / FreeSWITCH deployment kit.",
    url: "https://hardcall.statementflow.win",
    siteName: "HardCall",
    images: [
      {
        url: "/og-hardcall.png",
        width: 1200,
        height: 675,
        alt: "HardCall — 52ms Full-Duplex Voice Barge-In Architecture",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HardCall — 60ms 8kHz RTP Voice Gateway & Barge-In Simulator",
    description:
      "Sub-60ms PSTN/SIP barge-in architecture vs 900ms+ WebSocket lag. Free simulator + $299 48h latency audit.",
    images: ["/og-hardcall.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const HARDCALL_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HardCall 8kHz RTP Voice Barge-In Gateway",
    url: "https://hardcall.statementflow.win",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, Docker, Web",
    description:
      "Sub-60ms PSTN/SIP full-duplex voice interruption architecture using FreeSWITCH, 8kHz raw RTP, SOXR VHQ lossless resampling, and 0.16ms ring-buffer teardown.",
    offers: [
      {
        "@type": "Offer",
        name: "Browser Barge-In Simulator",
        price: "0.00",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "48h Voice Latency Audit Pilot",
        price: "299.00",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "8kHz RTP Self-Hosted Deployment Kit",
        price: "1200.00",
        priceCurrency: "USD",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why do standard WebSocket voice agents suffer from 900ms+ barge-in lag?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "TCP head-of-line blocking, buffered TTS chunks, and linear 8kHz-to-16kHz resampling cause 850ms to 1,400ms trailing audio overlap on PSTN phone lines. HardCall uses raw UDP/RTP + 256-frame ring buffer flush (0.16ms) to achieve 52ms–60ms interruption.",
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HARDCALL_JSON_LD) }}
        />
        <script src="https://pulse.statementflow.win/api/pixel.js" defer />
      </head>
      <body className="antialiased bg-obsidian text-[#f5f5f7]">{children}</body>
    </html>
  );
}
