import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Activity, Upload, User, Settings } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arsenal AI | Dashboard",
  description: "Enterprise Baseball Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-background text-foreground flex h-screen overflow-hidden`}
      >
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <span className="font-bold text-xl tracking-tight">Arsenal AI</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              <li>
                <a
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium transition-colors"
                >
                  <Activity size={18} /> Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/upload"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <Upload size={18} /> Upload Data
                </a>
              </li>
              <li>
                <a
                  href="/pitchers"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <User size={18} /> Pitcher Profiles
                </a>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-border">
            <a
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <Settings size={18} /> Settings
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
