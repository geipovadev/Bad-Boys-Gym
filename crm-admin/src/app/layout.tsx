import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Bad Boys Gym — CRM",
  description: "Panel administrativo de Bad Boys Gym",
};

// Se aplica el tema guardado antes del primer pintado. Sin esto la página
// aparece oscura un instante antes de volverse clara.
const TEMA_INICIAL = `try{if(localStorage.getItem('bbg_tema')==='light'){document.documentElement.classList.add('light')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
