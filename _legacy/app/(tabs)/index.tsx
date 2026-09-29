import HomeBusinessScreen from '@/app/home/home-business';
import HomeUserScreen from '@/app/home/home-user';
import { useAuth } from '../../context/auth-context';

export default function IndexScreen() {
  const { session } = useAuth();

  console.log('User session:', session);

  if (session?.role === 'Negocio') {
    return <HomeBusinessScreen />;
  }

  return <HomeUserScreen />;
}
