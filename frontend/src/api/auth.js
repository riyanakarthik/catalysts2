// auth.js - Centralized auth storage helpers
// Keeps admin and worker sessions completely separate in localStorage

export function getActiveRole() {
  return localStorage.getItem('active_role'); // 'ADMIN' | 'WORKER'
}

export function getStoredUser() {
  const role = getActiveRole();
  if (!role) return null;
  try {
    return JSON.parse(localStorage.getItem(`${role.toLowerCase()}_user`));
  } catch {
    return null;
  }
}

export function getStoredToken() {
  const role = getActiveRole();
  if (!role) return null;
  return localStorage.getItem(`${role.toLowerCase()}_token`);
}

export function saveSession(role, token, user) {
  const prefix = role.toLowerCase(); // 'admin' or 'worker'
  localStorage.setItem('active_role', role);
  localStorage.setItem(`${prefix}_token`, token);
  localStorage.setItem(`${prefix}_user`, JSON.stringify(user));
}

export function clearSession(role) {
  if (role) {
    const prefix = role.toLowerCase();
    localStorage.removeItem(`${prefix}_token`);
    localStorage.removeItem(`${prefix}_user`);
  }
  localStorage.removeItem('active_role');
}
