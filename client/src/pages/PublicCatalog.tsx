import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Search, ShoppingCart, Trash2, Plus, Minus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { apiUrl } from '@/lib/apiBase';
import { Category, Paginated, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

type CartItem = { product: Product; quantity: number };
type Step = 'catalog' | 'cart';

export default function PublicCatalog() {
  const [step, setStep] = useState<Step>('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
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

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
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

  const goToCart = () => {
    if (cart.length === 0) return toast.error('Adicione produtos antes de ir ao carrinho');
    setStep('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setCustomer({ name: '', phone: '', notes: '' });
      setStep('catalog');
    },
  });

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone) {
      return toast.error('Preencha nome e telefone');
    }
    if (cart.length === 0) return toast.error('Seu carrinho está vazio');
    placeOrder.mutate();
  };

  const products = productsData?.data || [];

  return (
    <div className="min-h-screen bg-void bg-mesh-dark text-slate-200">
      <header className="border-b border-white/10 bg-void-100/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-corp-400 font-semibold">eSentinel</p>
            <h1 className="text-xl font-bold text-white">
              {step === 'catalog' ? 'Catálogo Digital' : 'Finalizar Pedido'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {step === 'cart' ? (
              <button className="btn-secondary" onClick={() => setStep('catalog')}>
                <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
              </button>
            ) : (
              <>
                <button className="btn-secondary relative" onClick={goToCart}>
                  <ShoppingCart className="w-4 h-4" />
                  Carrinho
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-corp-500 text-white text-[11px] font-bold grid place-items-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <a href={apiUrl('/reports/catalog-pdf')} className="btn-secondary hidden sm:inline-flex">
                  <Download className="w-4 h-4" /> Baixar PDF
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        {step === 'catalog' ? (
          <>
            <div className="card p-6 md:p-8 mb-6">
              <span className="badge bg-corp-500/10 text-corp-300 border border-corp-500/20 mb-3">
                <Sparkles className="w-3 h-3" /> Vitrine comercial premium
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-white max-w-2xl">
                Escolha os produtos e depois finalize no carrinho.
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl">
                Adicione itens ao carrinho e clique em &quot;Ir para o carrinho&quot; quando estiver pronto.
              </p>
            </div>

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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="card p-4">
                      <div className="skeleton h-40 mb-4" />
                      <div className="skeleton h-4 w-2/3 mb-2" />
                      <div className="skeleton h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => {
                    const category =
                      typeof product.category === 'object' && product.category
                        ? product.category.name
                        : 'Sem categoria';
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

            {cartCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[360px] z-20">
                <div className="card p-4 flex items-center justify-between gap-3 shadow-premium">
                  <div>
                    <p className="text-sm text-slate-400">{cartCount} item(ns) no carrinho</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(subtotal)}</p>
                  </div>
                  <button className="btn-primary" onClick={goToCart}>
                    Ir para o carrinho
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="card p-4 space-y-3">
              <h2 className="text-lg font-semibold text-white mb-2">Seu carrinho</h2>
              {cart.length === 0 ? (
                <p className="text-sm text-slate-500">Seu carrinho está vazio.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product._id} className="glass rounded-xl p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {item.product.images?.[0]?.url ? (
                        <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs text-slate-500">Sem foto</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.product.name}</p>
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
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-corp-300">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                          <button className="btn-ghost !p-1.5 text-rose-400" onClick={() => updateQuantity(item.product._id, 0)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <aside className="card p-5 h-fit space-y-4">
              <h3 className="font-semibold text-white">Dados do pedido</h3>
              <form className="space-y-3" onSubmit={submitOrder}>
                <input
                  className="input"
                  placeholder="Nome *"
                  value={customer.name}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Telefone *"
                  value={customer.phone}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Observações"
                  value={customer.notes}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, notes: e.target.value }))}
                />

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total</span>
                    <strong className="text-xl text-white">{formatCurrency(subtotal)}</strong>
                  </div>
                </div>

                <button className="btn-primary w-full" disabled={placeOrder.isPending || cart.length === 0}>
                  {placeOrder.isPending ? 'Enviando pedido...' : 'Finalizar pedido'}
                </button>
              </form>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
