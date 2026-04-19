import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QUOK-IT — 오픈소스 트렌드를 한국어로",
    template: "%s | QUOK-IT",
  },
  description:
    "오늘 가장 주목받는 레포(Stars)와 실제로 많이 활용되는 레포(Forks)를 한국어로 큐레이션합니다. QUOK-IT에서 오픈소스 트렌드를 빠르게 파악하세요.",
  keywords: [
    "오픈소스 트렌딩",
    "깃허브 트렌드 한국어",
    "오픈소스 추천",
    "퀴킷",
    "QUOK-IT",
    "GitHub Stars",
    "GitHub Forks",
  ],
  openGraph: {
    title: "QUOK-IT — 오픈소스 트렌드를 한국어로",
    description:
      "오늘 가장 주목받는 레포(Stars)와 실제로 많이 활용되는 레포(Forks)를 한국어로 큐레이션합니다.",
    siteName: "QUOK-IT",
    locale: "ko_KR",
    type: "website",
  },
  // ✅ Google AdSense 메타 태그 (3가지 인증 방법 중 하나)
  other: {
    "google-adsense-account": "ca-pub-9949834393027889",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh flex flex-col antialiased bg-bg text-text-primary">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9949834393027889"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
