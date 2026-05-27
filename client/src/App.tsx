import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Manufacturing from './pages/Manufacturing';
import Reports from './pages/Reports';
import PriceList from './pages/PriceList';
import Orders from './pages/Orders';
import PublicCatalog from './pages/PublicCatalog';
import CatalogShare from './pages/CatalogShare';

export default function App() {
  return (
    <Routes>
      <Route path="/catalogo" element={<PublicCatalog />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/estoque" element={<Stock />} />
        <Route path="/fabricacao" element={<Manufacturing />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/compartilhar-catalogo" element={<CatalogShare />} />
        <Route path="/precos" element={<PriceList />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
