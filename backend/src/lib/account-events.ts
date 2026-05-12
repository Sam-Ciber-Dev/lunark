/**
 * In-process pub/sub for per-user account events.
 *
 * Used by the SSE endpoint at GET /auth/account-events to deliver
 * sub-second logout signals when an admin bans / deletes / unbans /
 * renames an account. Mirrors what EyeWeb gets for free via Supabase
 * Realtime, but without any external dependency.
 *
 * Limitation: this is single-process. If Lunark ever scales beyond one
 * Fly machine, swap the Map for Redis pub/sub (the public API of this
 * module stays identical).
 */

export type AccountEvent =
  | { type: "banned"; reason?: string }
  | { type: "unbanned" }
  | { type: "deleted" }
  | { type: "renamed"; newName: string };

export type DeviceEvent =
  | { type: "blocked"; reason?: string }
  | { type: "unblocked" };

type Listener = (ev: AccountEvent) => void;
type DeviceListener = (ev: DeviceEvent) => void;

const listeners = new Map<string, Set<Listener>>();
const deviceListeners = new Map<string, Set<DeviceListener>>();

export function subscribeAccountEvents(userId: string, fn: Listener): () => void {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(fn);
  return () => {
    const s = listeners.get(userId);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) listeners.delete(userId);
  };
}

export function broadcastAccountEvent(userId: string, ev: AccountEvent) {
  const set = listeners.get(userId);
  if (!set) return;
  for (const fn of set) {
    try { fn(ev); } catch { /* never let one listener break the broadcast */ }
  }
}

export function listenerCount(userId: string): number {
  return listeners.get(userId)?.size ?? 0;
}

// ─── Device-keyed channel (fingerprint hash) ───
// Used to push instant /blocked navigation when an admin or the auto-block
// heuristic blocks a fingerprint. The client opens this stream anonymously
// using its own fingerprint — there is no auth because anyone can know
// their own fingerprint, and the only signal we ever emit is "blocked" /
// "unblocked" which is exactly what the client already finds out on the
// next request anyway.

export function subscribeDeviceEvents(fp: string, fn: DeviceListener): () => void {
  let set = deviceListeners.get(fp);
  if (!set) {
    set = new Set();
    deviceListeners.set(fp, set);
  }
  set.add(fn);
  return () => {
    const s = deviceListeners.get(fp);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) deviceListeners.delete(fp);
  };
}

export function broadcastDeviceEvent(fp: string, ev: DeviceEvent) {
  if (!fp) return;
  const set = deviceListeners.get(fp);
  if (!set) return;
  for (const fn of set) {
    try { fn(ev); } catch { /* never let one listener break the broadcast */ }
  }
}
