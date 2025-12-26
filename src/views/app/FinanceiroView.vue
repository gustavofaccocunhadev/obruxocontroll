<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Financeiro</h1>
      <p class="text-sm text-muted-foreground">Area em construcao.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resumo do mes</CardTitle>
          <CardDescription>Placeholder de totais.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Recebido, pendente e cortesias aparecerao aqui.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos pendentes</CardTitle>
          <CardDescription>Interface em construcao.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Lista de artes aguardando pagamento.
          </p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
