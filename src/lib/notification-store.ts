import { useSyncExternalStore } from 'react';

import {
  getNotificationAudience,
  getNotificationsForAudience,
  type Notification,
  type NotificationAudience,
} from '@/data/notifications';
import type { ViewerState } from '@/lib/access';

type NotificationState = Record<NotificationAudience, Notification[]>;
type Listener = () => void;

const STORAGE_KEY = 'nearfix.notifications.v1';
const listeners = new Set<Listener>();

let didHydrate = false;

function createInitialState(): NotificationState {
  return {
    visitor: getNotificationsForAudience('visitor'),
    signed_in_unassigned: getNotificationsForAudience('signed_in_unassigned'),
    customer: getNotificationsForAudience('customer'),
    provider: getNotificationsForAudience('provider'),
    admin: getNotificationsForAudience('admin'),
  };
}

let state: NotificationState = createInitialState();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function hydrateState() {
  if (didHydrate || typeof window === 'undefined') {
    return;
  }

  didHydrate = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Partial<NotificationState>;
    const baseState = createInitialState();
    state = {
      visitor: Array.isArray(parsed.visitor) ? parsed.visitor : baseState.visitor,
      signed_in_unassigned: Array.isArray(parsed.signed_in_unassigned)
        ? parsed.signed_in_unassigned
        : baseState.signed_in_unassigned,
      customer: Array.isArray(parsed.customer) ? parsed.customer : baseState.customer,
      provider: Array.isArray(parsed.provider) ? parsed.provider : baseState.provider,
      admin: Array.isArray(parsed.admin) ? parsed.admin : baseState.admin,
    };
  } catch {
    state = createInitialState();
  }
}

function persistState() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateAudience(
  audience: NotificationAudience,
  updater: (notifications: Notification[]) => Notification[]
) {
  hydrateState();
  state = {
    ...state,
    [audience]: updater(state[audience]),
  };
  persistState();
  emitChange();
}

function getSnapshot(audience: NotificationAudience): Notification[] {
  hydrateState();
  return state[audience];
}

export function useNotifications(viewerState: ViewerState) {
  const audience = getNotificationAudience(viewerState);
  const notifications = useSyncExternalStore(
    subscribe,
    () => getSnapshot(audience),
    () => getNotificationsForAudience(audience)
  );

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    markRead(id: string) {
      updateAudience(audience, (current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    },
    markAllRead() {
      updateAudience(audience, (current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
    },
    deleteNotification(id: string) {
      updateAudience(audience, (current) =>
        current.filter((notification) => notification.id !== id)
      );
    },
    clearNotifications(ids?: string[]) {
      updateAudience(audience, (current) => {
        if (!ids || ids.length === 0) {
          return [];
        }

        const idSet = new Set(ids);
        return current.filter((notification) => !idSet.has(notification.id));
      });
    },
    resetNotifications() {
      updateAudience(audience, () => getNotificationsForAudience(audience));
    },
  };
}
