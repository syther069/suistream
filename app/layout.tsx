import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SuiStream",
  description: "Decentralized media platform with AI moderation, Walrus storage, and Sui ownership."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="app-shell">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
