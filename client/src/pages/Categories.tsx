import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tags, Sparkles, Flame, Wind, Heart, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Category } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

const ICONS = [
  { value: 'package', label: 'Pacote', Icon: Package },
  { value: 'sparkles', label: 'Brilho', Icon: Sparkles },
  { value: 'flame', label: 'Chama', Icon: Flame },
  { value: 'wind', label: 'Vento', Icon: Wind },
  { value: 'heart', label: 'Coração', Icon: Heart },
  { value: 'tags', label: 'Tags', Icon: Tags },
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#64748b',
];

function getIcon(name: string) {
  return ICONS.find((i) => i.value === name)?.Icon || Package;
}

interface FormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function Categories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    color: COLORS[0],
    icon: 'package',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const saveMut = useMutation({
    mutationFn: async (payload: FormData) =>
      editing
        ? (await api.put(`/categories/${editing._id}`, payload)).data
        : (await api.post('/categories', payload)).data,
    onSuccess: () => {
      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: () => {
      toast.success('Categoria excluída');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditing(cat);
      setForm({ name: cat.name, description: cat.description, color: cat.color, icon: cat.icon });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', color: COLORS[0], icon: 'package' });
    }
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Informe o nome da categoria');
    saveMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{data?.length || 0} categoria(s) cadastrada(s)</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={Tags}
            title="Nenhuma categoria"
            description="Crie sua primeira categoria para organizar os produtos."
            action={
              <button onClick={() => openForm()} className="btn-primary">
                <Plus className="w-4 h-4" /> Criar Categoria
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((cat) => {
            const Icon = getIcon(cat.icon);
            return (
              <div key={cat._id} className="card p-5 group hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl grid place-items-center text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(cat)} className="p-2 rounded-lg hover:bg-white/[0.06]">
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir categoria "${cat.name}"?`)) deleteMut.mutate(cat._id);
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="badge bg-white/[0.03] text-slate-600">
                    <Package className="w-3 h-3" /> {cat.productCount || 0} produto(s)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={closeForm} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Ex: Sabonetes"
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Descrição opcional"
            />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-9 h-9 rounded-xl shadow-sm transition-all ${
                    form.color === c ? 'ring-4 ring-offset-2 ring-brand-300 scale-110' : ''
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Ícone</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map(({ value, Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, icon: value })}
                  title={label}
                  className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${
                    form.icon === value
                      ? 'border-brand-500 bg-corp-500/10 text-corp-400'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary flex-1">
              {saveMut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
