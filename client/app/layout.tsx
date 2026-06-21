import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";
import { QueryProvider } from "./context/QueryProvider";
import { ToastProvider } from "./context/ToastContext";

export const metadata: Metadata = {
  title: "Kairo Admin",
  description: "Kairo RAG Admin Panel — manage your knowledge base and AI chat system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
