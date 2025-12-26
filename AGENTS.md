# Decisions — SaaS Gestor de Artes (Vue 3 + Supabase)

## Language
- Português Brasil
- Me responda sempre em português

Este documento registra decisões de arquitetura e padrões do projeto. Atualize quando houver mudanças relevantes.

## 0) Regras padrão
- Sempre que criar algo, já criar a opção de editar, deletar, salvar CRUD completo.
- Sempre pensar em responsividade, "mobile first". Vai ser usado mais em celulares.

## 1) Padrão de nomenclatura (Database)
- Tabelas e colunas em português, SEM acentos e SEM cedilha.
- Formato: `snake_case`.
- Tabelas no plural: `clientes`, `artes`, `contas`.
- Chaves estrangeiras sempre com prefixo `id_`: `id_conta`, `id_cliente`, `id_arte`.
- Datas padrão:
  - `criado_em` e `atualizado_em` em `timestamptz`.
  - Campos de cobrança/pagamento como `date` (apenas data).

## 2) Multi-tenant (isolamento por conta)
- Entidade de tenancy: `contas`.
- Permissões por associação: `conta_membros`.
- Isolamento garantido por RLS (Row Level Security) em todas as tabelas.
- Frontend nunca confia em filtro por `id_conta` como segurança; é apenas UX.

## 3) Auth e bootstrap de conta
- Auth via Supabase Auth (email/senha).
- No primeiro login:
  - Criar uma `conta` automaticamente.
  - Criar registro em `conta_membros` com `papel='dono'`.
- MVP: sem convites/gestão avançada de membros (pode ser evoluído).


## 3.1) Admin geral (RLS)
- Usuario admin definido em auth.users.raw_app_meta_data.role = "admin".
- Funcao helper: public.is_admin().
- Template de policy para novas tabelas (com comentario identificador):

```sql
-- ADMIN_POLICY_TEMPLATE: aplicar em novas tabelas
create policy admin_all on public.sua_tabela
for all
using (public.is_admin())
with check (public.is_admin());
```
## 4) Financeiro
- Armazenar valores sempre em centavos: `valor_centavos int`.
- Formatar BRL apenas no frontend.
- Relação 1:1 no MVP: cada `arte` possui no máximo um registro em `financeiro_artes`.
- Regras de consistência (validar no frontend e também via constraints quando fizer sentido):
  - `modelo_cobranca='cortesia'` implica `status_pagamento='cortesia'` e `valor_centavos=0`.

## 5) Storage (arquivos de artes)
- Bucket: `art-files` (privado).
- Path padrão: `{id_conta}/{id_arte}/{nome_arquivo}`.
- Policies de Storage restringem read/write apenas se o usuário for membro da `id_conta` do path.

## 6) Frontend (organização)
- Router: `vue-router` com guard em rotas `/app`.
- State mínimo via Pinia:
  - `authStore` (sessão/usuário)
  - `contaStore` (conta atual)
- Acesso a dados via repositórios:
  - `src/repositories/clientes.ts`, `artes.ts`, `financeiro.ts`, `arquivos.ts`.
- Composables utilitários:
  - `useMoeda` (BRL), `useToast`, `useAuth`, `useConta`.

## 7) Evolução planejada (não MVP)
- Múltiplas cobranças por arte (parcelas, extras).
- Permissões por papel (dono/membro) mais completas.
- Histórico de alterações por arte (audit log).

## 8) RESTRIÇÕES
- Não criar novo projeto; trabalhar no repo atual.
- Manter nomes de tabelas em PT-BR (snake_case, sem acentos).
- Manter shadcn-vue + Tailwind.
