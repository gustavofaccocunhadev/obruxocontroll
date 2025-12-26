<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Artes</h1>
      <p class="text-sm text-muted-foreground">Area em construcao.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lista de artes</CardTitle>
          <CardDescription>Placeholder para pedidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Aqui voce vai acompanhar status, prazos e clientes.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes e prazos</CardTitle>
          <CardDescription>Interface em construcao.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Previsao de entrega e notas da arte aparecem aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
