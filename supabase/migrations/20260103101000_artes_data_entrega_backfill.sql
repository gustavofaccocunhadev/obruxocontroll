update public.artes
set data_entrega = atualizado_em::date
where status = 'entregue'
  and data_entrega is null;
