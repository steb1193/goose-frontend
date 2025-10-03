export type User = { id: string; username: string; role: 'admin' | 'survivor' | 'nikita' };
export type GameConfig = {
  cooldownDuration: number;
  roundDuration: number;
};
export type RoundListItem = {
  id: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  status: 'cooldown' | 'active' | 'finished';
};

export type PaginationInfo = {
  hasMore: boolean;
};

export type RoundsResponse = {
  data: RoundListItem[];
  hasMore: boolean;
  config: GameConfig;
};
export type RoundInfo = {
  id: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  status: 'cooldown' | 'active' | 'finished';
  myPoints: number;
  winner: null | { username: string; points: number };
  config: GameConfig;
};

const API_BASE: string = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
    }
    throw new Error(text || res.statusText);
  }
  const json = await res.json();
  return json as T;
}

async function requestOptional<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    let text = '';
    try {
      text = await res.text();
    } catch {
    }
    throw new Error(text || res.statusText);
  }
  const json = await res.json();
  return json as T;
}

export const api = {
  login: async (username: string, password: string): Promise<User> => {
    const response: { user: User } = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.user;
  },
  me: async (): Promise<User | null> => {
    const result = await requestOptional<{ data: User }>('/auth/me');
    return result?.data || null;
  },
  logout: (): Promise<{ ok: true }> => request('/auth/logout', { method: 'POST' }),

  listRounds: async (after?: string, limit: number = 20): Promise<RoundsResponse> => {
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    params.append('limit', limit.toString());

    const result = await requestOptional<RoundsResponse>(`/rounds?${params.toString()}`);
    return (
      result || {
        data: [],
        hasMore: false,
        config: { cooldownDuration: 30, roundDuration: 60 },
      }
    );
  },
  createRound: (): Promise<{
    data: { id: string; startAt: string; endAt: string };
    config: GameConfig;
  }> => request('/rounds', { method: 'POST' }),
  getRound: (id: string): Promise<RoundInfo> => request(`/rounds/${id}`),
};
