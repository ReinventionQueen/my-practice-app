import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AUTH_ENABLED } from "@/lib/auth-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visit Prep",
  description:
    "Get ready for your medical appointment: concerns, questions, medications and what to bring.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {AUTH_ENABLED ? (
          // ClerkProvider reads the request, so it streams in behind a boundary
          <Suspense fallback={<p className="p-6 text-sm">Loading…</p>}>
            <ClerkProvider>{children}</ClerkProvider>
          </Suspense>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
