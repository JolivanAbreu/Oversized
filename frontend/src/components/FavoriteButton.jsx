import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthModal } from '../context/AuthModalContext';

export default function FavoriteButton({ productId, className = '' }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useWishlist();
  const { openLoginModal } = useAuthModal();
  const active = isFavorite(productId);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    toggle(productId);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={active}
      className={`flex items-center justify-center border-[1.5px] text-lg transition-colors ${
        active ? 'border-danger bg-danger text-white' : 'border-[#111111] bg-white text-[#111111] hover:border-tag'
      } ${className || 'h-9 w-9 border-2'}`}
    >
      <span>{active ? '★' : '☆'}</span>
    </button>
  );
}
