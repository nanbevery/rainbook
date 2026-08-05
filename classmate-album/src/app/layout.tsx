import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavWrapper } from "@/components/nav-wrapper";
import { HeartbeatProvider } from "@/components/heartbeat-provider";
import { SocketProvider } from "@/components/socket-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "同学录",
  description: "班级同学录 - 记录美好时光",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <SocketProvider>
            <HeartbeatProvider>
              <NavWrapper>
                {children}
              </NavWrapper>
            </HeartbeatProvider>
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
