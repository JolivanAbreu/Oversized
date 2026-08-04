import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center sm:px-8">
      <p className="font-display text-[8rem] leading-none">404</p>
      <p className="mt-2 font-mono text-sm uppercase tracking-widest text-ink-soft">Essa etiqueta não existe</p>
      <Button as={Link} to="/" variant="tag" className="mt-8">Voltar pra loja</Button>
    </div>
  );
}
