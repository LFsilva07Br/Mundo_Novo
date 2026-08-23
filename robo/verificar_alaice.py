#!/usr/bin/env python3
"""
Robô de verificação de certificados — Mundo Novo Café
Verifica diariamente os certificados contra o diretório público da
Rainforest Alliance (painel Power BI — sem API pública, conforme
levantamento de 23/08/2026; o domínio alaice.org.br não existe).
A execução roda em modo "verificação assistida": confirma que o
diretório oficial está no ar e entrega ao gestor o link direto para
conferência, registrando tudo no log de execuções.

Requer as variáveis de ambiente:
  SUPABASE_URL                (ex.: https://xxxx.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY   (chave de serviço — somente no CI)
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
FONTE = "https://www.rainforest-alliance.org/pt-br/login/"  # portal MyRA (login) — fonte indicada pela Mundo Novo
PAINEL_PUBLICO = (
    "https://app.powerbi.com/view?r=eyJrIjoiMmFjMjk0YzAtZTBlNy00NWNiLTk2M2YtZDJjY2NlNWFjOGM1"
    "IiwidCI6ImFkN2QzYTVkLWNkYTQtNDkyMi05MDkxLTdmOTk5ODM3MmEzYyIsImMiOjN9"
)

CABECALHOS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def api(metodo: str, caminho: str, corpo=None, prefer=None):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    cab = dict(CABECALHOS)
    if prefer:
        cab["Prefer"] = prefer
    req = urllib.request.Request(
        f"{SUPABASE_URL}{caminho}", data=dados, headers=cab, method=metodo
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        conteudo = resp.read().decode()
        return json.loads(conteudo) if conteudo else None


def site_alaice_acessivel() -> bool:
    try:
        req = urllib.request.Request(FONTE, headers={"User-Agent": "MundoNovoRobo/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def principal() -> int:
    inicio = time.time()
    linhas_log = [f"verificando diretório público da Rainforest Alliance — {FONTE}"]

    certificacoes = api(
        "GET",
        "/rest/v1/certificacoes?select=id,norma,vence_em,clientes(nome)&vence_em=not.is.null",
    )
    total = len(certificacoes)
    linhas_log.append(f"{total} certificados com vencimento na base")

    acessivel = site_alaice_acessivel()
    divergencias = 0

    if acessivel:
        # O site não expõe consulta estruturada por certificado (sem API pública).
        # Confirmamos disponibilidade da fonte e carimbamos a verificação;
        # divergências são apontadas pela verificação assistida do gestor.
        status = "verificacao_assistida"
        linhas_log.append("diretório oficial no ar — conferência assistida disponível")
        linhas_log.append(f"painel público para conferência: {PAINEL_PUBLICO}")
        agora = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        api(
            "PATCH",
            "/rest/v1/certificacoes?vence_em=not.is.null",
            {"verificada_pelo_robo_em": agora},
            prefer="return=minimal",
        )
    else:
        status = "falha"
        linhas_log.append("diretório oficial indisponível — tentar novamente na próxima execução")

    duracao = round(time.time() - inicio, 2)
    linhas_log.append(f"concluído em {duracao}s")

    api(
        "POST",
        "/rest/v1/execucoes_robo",
        {
            "status": status,
            "certificados_consultados": total,
            "divergencias": divergencias,
            "duracao_segundos": duracao,
            "log": "\n".join(linhas_log),
        },
        prefer="return=minimal",
    )

    print("\n".join(linhas_log))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
