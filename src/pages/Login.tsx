import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthForm } from '../components/AuthForm';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/mon-compte';

  return (
    <div className="screen">
      <Header variant="light" />
      <div className="container" style={{ padding: '48px 22px', maxWidth: 420, margin: '0 auto' }}>
        <AuthForm returnTo={returnTo} onSuccess={() => navigate(returnTo)} />
      </div>
    </div>
  );
}
