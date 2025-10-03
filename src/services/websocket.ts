import { io, Socket } from 'socket.io-client';

export type RoundUpdatePayload = {
  id: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  status: 'cooldown' | 'active' | 'finished';
  timestamp: string;
};

export type RoundFinishedPayload = {
  id: string;
  totalPoints: number;
  winner: { username: string; points: number } | null;
  timestamp: string;
};

export type UserTapPayload = {
  userId: string;
  myPoints: number;
  timestamp: string;
};

export type TapResultPayload = {
  success: boolean;
  myPoints?: number;
  error?: string;
  timestamp: string;
};

export type LeaderboardPayload = {
  id: string;
  status: 'cooldown' | 'active' | 'finished';
  totalPoints: number;
  leaderboard: Array<{
    place: number;
    userId: string;
    username: string;
    taps: number;
    points: number;
  }>;
};

export type WebSocketEvents = {
  round_update: (data: RoundUpdatePayload) => void;
  round_finished: (data: RoundFinishedPayload) => void;
  user_tap: (data: UserTapPayload) => void;
  tap_result: (data: TapResultPayload) => void;
  leaderboard: (data: LeaderboardPayload) => void;
};

type ClientToServerEvents = {
  join_round: (data: { roundId: string }) => void;
  leave_round: (data: { roundId: string }) => void;
  tap: (data: { roundId: string }) => void;
  leaderboard: (data: { roundId: string }) => void;
};

class WebSocketService {
  private socket: Socket<WebSocketEvents, ClientToServerEvents> | null = null;
  private token: string | null = null;

  connect(token?: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.token = token ?? null;

    this.socket = io({
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRound(roundId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_round', { roundId });
    }
  }

  leaveRound(roundId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_round', { roundId });
    }
  }

  tap(roundId: string) {
    if (this.socket?.connected) {
      this.socket.emit('tap', { roundId });
    }
  }

  getLeaderboard(roundId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaderboard', { roundId });
    }
  }

  onRoundUpdate(callback: (data: RoundUpdatePayload) => void) {
    if (this.socket) {
      this.socket.on('round_update', callback);
    }
  }
  offRoundUpdate(callback?: (data: RoundUpdatePayload) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('round_update', callback);
    else this.socket.off('round_update');
  }

  onRoundFinished(callback: (data: RoundFinishedPayload) => void) {
    if (this.socket) this.socket.on('round_finished', callback);
  }
  offRoundFinished(callback?: (data: RoundFinishedPayload) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('round_finished', callback);
    else this.socket.off('round_finished');
  }

  onUserTap(callback: (data: UserTapPayload) => void) {
    if (this.socket) this.socket.on('user_tap', callback);
  }
  offUserTap(callback?: (data: UserTapPayload) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('user_tap', callback);
    else this.socket.off('user_tap');
  }

  onTapResult(callback: (data: TapResultPayload) => void) {
    if (this.socket) this.socket.on('tap_result', callback);
  }
  offTapResult(callback?: (data: TapResultPayload) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('tap_result', callback);
    else this.socket.off('tap_result');
  }

  onLeaderboard(callback: (data: LeaderboardPayload) => void) {
    if (this.socket) this.socket.on('leaderboard', callback);
  }
  offLeaderboard(callback?: (data: LeaderboardPayload) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('leaderboard', callback);
    else this.socket.off('leaderboard');
  }

  on(event: string, callback: (data: unknown) => void) {
    if (this.socket) this.socket.on(event as never, callback);
  }

  off(event: string, callback?: (data: unknown) => void) {
    if (!this.socket) return;
    if (callback) this.socket.off(event as never, callback);
    else this.socket.off(event as never);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  onConnect(callback: () => void) {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  offConnect(callback?: () => void) {
    if (!this.socket) return;
    if (callback) this.socket.off('connect', callback);
    else this.socket.off('connect');
  }
}

export const gooseWebSocketService = new WebSocketService();
