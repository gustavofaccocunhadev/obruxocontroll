# Progresso — SaaS Gestor de Artes (Vue 3 + Supabase)

> Regra: marque [x] ao concluir e, ao retomar, continue da primeira linha não marcada.

## 0) Preparação
- [x] Criar projeto Vue 3 + Vite + TypeScript
- [x] Configurar TailwindCSS
- [x] Configurar shadcn-vue (componentes base instalados e funcionando)
- [ ] Configurar ESLint + Prettier

## 1) Supabase (Infra)
- [x] Criar projeto no Supabase
- [x] Configurar variáveis de ambiente (.env) no frontend (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [x] Configurar Supabase CLI (supabase init / login / link) — se aplicável
- [ ] Criar bucket Storage `art-files` (privado)

## 2) Banco de dados (Migrations)
- [x] Checklist admin policy template registrado em AGENTS.md
- [x] Criar migration inicial: tabelas (perfis, contas, conta_membros) + RLS/policies
- [ ] Criar migration: tabelas (perfis, contas, conta_membros, clientes, artes, financeiro_artes, arquivos_artes)
- [ ] Criar trigger updated_at para artes.atualizado_em
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar policies RLS (multi-tenant por id_conta + conta_membros)
- [ ] Criar policies de Storage (bucket art-files com paths {id_conta}/{id_arte}/...)
- [ ] (Opcional) Criar seed.sql com dados de exemplo

## 3) Base do Frontend (Arquitetura)
- [x] Criar /src/lib/supabase.ts e inicialização do client
- [x] Configurar vue-router (rotas públicas e autenticadas)
- [x] Criar Pinia stores (auth, conta)
- [x] Implementar guard de rota (bloquear /app sem login)
- [x] Fluxo: no 1o login criar conta + conta_membros (papel=dono)

## 4) Layout e Navegação
- [x] Criar layout autenticado /app com sidebar + header
- [ ] Criar página Dashboard (placeholder com cards)
- [ ] Criar página Clientes (placeholder)
- [ ] Criar página Artes (placeholder)
- [ ] Criar página Financeiro (placeholder)

## 5) Repositories (Dados)
- [ ] Implementar repositories/clientes.ts (CRUD)
- [ ] Implementar repositories/artes.ts (CRUD + filtros)
- [ ] Implementar repositories/financeiro.ts (ler/atualizar 1:1 por arte)
- [ ] Implementar repositories/arquivos.ts (upload/listar/remover/gerar URL)

## 6) Funcionalidades — Clientes
- [ ] Listagem com busca
- [ ] Modal/Drawer criar cliente
- [ ] Editar cliente
- [ ] Excluir cliente (com confirmação)
- [ ] Validações com zod/vee-validate

## 7) Funcionalidades — Artes
- [ ] Listagem com filtros: status, cliente, período, status_pagamento, modelo_cobranca
- [ ] Criar arte (gera financeiro_artes automaticamente)
- [ ] Editar arte (status, prazo, descrição, etc.)
- [ ] Página detalhe /app/artes/:id
- [ ] Atualizar status da arte (backlog/em_producao/pronta/entregue/cancelada)

## 8) Funcionalidades — Financeiro
- [ ] Exibir financeiro vinculado na tela da arte
- [ ] Alterar modelo_cobranca (antes/depois/plano/cortesia) com regra de consistência
- [ ] Alterar status_pagamento (pendente/paga/cortesia/plano)
- [ ] Campos: valor_centavos, cobrado_em, pago_em, observacoes
- [ ] Página Financeiro: totais do mês (recebido/pendente/cortesia/plano) + listagem

## 9) Funcionalidades — Arquivos (Storage)
- [ ] Upload de arquivo na arte (path {id_conta}/{id_arte}/{nome_arquivo})
- [ ] Listar arquivos por arte
- [ ] Download/abrir arquivo (URL assinada, se necessário)
- [ ] Remover arquivo (opcional)

## 10) Qualidade e Entrega
- [ ] Ajustar estados de loading/erro (toasts)
- [ ] Revisar tipagens (TypeScript)
- [ ] Revisar RLS com cenário 2 usuários (não vazar dados)
- [ ] Finalizar README com passo a passo completo
- [ ] Revisar /docs/decisions.md



