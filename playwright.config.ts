import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta (Playwright).
 *
 * Hoje a suíte cobre apenas acessibilidade (`e2e/acessibilidade.spec.ts`), que
 * é uma barreira anti-regressão: ela roda o app de verdade e reprova o build
 * se alguma violação grave de WCAG voltar. Novos specs de e2e entram nesta
 * mesma pasta e herdam esta configuração.
 *
 * Os testes unitários continuam no Vitest (`npm test`) — o `include` do
 * vitest.config.ts é `src/**` e o do Playwright é `e2e/**`, então as duas
 * suítes não se enxergam.
 *
 * O app sobe em modo demonstração (sem env do Supabase), que é o mesmo modo
 * usado no CI: o `src/proxy.ts` libera todas as rotas quando o Supabase não
 * está conectado, então /painel, /campo e /portal abrem sem login.
 */
const PORTA = 4311;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Máquina compartilhada com builds e outros agentes: sem paralelismo largo.
  workers: 2,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    /*
     * O projeto usa `output: "standalone"` (next.config.ts) para o Docker, e
     * nesse modo o `next start` não funciona — o próprio Next avisa e manda
     * usar `node .next/standalone/server.js`. Só que o bundle standalone não
     * carrega `.next/static` nem `public` sozinho, então copiamos os dois
     * antes de subir. É o mesmo arranjo do Dockerfile.
     *
     * Exige `npm run build` antes.
     */
    command: [
      "rm -rf .next/standalone/.next/static .next/standalone/public",
      "cp -r .next/static .next/standalone/.next/static",
      "cp -r public .next/standalone/public",
      `PORT=${PORTA} HOSTNAME=127.0.0.1 node .next/standalone/server.js`,
    ].join(" && "),
    url: `http://127.0.0.1:${PORTA}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
