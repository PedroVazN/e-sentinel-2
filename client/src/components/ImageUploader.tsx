import { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ProductImage } from '@/types';

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

interface PreviewItem {
  id: string;
  file: File;
  url: string;
}

export default function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr: PreviewItem[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} não é uma imagem`);
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name} excede 8MB`);
        return;
      }
      arr.push({ id: `${Date.now()}-${Math.random()}`, file: f, url: URL.createObjectURL(f) });
    });
    setPreviews((p) => [...p, ...arr]);
  };

  const removePreview = (id: string) => {
    setPreviews((p) => {
      const item = p.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return p.filter((x) => x.id !== id);
    });
  };

  const removeUploaded = (publicId: string) => {
    onChange(images.filter((i) => i.publicId !== publicId));
  };

  const upload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      previews.forEach((p) => fd.append('images', p.file));
      const res = await api.post<{ images: ProductImage[] }>('/products/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...images, ...res.data.images]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      toast.success(`${res.data.images.length} imagem(ns) enviada(s)`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-white/[0.1] rounded-2xl p-8 text-center hover:border-corp-500/40 hover:bg-corp-500/5 transition-all cursor-pointer group"
      >
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <div className="inline-flex w-14 h-14 rounded-2xl bg-corp-500/10 border border-corp-500/20 text-corp-400 items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white">Arraste ou clique para enviar</p>
        <p className="text-xs text-slate-500 mt-1">Múltiplas imagens · PNG, JPG, WEBP até 8MB</p>
      </div>

      {(previews.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((img) => (
            <div key={img.publicId} className="relative group aspect-square rounded-xl overflow-hidden border border-white/[0.08]">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur">Salva</span>
              <button type="button" onClick={() => removeUploaded(img.publicId)} className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {previews.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-neon-cyan/40">
              <img src={p.url} alt="" className="w-full h-full object-cover opacity-80" />
              <span className="absolute top-1.5 left-1.5 badge bg-amber-500/20 text-amber-400 border border-amber-500/30">Pendente</span>
              <button type="button" onClick={() => removePreview(p.id)} className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <button type="button" onClick={upload} disabled={uploading} className="btn-primary w-full">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enviando {previews.length} imagem(ns)...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" /> Enviar {previews.length} imagem(ns)
            </>
          )}
        </button>
      )}
    </div>
  );
}
