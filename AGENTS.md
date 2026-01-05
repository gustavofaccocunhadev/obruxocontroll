# Decisoes — Software como servico (SaaS) Gestor de Artes (Vue 3 + Supabase)

## Linguagem
- Português Brasil
- Me responda sempre em português

Este documento registra decisões de arquitetura e padrões do projeto. Atualize quando houver mudanças relevantes.

## 0) Regras padrão
- Sempre que criar algo, já criar a opção de editar, deletar, salvar cadastro, listagem, edicao e exclusao completos.
- Sempre pensar em responsividade, prioridade para celular. Vai ser usado mais em celulares.
- Evitar termos em ingles em textos da interface e documentos; preferir portugues.

## 1) Padrão de nomenclatura (Banco de dados)
- Tabelas e colunas em português, SEM acentos e SEM cedilha.
- Formato: `snake_case`.
- Tabelas no plural: `clientes`, `artes`, `contas`.
- Chaves estrangeiras sempre com prefixo `id_`: `id_conta`, `id_cliente`, `id_arte`.
- Datas padrão:
  - `criado_em` e `atualizado_em` em `timestamptz`.
  - Campos de cobrança/pagamento como `date` (apenas data).

## 2) Multicontas (isolamento por conta)
- Entidade de conta: `contas`.
- Permissões por associação: `conta_membros`.
- Isolamento garantido por RLS (seguranca em nivel de linha) em todas as tabelas.
- A interface nunca confia em filtro por `id_conta` como segurança; é apenas experiencia do usuario.

## 3) Autenticacao e criacao de conta
- Autenticacao via Supabase (email/senha).
- No primeiro acesso:
  - Criar uma `conta` automaticamente.
  - Criar registro em `conta_membros` com `papel='dono'`.
- PMV (produto minimo viavel): sem convites/gestão avançada de membros (pode ser evoluído).


## 3.1) Admin geral (RLS)
- Usuario admin definido em auth.users.raw_app_meta_data.role = "admin".
- Funcao helper: public.is_admin().
- Modelo de politica para novas tabelas (com comentario identificador):

```sql
-- MODELO_POLITICA_ADMIN: aplicar em novas tabelas
create policy admin_all on public.sua_tabela
for all
using (public.is_admin())
with check (public.is_admin());
```

## 3.2) Autenticacao - evitar travamento ao voltar a aba
- Nunca chamar `supabase.auth.getSession()` dentro de `onAuthStateChange` (nem indiretamente).
- Dentro do callback, use apenas o `session` recebido para decidir e passar `user.id` para stores.
- So inicializar a conta em eventos relevantes (`SIGNED_IN`, `USER_UPDATED`).
- Em `SIGNED_OUT`, limpar estado e nao fazer chamadas extras.
- Motivo: chamar `getSession` dentro do callback pode causar bloqueio e deixar telas em "carregando" infinito ao trocar de aba.
## 4) Financeiro
- Armazenar valores sempre em centavos: `valor_centavos int`.
- Formatar BRL apenas na interface.
- Relação 1:1 no PMV (produto minimo viavel): cada `arte` possui no máximo um registro em `financeiro_artes`.
- Regras de consistência (validar na interface e também via constraints quando fizer sentido):
  - `status_pagamento`: usar apenas `pendente` ou `paga`.
  - `modelo_cobranca='cortesia'` implica `status_pagamento='paga'` e `valor_centavos=0`.

## 5) Armazenamento (arquivos de artes)
- Compartimento: `art-files` (privado).
- Caminho padrão: `{id_conta}/{id_arte}/{nome_arquivo}`.
- Politicas de armazenamento restringem leitura/escrita apenas se o usuário for membro da `id_conta` do caminho.

## 6) Interface (organização)
- Roteador: `vue-router` com guarda nas rotas `/app`.
- Estado mínimo via Pinia:
  - `authStore` (sessão/usuário)
  - `contaStore` (conta atual)
- Acesso a dados via repositórios:
  - `src/repositories/clientes.ts`, `artes.ts`, `financeiro.ts`, `arquivos.ts`.
- Funcoes reutilizaveis:
  - `useMoeda` (BRL), `useToast`, `useAuth`, `useConta`.

## 7) Evolução planejada (não PMV)
- Múltiplas cobranças por arte (parcelas, extras).
- Permissões por papel (dono/membro) mais completas.
- Histórico de alterações por arte (registro de auditoria).

## 8) RESTRIÇÕES
- Não criar novo projeto; trabalhar no repo atual.
- Manter nomes de tabelas em PT-BR (snake_case, sem acentos).
- Manter shadcn-vue + Tailwind.














