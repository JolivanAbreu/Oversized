import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Coupons from './pages/Coupons';

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/produtos/novo" element={<ProtectedRoute adminOnly><ProductForm /></ProtectedRoute>} />
        <Route path="/produtos/:id" element={<ProtectedRoute adminOnly><ProductForm /></ProtectedRoute>} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/pedidos/:id" element={<OrderDetail />} />
        <Route path="/cupons" element={<ProtectedRoute adminOnly><Coupons /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
