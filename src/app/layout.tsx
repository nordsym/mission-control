import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Navigation } from "@/components/Navigation";
import { CommandBar } from "@/components/CommandBar";

export const metadata: Metadata = {
  title: "Symbot Mission Control",
  description: "Monitor and control your AI agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>
          <Navigation />
          <main className="ml-16 md:ml-56 min-h-screen p-6">
            {children}
          </main>
          <CommandBar />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
