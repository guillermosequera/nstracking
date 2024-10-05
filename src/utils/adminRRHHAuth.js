import { getUserRole } from '@/config/roles';

export function isAdminRRHH(session) {
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const userRole = getUserRole(session.user.email);
  return userRole === 'adminRRHH';
}

export function withAdminRRHHAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Do nothing while loading
      if (!isAdminRRHH(session)) {
        console.log('User is not adminRRHH, redirecting');
        router.push('/');
      }
    }, [session, status, router]);

    if (status === 'loading') {
      return <div>Cargando...</div>;
    }

    if (!isAdminRRHH(session)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}