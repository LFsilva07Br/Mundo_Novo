import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mundo Novo Café — Gestão de Certificação",
    template: "%s · Mundo Novo Café",
  },
  description:
    "Sistema de gestão de certificações de fazendas de café — Rainforest Alliance, 4C e Orgânico. Consultoria Mundo Novo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          "Pular para o conteúdo" — WCAG 2.2 SC 2.4.1 (Ignorar Blocos).
          Sem ele eram ~30 toques de Tab para atravessar a barra lateral do
          painel antes de chegar ao texto da página. É o primeiro elemento
          focável do documento, fica escondido acima da dobra e desliza para a
          tela quando recebe foco (estilo em src/app/globals.css). O destino
          #conteudo está nos <main> dos layouts de painel, campo e portal.
        */}
        <a href="#conteudo" className="pular-para-conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
