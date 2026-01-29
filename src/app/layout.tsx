import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Navigation } from "@/components/Navigation";
import { CommandBar } from "@/components/CommandBar";

export const metadata: Metadata = {
  title: "NordSym Mission Control",
  description: "Monitor and control your AI agent",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <Navigation />
            <main className="ml-16 md:ml-56 min-h-screen p-6">
              {children}
            </main>
            <CommandBar />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
