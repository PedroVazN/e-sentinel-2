import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Order, OrderStatus, Paginated } from '@/types';
import { AnimatedPage } from '@/components/ui/motion';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/EmptyState';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  fulfilled: 'Faturado',
};

export default function Orders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      return (await api.get<Paginated<Order>>('/orders', { params })).data;
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: OrderStatus }) =>
      (await api.patch(`/orders/${id}/status`, { status: newStatus })).data,
    onSuccess: () => {
      toast.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const fulfill = useMutation({
    mutationFn: async (id: string) => (await api.post(`/orders/${id}/fulfill`)).data,
    onSuccess: () => {
      toast.success('Pedido faturado e estoque baixado');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        badge="Comercial"
        title="Pedidos"
        subtitle="Acompanhe pedidos do catálogo público e atualize o status em tempo real."
      />

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 glass rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-200 w-full"
            placeholder="Buscar por número, cliente, empresa, telefone..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="input !w-auto min-w-[180px]"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="fulfilled">Faturado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-slate-400 text-sm">Carregando pedidos...</div>
        ) : !data?.data.length ? (
          <div className="p-8">
            <EmptyState icon={ClipboardList} title="Sem pedidos ainda" description="Os novos pedidos aparecerão aqui." />
          </div>
        ) : (
          <div className="table-wrap rounded-none border-0">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((order) => (
                  <tr key={order._id}>
                    <td className="font-semibold text-white">{order.orderNumber}</td>
                    <td>
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-xs text-slate-500">{order.customer.company || order.customer.email}</div>
                    </td>
                    <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                    <td className="font-semibold">{formatCurrency(order.total)}</td>
                    <td>
                      <span className="badge bg-white/10 text-slate-200">{statusLabel[order.status]}</span>
                    </td>
                    <td className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <button
                            className="btn-secondary !px-3 !py-1.5 !text-xs"
                            onClick={() => changeStatus.mutate({ id: order._id, newStatus: 'confirmed' })}
                          >
                            Confirmar
                          </button>
                        )}
                        {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
                          <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => fulfill.mutate(order._id)}>
                            Faturar
                          </button>
                        )}
                        {order.status !== 'cancelled' && (
                          <button
                            className="btn-danger !px-3 !py-1.5 !text-xs"
                            onClick={() => changeStatus.mutate({ id: order._id, newStatus: 'cancelled' })}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
