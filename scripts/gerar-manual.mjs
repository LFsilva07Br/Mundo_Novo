#!/usr/bin/env node
/**
 * Gera os prints do Manual do Usuário (public/manual/<id>.png).
 *
 * Sobe o servidor de produção do Next e fotografa cada rota listada em
 * src/lib/manual.ts. Roda em MODO DEMONSTRAÇÃO de propósito: sem as
 * variáveis do Supabase o sistema dispensa login e serve dados de exemplo,
 * então dá para fotografar as telas protegidas sem expor dado real de
 * cliente no manual. Para isso, um `.env.local` existente é afastado
 * durante a geração e devolvido no final.
 *
 * Uso: npm run manual (constrói sozinho, em modo demonstração)
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, rename, access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PORTA = process.env.MANUAL_PORT ?? "4123";
const BASE = `http://localhost:${PORTA}`;
const RAIZ = process.cwd();
const DESTINO = path.join(RAIZ, "public", "manual");
const ENV_LOCAL = path.join(RAIZ, ".env.local");
const ENV_GUARDADO = path.join(RAIZ, ".env.local.manual-bak");

/** Extrai as rotas de src/lib/manual.ts sem precisar compilar TypeScript. */
async function lerTelas() {
  const fonte = await readFile(
    path.join(RAIZ, "src", "lib", "manual.ts"),
    "utf-8",
  );
  const telas = [];
  const regex = /id:\s*"([^"]+)"[\s\S]*?rota:\s*"([^"]+)"/g;
  for (const m of fonte.matchAll(regex)) {
    telas.push({ id: m[1], rota: m[2] });
  }
  if (telas.length === 0) {
    throw new Error("Nenhuma tela encontrada em src/lib/manual.ts");
  }
  return telas;
}

async function existe(caminho) {
  try {
    await access(caminho);
    return true;
  } catch {
    return false;
  }
}

/** Afasta o .env.local para o servidor subir em modo demonstração. */
async function esconderEnvLocal() {
  if (!(await existe(ENV_LOCAL))) return false;
  await rename(ENV_LOCAL, ENV_GUARDADO);
  return true;
}

async function devolverEnvLocal(guardado) {
  if (guardado && (await existe(ENV_GUARDADO))) {
    await rename(ENV_GUARDADO, ENV_LOCAL);
  }
}

/** Sobe o servidor de produção do build recém-gerado. */
function subirServidor() {
  const ambiente = ambienteDemonstracao();
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["next", "start", "-p", PORTA], {
      cwd: RAIZ,
      stdio: ["ignore", "pipe", "pipe"],
      env: ambiente,
    });
    let pronto = false;
    const aoImprimir = (buf) => {
      const texto = buf.toString();
      if (!pronto && /Ready|started server|Local:/i.test(texto)) {
        pronto = true;
        resolve(proc);
      }
    };
    proc.stdout.on("data", aoImprimir);
    proc.stderr.on("data", aoImprimir);
    proc.on("exit", (code) => {
      if (!pronto) reject(new Error(`next start saiu com código ${code}`));
    });
    setTimeout(() => {
      if (!pronto) {
        pronto = true;
        resolve(proc);
      }
    }, 20000);
  });
}

/**
 * Ambiente da geração: sem as chaves do Supabase (modo demonstração, que
 * dispensa login e usa dados de exemplo) e com VERCEL=1 — a flag desliga o
 * `output: "standalone"` do next.config, cujo bundle não serve todas as
 * rotas. Aqui queremos o mesmo build que roda em produção na Vercel.
 */
function ambienteDemonstracao() {
  const ambiente = { ...process.env };
  for (const chave of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    delete ambiente[chave];
  }
  ambiente.VERCEL = "1";
  return ambiente;
}

/** Constrói o app já em modo demonstração. */
function construir() {
  const ambiente = ambienteDemonstracao();
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["next", "build"], {
      cwd: RAIZ,
      stdio: "inherit",
      env: ambiente,
    });
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`next build saiu com código ${code}`)),
    );
  });
}

const telas = await lerTelas();
await mkdir(DESTINO, { recursive: true });

const envGuardado = await esconderEnvLocal();
let servidor;
let navegador;
const falhas = [];

try {
  console.log("Construindo o app em modo demonstração…");
  await construir();
  servidor = await subirServidor();
  navegador = await chromium.launch();

  for (const tela of telas) {
    // O app de campo é mobile: fotografa no tamanho de celular.
    const ehCampo = tela.rota.startsWith("/campo");
    const pagina = await navegador.newPage({
      viewport: ehCampo
        ? { width: 390, height: 844 }
        : { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });

    try {
      const resposta = await pagina.goto(`${BASE}${tela.rota}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      const status = resposta?.status() ?? 0;
      if (status >= 400) {
        throw new Error(`rota respondeu ${status}`);
      }
      // Rota protegida que caiu no login não serve como print da tela.
      if (tela.rota !== "/login" && pagina.url().includes("/login")) {
        throw new Error("redirecionou para o login");
      }
      await pagina.waitForTimeout(600); // fontes, gráficos e transições
      await pagina.screenshot({
        path: path.join(DESTINO, `${tela.id}.png`),
        fullPage: false,
      });
      console.log(`✓ ${tela.rota} → public/manual/${tela.id}.png`);
    } catch (erro) {
      falhas.push({ tela: tela.id, rota: tela.rota, motivo: String(erro.message ?? erro) });
      console.error(`✕ ${tela.rota}: ${erro.message ?? erro}`);
    } finally {
      await pagina.close();
    }
  }
} finally {
  await navegador?.close();
  servidor?.kill("SIGTERM");
  await devolverEnvLocal(envGuardado);
}

console.log(
  `Manual: ${telas.length - falhas.length} de ${telas.length} prints gerados em public/manual/`,
);
if (falhas.length) {
  console.error("Telas sem print:");
  for (const f of falhas) console.error(`  - ${f.tela} (${f.rota}): ${f.motivo}`);
  process.exit(1);
}
