import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/token-manager';

export default async function HomePage() {
  // Check if user is authenticated
  const accessToken = await getAccessToken();

  // Redirect to appropriate page
  if (accessToken) {
    redirect('/documentos');
  } else {
    redirect('/login');
  }
}