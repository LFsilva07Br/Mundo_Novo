import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Build autocontido (node server.js) para Docker / on-premise.
   * Na Vercel o modo standalone quebra o empacotamento
   * (`next-server.js.nft.json` não é gerado), então lá usamos o padrão —
   * a portabilidade continua garantida pelo Dockerfile, que constrói fora
   * da Vercel e recebe `output: "standalone"`.
   */
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
