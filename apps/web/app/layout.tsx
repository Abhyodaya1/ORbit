import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — Cozy Arcade",
  description: "A soothing, private 2-person space for video calls and synced arcade games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Silkscreen (for retro arcade flair) and Space Grotesk (for clean reading) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body 
      suppressHydrationWarning
      className="bg-orbit-bg text-orbit-text min-h-screen font-sans antialiased selection:bg-orbit-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}