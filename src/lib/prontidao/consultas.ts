import { listarClientes } from "@/lib/carteira/consultas";
import { listarImoveisDoCliente } from "@/lib/carteira/imoveis-consultas";
import { ROTULO_NORMA } from "@/lib/carteira/tipos";
import { ROTULO_TIPO_DOCUMENTO } from "@/lib/carteira/imoveis-esquemas";
import { listarCapas } from "@/lib/certificacao/consultas";
import { listarVisitas } from "@/lib/checklists/consultas";
import { listarTreinamentos } from "@/lib/social/consultas";
import { diasAte } from "@/lib/vencimentos";
import {
  avaliarProntidao,
  type DadosProntidao,
  type ResultadoProntidao,
} from "./regras";

/**
 * Monta os dados de prontidão de cada cliente da carteira e aplica a régua.
 * As consultas de origem já têm fallback de demonstração — sem Supabase,
 * o resultado nasce dos mesmos dados demo do restante do app.
 */

export type ProntidaoCliente = ResultadoProntidao & {
  clienteId: string;
  clienteNome: string;
  conformidade?: number;
};

const MS_POR_DIA = 86_400_000;

function dataLocal(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/**
 * Avalia a prontidão para auditoria de toda a carteira.
 * Clientes não prontos vêm primeiro, da menor para a maior nota.
 */
export async function avaliarCarteira(
  hoje: Date = new Date(),
): Promise<ProntidaoCliente[]> {
  const [clientes, capas] = await Promise.all([listarClientes(), listarCapas()]);

  const capasAbertasPorCliente = new Map<string, typeof capas>();
  for (const capa of capas) {
    if (capa.status === "fechada") continue;
    const lista = capasAbertasPorCliente.get(capa.cliente) ?? [];
    lista.push(capa);
    capasAbertasPorCliente.set(capa.cliente, lista);
  }

  const resultados = await Promise.all(
    clientes.map(async (cliente) => {
      const [visitas, imoveis, treinamentos] = await Promise.all([
        listarVisitas(cliente.id),
        listarImoveisDoCliente(cliente.id),
        listarTreinamentos(cliente.id),
      ]);

      const visitaInternaNoAno = visitas.some(
        (v) =>
          v.status === "concluida" &&
          v.concluidaEm !== null &&
          hoje.getTime() - new Date(v.concluidaEm).getTime() <=
            365 * MS_POR_DIA,
      );

      const documentosVencidos = imoveis
        .flatMap((imovel) => imovel.documentos)
        .filter(
          (doc) =>
            doc.status === "vencido" ||
            (doc.venceEm !== undefined &&
              diasAte(dataLocal(doc.venceEm), hoje) < 0),
        )
        .map((doc) => ({ tipo: ROTULO_TIPO_DOCUMENTO[doc.tipo] ?? doc.tipo }));

      const treinamentosVencidos = treinamentos
        .filter(
          (t) =>
            t.proximoVencimento !== undefined &&
            diasAte(dataLocal(t.proximoVencimento), hoje) < 0,
        )
        .map((t) => t.nome);

      const dados: DadosProntidao = {
        certificacoes: cliente.certificacoes.map((cert) => ({
          rotulo: ROTULO_NORMA[cert.norma],
          venceEm: cert.venceEm,
          status: cert.status,
        })),
        capasAbertas: (capasAbertasPorCliente.get(cliente.nome) ?? []).map(
          (capa) => ({
            severidade: capa.severidade,
            prazo: capa.prazo,
            descricao: capa.descricao,
          }),
        ),
        documentosVencidos,
        treinamentosVencidos,
        visitaInternaNoAno,
      };

      return {
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        conformidade: cliente.conformidade,
        ...avaliarProntidao(dados, hoje),
      };
    }),
  );

  return resultados.sort((a, b) => {
    if (a.pronta !== b.pronta) return a.pronta ? 1 : -1;
    if (a.nota !== b.nota) return a.nota - b.nota;
    return a.clienteNome.localeCompare(b.clienteNome, "pt-BR");
  });
}
