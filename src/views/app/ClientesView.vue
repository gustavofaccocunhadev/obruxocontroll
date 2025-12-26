<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Clientes</h1>
      <p class="text-sm text-muted-foreground">Area em construcao.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
          <CardDescription>Placeholder para listagem.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Aqui voce vera seus clientes e podera adicionar novos.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filtros e busca</CardTitle>
          <CardDescription>Interface em construcao.</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Busque por nome, status e outros atributos.
          </p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
