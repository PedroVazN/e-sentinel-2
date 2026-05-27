import { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { AnimatedPage } from '@/components/ui/motion';
import PageHeader from '@/components/ui/PageHeader';

export default function CatalogShare() {
  const defaultBase = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  const [baseUrl, setBaseUrl] = useState(defaultBase);
  const catalogLink = `${baseUrl.replace(/\/$/, '')}/catalogo`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogLink);
      toast.success('Link copiado para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const downloadQrPng = () => {
    const canvas = document.getElementById('catalogo-qrcode') as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR Code não disponível para download');
      return;
    }

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'qrcode-catalogo.png';
    downloadLink.click();
    toast.success('QR Code baixado em PNG');
  };

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        badge="Comercial"
        title="Compartilhar Catálogo"
        subtitle="Gere um QR Code e copie o link direto para enviar aos clientes."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card p-6 space-y-4">
          <div>
            <label className="label">URL base do seu domínio</label>
            <input
              className="input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://seu-dominio.com"
            />
          </div>

          <div>
            <label className="label">Link do catálogo para cliente</label>
            <div className="glass rounded-xl p-3 text-sm text-slate-200 break-all">{catalogLink}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={copyLink}>
              <Copy className="w-4 h-4" /> Copiar Link
            </button>
            <a href={catalogLink} target="_blank" rel="noreferrer" className="btn-secondary">
              <ExternalLink className="w-4 h-4" /> Abrir Catálogo
            </a>
            <button className="btn-secondary" onClick={downloadQrPng}>
              <Download className="w-4 h-4" /> Baixar QR PNG
            </button>
          </div>
        </section>

        <aside className="card p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-corp-500/20 border border-corp-500/30 grid place-items-center">
            <QrCode className="w-7 h-7 text-corp-300" />
          </div>
          <p className="text-sm text-slate-400">Escaneie para abrir o catálogo no celular</p>
          <div className="bg-white rounded-2xl p-3">
            <QRCodeCanvas id="catalogo-qrcode" value={catalogLink} size={220} includeMargin />
          </div>
        </aside>
      </div>
    </AnimatedPage>
  );
}
