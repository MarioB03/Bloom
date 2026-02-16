import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (user) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
