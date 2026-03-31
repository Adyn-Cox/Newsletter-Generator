import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fantasy Football Newsletter Generator",
  description: "Generate fantasy football newsletters from YouTube transcripts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const signedOut = !userId;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} antialiased`}
      >
        <ClerkProvider>
          <header
            className={`flex justify-between items-center p-4 gap-4 h-16 border-b ${
              signedOut ? "border-emerald-700 bg-emerald-600 text-white" : "border-zinc-100 bg-white"
            }`}
          >
            <div className="font-bold text-lg tracking-tight">
              Tape
              <span className={signedOut ? "text-emerald-200" : "text-emerald-600"}>2</span>
              Text
            </div>
            <div className="flex gap-4 items-center">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
