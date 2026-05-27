import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Search, ShoppingCart, Trash2, Plus, Minus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { apiUrl } from '@/lib/apiBase';
import { Category, Paginated, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

type CartItem = { product: Product; quantity: number };

export default function PublicCatalog() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog-products', search, categoryFilter],
    queryFn: async () => {
      const params: any = { limit: 200, sort: 'name' };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      return (await api.get<Paginated<Product>>('/catalog/products', { params })).data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => (await api.get<Category[]>('/catalog/categories')).data,
  });

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product._id === product._id);
      if (exists) {
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success('Produto adicionado ao carrinho');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product._id !== id));
      return;
    }
    setCart((prev) => prev.map((item) => (item.product._id === id ? { ...item, quantity } : item)));
  };

  const placeOrder = useMutation({
    mutationFn: async () =>
      (
        await api.post('/orders', {
          customer,
          items: cart.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
        })
      ).data,
    onSuccess: (order) => {
      toast.success(`Pedido ${order.orderNumber} enviado com sucesso!`);
      setCart([]);
      setCustomer({ name: '', company: '', phone: '', email: '', notes: '' });
    },
  });

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.email) {
      return toast.error('Preencha nome, telefone e e-mail');
    }
    if (cart.length === 0) return toast.error('Adicione itens no carrinho');
    placeOrder.mutate();
  };

  const products = productsData?.data || [];

  return (
    <div className="min-h-screen bg-void bg-mesh-dark text-slate-200">
      <header className="border-b border-white/10 bg-void-100/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-corp-400 font-semibold">eSentinel</p>
            <h1 className="text-xl font-bold text-white">Catálogo Digital</h1>
          </div>
          <a href={apiUrl('/reports/catalog-pdf')} className="btn-secondary">
            <Download className="w-4 h-4" /> Baixar Catálogo PDF
          </a>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6 md:p-8 mb-6">
          <span className="badge bg-corp-500/10 text-corp-300 border border-corp-500/20 mb-3">
            <Sparkles className="w-3 h-3" /> Vitrine comercial premium
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white max-w-2xl">
            Produtos profissionais para pedidos rápidos e organizados.
          </h2>
          <p className="text-slate-400 mt-3 max-w-2xl">
            Consulte preços, filtre por categoria e envie seu pedido diretamente pelo catálogo.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <div className="card p-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[240px] flex items-center gap-2 glass rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                  placeholder="Buscar por nome, SKU, descrição..."
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input !w-auto min-w-[220px]"
              >
                <option value="">Todas as categorias</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="card p-4">
                    <div className="skeleton h-40 mb-4" />
                    <div className="skeleton h-4 w-2/3 mb-2" />
                    <div className="skeleton h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((product) => {
                  const category =
                    typeof product.category === 'object' && product.category ? product.category.name : 'Sem categoria';
                  return (
                    <article key={product._id} className="card-hover p-4">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 mb-4">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-slate-500 text-sm">Sem imagem</div>
                        )}
                      </div>
                      <span className="badge bg-white/5 text-slate-400 mb-2">{category}</span>
                      <h3 className="text-white font-semibold">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">{product.description || ' '}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-corp-300 text-lg font-bold">{formatCurrency(product.price)}</p>
                          <p className="text-[11px] text-slate-500">SKU: {product.sku || '-'}</p>
                        </div>
                        <button className="btn-primary !px-3 !py-2" onClick={() => addToCart(product)}>
                          <Plus className="w-4 h-4" /> Adicionar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="card p-4 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4" />
              <h3 className="font-semibold text-white">Resumo do pedido</h3>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-sm text-slate-500">Seu carrinho está vazio.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product._id} className="glass rounded-xl p-3">
                    <p className="text-sm font-medium text-white">{item.product.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{formatCurrency(item.product.price)} un.</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost !p-1.5" onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button className="btn-ghost !p-1.5" onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button className="btn-ghost !p-1.5 text-rose-400" onClick={() => updateQuantity(item.product._id, 0)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total</span>
              <strong className="text-lg text-white">{formatCurrency(subtotal)}</strong>
            </div>

            <form className="mt-4 space-y-2" onSubmit={submitOrder}>
              <input
                className="input"
                placeholder="Nome *"
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Empresa"
                value={customer.company}
                onChange={(e) => setCustomer((prev) => ({ ...prev, company: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Telefone *"
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                className="input"
                placeholder="E-mail *"
                value={customer.email}
                onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
              />
              <textarea
                className="input min-h-[90px]"
                placeholder="Observações"
                value={customer.notes}
                onChange={(e) => setCustomer((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <button className="btn-primary w-full" disabled={placeOrder.isPending}>
                {placeOrder.isPending ? 'Enviando pedido...' : 'Finalizar pedido'}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}
