/**
 * Cópia defensiva dos arquivos escolhidos no input de fotos.
 *
 * O `FileList` devolvido por `input.files` é VIVO: quando o input é limpo
 * (`input.value = ""`, necessário para permitir escolher a mesma foto de
 * novo), a lista esvazia. Como o anexo de fotos passa por operações
 * assíncronas (GPS e redimensionamento), ler os arquivos depois do primeiro
 * `await` devolvia zero itens — e nenhuma evidência era anexada à NC.
 */
export function copiarArquivosSelecionados(
  arquivos: FileList | File[] | null | undefined,
): File[] {
  if (!arquivos) return [];
  return Array.from(arquivos);
}
