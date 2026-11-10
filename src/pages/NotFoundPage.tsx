import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[60dvh] place-items-center text-center">
      <div>
        <p className="text-5xl font-bold text-brand-300">404</p>
        <p className="mt-2 text-gray-600">This page doesn’t exist.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          Go to New invoice
        </Button>
      </div>
    </div>
  );
}
