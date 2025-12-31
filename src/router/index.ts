import { createRouter, createWebHistory, type Router } from "vue-router"
import type { Pinia } from "pinia"
import HomeView from "../views/HomeView.vue"
import LoginView from "../views/LoginView.vue"
import CadastroView from "../views/CadastroView.vue"
import RecuperarSenhaView from "../views/RecuperarSenhaView.vue"
import AppLayout from "../views/AppLayout.vue"
import DashboardView from "../views/app/DashboardView.vue"
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
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/cadastro',
      name: 'cadastro',
      component: CadastroView,
    },
    {
      path: '/recuperar-senha',
      name: 'recuperar-senha',
      component: RecuperarSenhaView,
    },
    {
      path: "/app",
      name: "app",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "app-dashboard",
          component: DashboardView,
        },
        {
          path: "clientes",
          name: "app-clientes",
          component: ClientesView,
        },
        {
          path: "categorias",
          name: "app-categorias-clientes",
          component: CategoriasClientesView,
        },
        {
          path: "artes",
          name: "app-artes",
          component: ArtesView,
        },
        {
          path: "artes/:id",
          name: "app-arte-detalhe",
          component: ArteDetalheView,
        },
        {
          path: "financeiro",
          name: "app-financeiro",
          component: FinanceiroView,
        },
      ],
    },
  ],
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
