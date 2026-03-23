import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/blog.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helen — 尽真诚，竭全力",
  description: "一个认真的人，记录自己试图活得具体的过程。投资、时间、生活方式——不表演，只记录。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
