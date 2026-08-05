import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/entrar" replace />;
  // Operador tentando acessar algo restrito a admin (ex.: "/") vai para
  // "/pedidos" — nunca de volta para a mesma rota, para não criar loop de
  // redirecionamento.
  if (adminOnly && !isAdmin) return <Navigate to="/pedidos" replace />;
  return children;
}
