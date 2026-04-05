import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { WalletProvider } from "@/lib/web3/wallet-context";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustBlock - Secure Your Work. Trust the Code.",
  description:
    "A decentralized, zero-trust financial utility for independent digital workers. Secure escrow payments with USDC on Polygon.",
  keywords: [
    "escrow",
    "freelance",
    "crypto",
    "USDC",
    "Web3",
    "payments",
    "blockchain",
  ],
};

export const viewport: Viewport = {
  themeColor: "#111827",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            toastOptions={{
              style: {
                background: "#1E293B",
                border: "1px solid #334155",
                color: "#FFFFFF",
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
