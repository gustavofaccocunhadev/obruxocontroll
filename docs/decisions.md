# Decisoes - Software como servico (SaaS) Gestor de Artes

## Linguagem
- Padrao: Portugues Brasil (sem acentos no texto tecnico quando possivel).

## Banco de dados
- Tabelas/colunas em PT-BR, snake_case, sem acentos/cedilha.
- Tabelas no plural e chaves estrangeiras com prefixo `id_`.
- Datas: `criado_em` e `atualizado_em` (timestamptz).

## Categorias de clientes
- Tabela `categorias_clientes` por conta.
- Clientes usam `id_categoria` (substitui campo `tipo`).

## Multicontas
- Entidade de tenancy: `contas`.
- Associacao via `conta_membros`.
- RLS em todas as tabelas.

## Autenticacao
- Autenticacao do Supabase (email/senha).
- Primeiro acesso cria `conta` e `conta_membros` com `papel='dono'`.

## Financeiro
- Valores em centavos (`valor_centavos`).
- Regra: `modelo_cobranca='cortesia'` implica `status_pagamento='cortesia'` e `valor_centavos=0`.

## Armazenamento
- Compartimento privado `art-files`.
- Caminho: `{id_conta}/{id_arte}/{nome_arquivo}`.

## Interface
- Vue Router com guarda em `/app`.
- Pinia: `authStore` e `contaStore`.
- Repositorios em `src/repositories`.

## Status de arte
- `pendente`, `em_producao`, `pronta`, `entregue`, `cancelada`.

## Ambiente
- Banco remoto (Supabase). Nao usar dados de exemplo locais.


