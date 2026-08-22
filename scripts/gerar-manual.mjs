#!/usr/bin/env node
/**
 * Gera os prints do Manual do Usuário (public/manual/<id>.png).
 *
 * Sobe o servidor de produção do Next (`next start`), abre cada rota
 * listada em src/lib/manual.ts com o Playwright e fotografa a tela.
 * Rode após `npm run build`:  npm run manual
 */
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PORTA = process.env.MANUAL_PORT ?? "4123";
const BASE = `http://localhost:${PORTA}`;
const RAIZ = process.cwd();
const DESTINO = path.join(RAIZ, "public", "manual");

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

function subirServidor() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["next", "start", "-p", PORTA], {
      cwd: RAIZ,
      stdio: ["ignore", "pipe", "pipe"],
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
        resolve(proc); // fallback: assume que subiu
      }
    }, 15000);
  });
}

const telas = await lerTelas();
await mkdir(DESTINO, { recursive: true });

const servidor = await subirServidor();
const navegador = await chromium.launch();

try {
  const pagina = await navegador.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  for (const tela of telas) {
    const url = `${BASE}${tela.rota}`;
    await pagina.goto(url, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(400); // fontes/transições
    const arquivo = path.join(DESTINO, `${tela.id}.png`);
    await pagina.screenshot({ path: arquivo, fullPage: false });
    console.log(`✓ ${tela.rota} → public/manual/${tela.id}.png`);
  }
} finally {
  await navegador.close();
  servidor.kill("SIGTERM");
}

console.log(`Manual: ${telas.length} print(s) gerados em public/manual/`);
