import { createRouter, createWebHistory, type Router } from "vue-router"
import type { Pinia } from "pinia"
import HomeView from "../views/HomeView.vue"
import LoginView from "../views/LoginView.vue"
import CadastroView from "../views/CadastroView.vue"
import RecuperarSenhaView from "../views/RecuperarSenhaView.vue"
import AppLayout from "../views/AppLayout.vue"
import DashboardView from "../views/app/DashboardView.vue"
import PerfilView from "../views/app/PerfilView.vue"
import ClientesView from "../views/app/ClientesView.vue"
import CategoriasClientesView from "../views/app/CategoriasClientesView.vue"
import ArtesView from "../views/app/ArtesView.vue"
import ArteDetalheView from "../views/app/ArteDetalheView.vue"
import FinanceiroView from "../views/app/FinanceiroView.vue"
import { useAuthStore } from "@/stores/auth"
import { useContaStore } from "@/stores/conta"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: HomeView,
      meta: {
        title: "Gestor de artes",
        description:
          "Centralize clientes, artes e pagamentos sem planilhas. Controle o fluxo de pedidos pelo celular.",
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: "Entrar",
        description: "Acesse sua conta do BruxoControll com email e senha.",
      },
    },
    {
      path: '/cadastro',
      name: 'cadastro',
      component: CadastroView,
      meta: {
        title: "Criar conta",
        description: "Crie sua conta e comece a organizar artes, prazos e pagamentos.",
      },
    },
    {
      path: '/recuperar-senha',
      name: 'recuperar-senha',
      component: RecuperarSenhaView,
      meta: {
        title: "Recuperar senha",
        description: "Receba um email para redefinir sua senha com seguranca.",
      },
    },
    {
      path: "/app",
      name: "app",
      component: AppLayout,
      meta: {
        requiresAuth: true,
        title: "Painel",
        description: "Acompanhe clientes, artes e financeiro em um unico lugar.",
      },
      children: [
        {
          path: "",
          name: "app-dashboard",
          component: DashboardView,
          meta: { title: "Dashboard" },
        },
        {
          path: "perfil",
          name: "app-perfil",
          component: PerfilView,
          meta: { title: "Perfil" },
        },
        {
          path: "clientes",
          name: "app-clientes",
          component: ClientesView,
          meta: { title: "Clientes" },
        },
        {
          path: "categorias",
          name: "app-categorias-clientes",
          component: CategoriasClientesView,
          meta: { title: "Categorias" },
        },
        {
          path: "artes",
          name: "app-artes",
          component: ArtesView,
          meta: { title: "Artes" },
        },
        {
          path: "artes/:id",
          name: "app-arte-detalhe",
          component: ArteDetalheView,
          meta: { title: "Detalhe da arte" },
        },
        {
          path: "financeiro",
          name: "app-financeiro",
          component: FinanceiroView,
          meta: { title: "Financeiro" },
        },
      ],
    },
  ],
})

const TITULO_BASE = "BruxoControll"
const DESCRICAO_BASE =
  "Gestao de artes com clientes, pagamentos e prazos em um painel simples e rapido."

const atualizarMeta = (atributo: "name" | "property", chave: string, conteudo: string) => {
  let meta = document.querySelector(`meta[${atributo}='${chave}']`)
  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute(atributo, chave)
    document.head.appendChild(meta)
  }
  meta.setAttribute("content", conteudo)
}

const atualizarCanonical = (href: string) => {
  let link = document.querySelector("link[rel='canonical']")
  if (!link) {
    link = document.createElement("link")
    link.setAttribute("rel", "canonical")
    document.head.appendChild(link)
  }
  link.setAttribute("href", href)
}

router.afterEach((to) => {
  if (typeof window === "undefined") return

  const meta = to.meta as Record<string, unknown>
  const tituloPagina = typeof meta.title === "string" ? meta.title : null
  const descricaoPagina = typeof meta.description === "string" ? meta.description : DESCRICAO_BASE
  const robots =
    meta.requiresAuth === true
      ? "noindex, nofollow"
      : typeof meta.robots === "string"
        ? meta.robots
        : "index, follow"

  document.title = tituloPagina
    ? `${tituloPagina} | ${TITULO_BASE}`
    : `${TITULO_BASE} - Gestor de Artes`

  atualizarMeta("name", "description", descricaoPagina)
  atualizarMeta("name", "robots", robots)
  atualizarMeta("property", "og:title", document.title)
  atualizarMeta("property", "og:description", descricaoPagina)
  atualizarMeta("property", "og:type", "website")
  atualizarMeta("property", "og:site_name", TITULO_BASE)
  atualizarMeta("name", "twitter:title", document.title)
  atualizarMeta("name", "twitter:description", descricaoPagina)

  const canonicalUrl = new URL(window.location.href)
  canonicalUrl.search = ""
  canonicalUrl.hash = ""
  atualizarMeta("property", "og:url", canonicalUrl.toString())
  atualizarCanonical(canonicalUrl.toString())
})

export const setupRouterGuards = (router: Router, pinia: Pinia) => {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)
    const contaStore = useContaStore(pinia)

    await authStore.init()

    if (to.meta.requiresAuth && !authStore.session) {
      return { path: "/login", query: { redirect: to.fullPath } }
    }

    if (to.meta.requiresAuth && authStore.session && !contaStore.contaAtual && !contaStore.carregando) {
      await contaStore.inicializarConta(authStore.session.user.id)
    }

    return true
  })
}

export default router
