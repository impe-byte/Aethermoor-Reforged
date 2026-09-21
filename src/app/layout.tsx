import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aethermoor: Reforged",
  description: "RPG a missioni con combattimento a turni automatico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
