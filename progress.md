# Progresso � Software como servico (SaaS) Gestor de Artes (Vue 3 + Supabase)

> Regra: marque [x] ao concluir e, ao retomar, continue da primeira linha n�o marcada.

## 0) Prepara��o
- [x] Criar projeto Vue 3 + Vite + TypeScript
- [x] Configurar TailwindCSS
- [x] Configurar shadcn-vue (componentes base instalados e funcionando)
- [x] Configurar ESLint + Prettier

## 1) Supabase (Infra)
- [x] Criar projeto no Supabase
- [x] Configurar vari�veis de ambiente (.env) na interface (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [x] Configurar linha de comando do Supabase (supabase init / login / link) � se aplic�vel
- [x] Criar compartimento de armazenamento `art-files` (privado)

## 2) Banco de dados (migracoes)
- [x] Checklist de modelo de politica admin registrado em AGENTS.md
- [x] Criar migracao inicial: tabelas (perfis, contas, conta_membros) + RLS/politicas
- [x] Criar migracao: tabelas (perfis, contas, conta_membros, clientes, artes)
- [x] Criar migracao: tabelas (financeiro_artes, arquivos_artes)
- [x] Criar gatilho atualizado_em para artes.atualizado_em
- [x] Habilitar RLS em todas as tabelas
- [x] Criar politicas RLS (multicontas por id_conta + conta_membros)
- [x] Criar politicas de armazenamento (compartimento art-files com caminhos {id_conta}/{id_arte}/...)

## 3) Base da Interface (Arquitetura)
- [x] Criar /src/lib/supabase.ts e inicializa��o do cliente
- [x] Configurar vue-router (rotas p�blicas e autenticadas)
- [x] Criar estados do Pinia (auth, conta)
- [x] Implementar guarda de rota (bloquear /app sem login)
- [x] Fluxo: no 1o acesso criar conta + conta_membros (papel=dono)

## 4) Layout e Navega��o
- [x] Criar layout autenticado /app com barra lateral + cabecalho
- [x] Criar pagina Dashboard (temporario com cartoes)
- [x] Criar p�gina clientes (temporario)
- [x] Criar p�gina Artes (temporario)
- [x] Criar p�gina Financeiro (temporario)

## 5) Repositorios (Dados)
- [x] Implementar repositorios/clientes.ts (cadastro/listagem/edicao/exclusao)
- [x] Implementar repositorios/artes.ts (cadastro/listagem/edicao/exclusao + filtros)
- [x] Implementar repositorios/financeiro.ts (ler/atualizar 1:1 por arte)
- [x] Implementar repositorios/arquivos.ts (Envio/listagem/remocao/gerar endereco)

## 6) Funcionalidades � clientes
- [x] Listagem com busca
- [x] Modal/Gaveta criar cliente
- [x] Editar cliente
- [x] Excluir cliente (com confirma��o)
- [x] Valida��es com zod/vee-validate
- [x] Criar tela de categorias de clientes (cadastro/edicao/exclusao)
- [x] Vincular cliente a categoria

## 7) Funcionalidades � Artes
- [x] Listagem com filtros: status, cliente, periodo, status_pagamento, modelo_cobranca
- [x] Criar arte (gera financeiro_artes automaticamente)
- [x] Editar arte (status, prazo, descricao, etc.)
- [x] Pagina detalhe /app/artes/:id
- [x] Atualizar status da arte (pendente/em_producao/pronta/entregue/cancelada)

## 8) Funcionalidades � Financeiro
- [x] Exibir financeiro vinculado na tela da arte
- [x] Alterar modelo_cobranca (antes/depois/plano/cortesia) com regra de consistencia
- [x] Alterar status_pagamento (pendente/paga/cortesia/plano)
- [x] Campos: valor_centavos, cobrado_em, pago_em, observacoes
- [x] Pagina Financeiro: totais do mes (recebido/pendente/cortesia/plano) + listagem

## 9) Funcionalidades � Arquivos (armazenamento)
- [x] Envio de arquivo na arte (caminho {id_conta}/{id_arte}/{nome_arquivo})
- [x] Listar arquivos por arte
- [x] Baixar/abrir arquivo (endereco assinado, se necessario)
- [x] Remover arquivo (opcional)

## 10) Qualidade e Entrega
- [x] Ajustar estados de carregamento/erro (avisos)
- [x] Revisar tipagens (TypeScript)
- [ ] Revisar RLS com cen�rio 2 usu�rios (n�o vazar dados)
- [x] Finalizar README com passo a passo completo
- [x] Revisar /docs/decisions.md



## 2025-12-30
- Corrigido armazenamento: removidas politicas duplicadas com identificador do compartimento em mai�sculo (ART-FILES).
- migracao aplicada: 20251230130000_fix_armazenamento_art_files_politicas.sql.


















