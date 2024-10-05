import { getUserRole } from '@/config/roles';

export function isAdminRRHH(session) {
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const userRole = getUserRole(session.user.email);
  return userRole === 'adminRRHH';
}