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
      className={`flex h-9 w-9 items-center justify-center border-2 border-ink bg-white text-lg transition-colors hover:border-tag ${className}`}
    >
      <span className={active ? 'text-danger' : 'text-ink'}>{active ? '★' : '☆'}</span>
    </button>
  );
}
