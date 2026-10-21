import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Help Point | Coxinhas & Cia. - Painel e Pedidos",
  description: "Sistema de gerenciamento de insumos, cardápio, integrações e pedidos da Help Point.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-brand-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
