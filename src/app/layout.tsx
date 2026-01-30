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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <Navigation />
            <main className="ml-0 md:ml-16 lg:ml-56 min-h-screen p-4 md:p-6 pb-24 md:pb-6">
              {children}
            </main>
            <CommandBar />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
