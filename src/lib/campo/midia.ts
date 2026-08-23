"use client";

import { calcularDimensoesFoto } from "./regras";

/**
 * Utilitários de navegador do App de Campo: redimensionamento de fotos
 * (canvas) e captura de GPS. A matemática pura vive em `regras.ts`.
 */

const QUALIDADE_JPEG = 0.7;

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto."));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () =>
      reject(new Error("Não foi possível abrir a foto no aparelho."));
    imagem.src = dataUrl;
  });
}

/**
 * Redimensiona a foto para no máximo 1280px no maior lado e devolve um
 * data URL JPEG (qualidade 0,7) — leve o bastante para viver no IndexedDB
 * e subir depois pela rede do campo.
 */
export async function redimensionarFoto(arquivo: File): Promise<string> {
  const original = await lerComoDataUrl(arquivo);
  const imagem = await carregarImagem(original);

  const { largura, altura } = calcularDimensoesFoto(
    imagem.naturalWidth,
    imagem.naturalHeight,
  );

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");
  if (!contexto) return original;

  contexto.drawImage(imagem, 0, 0, largura, altura);
  return canvas.toDataURL("image/jpeg", QUALIDADE_JPEG);
}

/**
 * Posição atual como "lat,long" — ou null quando o aparelho não tem GPS,
 * o consultor negou a permissão ou o sinal não chegou em 8 segundos.
 * A visita nunca trava por falta de GPS.
 */
export function capturarGps(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const { latitude, longitude } = posicao.coords;
        resolve(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}
