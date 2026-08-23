import type { Metadata } from "next";
import Link from "next/link";
import { RodapeAjuda } from "@/components/rodape-ajuda";
import { clienteDoCanal } from "@/lib/portal/canal-queixas";
import { FormularioQueixa } from "./formulario-queixa";

/**
 * Título de aba neutro: em celular emprestado ou compartilhado, a aba
 * aberta não pode entregar que a pessoa foi denunciar alguma coisa.
 */
export const metadata: Metadata = {
  // `absolute` para não herdar "· Mundo Novo Café" do layout raiz: a aba
  // não deve nem sugerir de que sistema é a página.
  title: { absolute: "Fale com a gente" },
};

export default async function PaginaCanalQueixas({
  params,
}: PageProps<"/queixa/[clienteId]">) {
  const { clienteId } = await params;
  const cliente = await clienteDoCanal(clienteId);

  return (
    <main className="flex min-h-dvh flex-1 items-start justify-center bg-sidebar p-6 sm:items-center">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl">
            🗣️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Fale com a gente
          </h1>
          {cliente ? (
            <>
              <p className="mt-1 text-base font-semibold text-[#95D5B2]">
                {cliente.nome}
              </p>
              <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-white/80">
                Este é um espaço seguro para contar qualquer situação que te
                incomode no trabalho — condições, tratamento, pagamento ou o
                que for.
              </p>
            </>
          ) : null}
        </div>

        {cliente ? (
          <FormularioQueixa clienteId={cliente.id} />
        ) : (
          <CanalNaoEncontrado />
        )}

        {cliente ? (
          <div className="mt-6 text-center">
            <p className="text-base text-white/70">
              Quer saber no que deu um relato que você já enviou?
            </p>
            <Link
              href="/queixa/acompanhar"
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-white/30 px-4 text-base font-bold text-[#95D5B2] transition-colors hover:bg-white/10"
            >
              Consultar pelo código
            </Link>
          </div>
        ) : null}

        <RodapeAjuda canal="queixas" tema="escuro" className="mt-6" />
      </div>
    </main>
  );
}

/**
 * Endereço errado: antes esta página mostrava o formulário funcionando, a
 * pessoa escrevia o relato, recebia "recebemos" e o texto sumia. Agora não
 * existe formulário nenhum — só a orientação para achar o endereço certo.
 */
function CanalNaoEncontrado() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-warning/40 bg-warning/10 p-5 text-white"
    >
      <h2 className="text-lg font-extrabold text-white">
        Este endereço não é de nenhuma fazenda.
      </h2>
      <p className="mt-2 text-base leading-relaxed text-white/85">
        Se você escrever aqui, ninguém vai receber o seu relato. Por isso não
        abrimos o formulário — melhor você saber agora do que falar no vazio.
      </p>
      <p className="mt-3 text-base font-bold text-white">O que fazer:</p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-base leading-relaxed text-white/85">
        <li>
          Volte ao cartaz do canal de escuta na fazenda (costuma ficar no
          refeitório, no alojamento ou perto do ponto) e leia o QR code de
          novo com a câmera do celular.
        </li>
        <li>
          Se você digitou o endereço à mão, confira letra por letra — um traço
          ou uma letra trocada já leva para o lugar errado.
        </li>
        <li>
          Se continuar não funcionando, fale direto com a equipe de
          certificação pelos contatos abaixo. Ela registra o seu relato do
          mesmo jeito, com o mesmo sigilo.
        </li>
      </ol>
    </div>
  );
}
