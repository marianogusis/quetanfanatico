import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "¿Qué tan fanático eres?",
  description:
    "30 decisiones futboleras. Sin respuestas correctas. Descubre tu nivel de fanatismo y tu perfil futbolero.",
  openGraph: {
    title: "¿Qué tan fanático eres?",
    description:
      "30 decisiones futboleras. Descubre tu nivel de fanatismo y tu perfil futbolero. ⚽",
    type: "website",
    locale: "es",
    images: [
      {
        url: "https://quetanfanatico.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "¿Qué tan fanático eres?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Qué tan fanático eres?",
    description:
      "30 decisiones futboleras. Descubre tu nivel de fanatismo y tu perfil futbolero. ⚽",
    images: ["https://quetanfanatico.com/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#090c10",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Analytics />
      </body>
      {/* TODO: reemplazar por el GA_ID propio de quetanfanatico cuando se cree la property */}
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  );
}
