import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AstryxProvider } from "@/components/AstryxProvider";

export const metadata: Metadata = {
  title: "Insta-Reply",
  description: "Автоответ на комментарии и DM в Instagram",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased" data-theme="light">
      <body className="min-h-full flex flex-col font-sans">
        <AstryxProvider>
          <Providers>{children}</Providers>
        </AstryxProvider>
      </body>
    </html>
  );
}
