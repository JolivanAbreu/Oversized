import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext';

// Login agora é um modal global (ver components/LoginModal.jsx), acionado
// de qualquer lugar do app. Esta rota continua existindo só por
// compatibilidade com links antigos — ao acessá-la, abre o modal e volta
// pra home (ou pro destino que tiver sido passado via state.redirectTo).
export default function Login() {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    openLoginModal(location.state?.redirectTo || '/');
    navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
