<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Area logada
      </p>
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="text-sm text-muted-foreground">Visao geral em construcao.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Clientes ativos</CardTitle>
          <CardDescription>Metricas temporarias.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">--</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Artes em andamento</CardTitle>
          <CardDescription>Status dos pedidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">--</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recebimentos</CardTitle>
          <CardDescription>Resumo financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold">R$ --</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Atalhos rapidos</CardTitle>
        <CardDescription>Conteudo em construcao.</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          Aqui voce podera criar artes, clientes e ver alertas importantes.
        </p>
      </CardContent>
    </Card>
  </section>
</template>
