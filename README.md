# obruxocontroll

Software como servico (SaaS) Gestor de Artes (Vue 3 + Supabase).

## Requisitos

- Node 20.19+ ou 22.12+
- Projeto Supabase remoto configurado

## Configuracao de ambiente

Crie um `.env` na raiz com:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Instalacao

```sh
npm install
```

## Desenvolvimento

```sh
npm run dev
```

## Banco de dados (Supabase remoto)

Opcional com linha de comando:

```sh
supabase login
supabase link --project-ref <seu-project-ref>
supabase db push
```

Se preferir, aplique as migrations manualmente pelo SQL Editor do Supabase.

## Qualidade

```sh
npm run lint
npm run type-check
```

## Verificacoes recomendadas

- Testar RLS com 2 usuarios (nao deve vazar dados entre contas).
- Verificar envio no armazenamento (compartimento `art-files`).
