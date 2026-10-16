// Mock-only accounts for the prototype. Not real authentication.
export type Role = 'admin' | 'client';

export type User = {
  username: string;
  name: string;
  role: Role;
  assignedFeatures: string[];
};

type Account = User & { password: string };

const ACCOUNTS: Account[] = [
  { username: 'admin', password: '123', name: 'Administrator', role: 'admin', assignedFeatures: [] },
  ...[1, 2, 3, 4, 5].map(
    (n): Account => ({
      username: `c${n}`,
      password: '123',
      name: `Client ${n}`,
      role: 'client',
      assignedFeatures: [],
    }),
  ),
];

const toUser = ({ password: _password, ...user }: Account): User => user;

export const CLIENTS: User[] = ACCOUNTS.filter((a) => a.role === 'client').map(toUser);

export function login(username: string, password: string): User | null {
  const account = ACCOUNTS.find((a) => a.username === username.trim() && a.password === password);
  return account ? toUser(account) : null;
}

// Per-tab mock session. sessionStorage is scoped to a single browser tab, so tabs
// stay independent. It only exists on web; elsewhere the session is in-memory only.
const SESSION_KEY = 'learning.mockSession';

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function saveSession(user: User): void {
  try {
    storage()?.setItem(SESSION_KEY, user.username);
  } catch {}
}

export function clearSession(): void {
  try {
    storage()?.removeItem(SESSION_KEY);
  } catch {}
}

export function loadSession(): User | null {
  try {
    const username = storage()?.getItem(SESSION_KEY);
    const account = ACCOUNTS.find((a) => a.username === username);
    return account ? toUser(account) : null;
  } catch {
    return null;
  }
}
