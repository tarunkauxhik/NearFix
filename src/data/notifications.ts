import type { ViewerState } from '@/lib/access';

export type NotifType =
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'provider_accepted'
  | 'provider_en_route'
  | 'review_request'
  | 'promo'
  | 'system';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string; // ISO
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
  meta?: {
    providerName?: string;
    service?: string;
    bookingId?: string;
    amount?: number;
  };
}

export type NotificationAudience =
  | 'visitor'
  | 'signed_in_unassigned'
  | 'customer'
  | 'provider'
  | 'admin';

export const visitorMarketingNotifications: Notification[] = [
  {
    id: 'V001',
    type: 'promo',
    title: 'Welcome to NearFix',
    body: 'Discover trusted electricians, plumbers, tutors, and more in your neighbourhood with transparent pricing and fast response times.',
    timestamp: '2026-04-06T09:45:00Z',
    read: false,
    actionLabel: 'Browse Services',
    actionHref: '/services',
  },
  {
    id: 'V002',
    type: 'system',
    title: 'NearFix launches daily discounts',
    body: 'Sign in to unlock first-booking offers, curated provider picks, and smoother booking with your saved details.',
    timestamp: '2026-04-06T08:30:00Z',
    read: false,
    actionLabel: 'Create Account',
    actionHref: '/auth/sign-up',
  },
  {
    id: 'V003',
    type: 'promo',
    title: 'Top-rated home services near you',
    body: 'Compare verified providers, check live availability, and book with confidence across popular service categories.',
    timestamp: '2026-04-05T18:00:00Z',
    read: true,
    actionLabel: 'Explore NearFix',
    actionHref: '/',
  },
];

export const signedInUnassignedNotifications: Notification[] = [
  {
    id: 'U001',
    type: 'system',
    title: 'Choose how you want to use NearFix',
    body: 'Pick customer or provider to unlock the right dashboard, shortcuts, and setup flow for your account.',
    timestamp: '2026-04-06T09:15:00Z',
    read: false,
    actionLabel: 'Complete setup',
    actionHref: '/onboarding',
  },
  {
    id: 'U002',
    type: 'promo',
    title: 'Explore NearFix before you choose',
    body: 'Browse services, compare providers, and decide whether you are booking help or offering it.',
    timestamp: '2026-04-05T12:00:00Z',
    read: true,
    actionLabel: 'Browse services',
    actionHref: '/services',
  },
];

export const customerNotifications: Notification[] = [
  {
    id: 'C001',
    type: 'booking_reminder',
    title: 'Upcoming home service tomorrow',
    body: 'Your electrician booking is scheduled for tomorrow at 10:30 AM. Review the provider profile before arrival.',
    timestamp: '2026-04-06T09:00:00Z',
    read: false,
    actionLabel: 'Open bookings',
    actionHref: '/dashboard/customer',
  },
  {
    id: 'C002',
    type: 'promo',
    title: 'Good day from NearFix',
    body: 'Explore today’s limited-time discounts on trusted neighbourhood services near you.',
    timestamp: '2026-04-05T11:30:00Z',
    read: true,
    actionLabel: 'View offers',
    actionHref: '/services',
  },
];

export const providerNotifications: Notification[] = [
  {
    id: 'P001',
    type: 'system',
    title: 'Complete your provider setup',
    body: 'Add your business details, service area, and pricing so NearFix can start reviewing your provider profile.',
    timestamp: '2026-04-06T08:45:00Z',
    read: false,
    actionLabel: 'Open provider setup',
    actionHref: '/provider/register',
  },
  {
    id: 'P002',
    type: 'system',
    title: 'Approval status updates appear here',
    body: 'Once your provider profile is under review, NearFix will keep you updated with approval notes and onboarding steps.',
    timestamp: '2026-04-05T15:00:00Z',
    read: true,
    actionLabel: 'View dashboard',
    actionHref: '/dashboard/provider',
  },
  {
    id: 'P003',
    type: 'promo',
    title: 'Tip: sharper profiles win more jobs',
    body: 'Providers with clear bios, service areas, and starting prices usually convert more first-time customers.',
    timestamp: '2026-04-05T10:15:00Z',
    read: true,
    actionLabel: 'Improve profile',
    actionHref: '/provider/register',
  },
];

export const adminNotifications: Notification[] = [
  {
    id: 'A001',
    type: 'system',
    title: 'Pending provider approvals need review',
    body: 'Check newly submitted provider applications and update statuses so onboarding does not stall.',
    timestamp: '2026-04-06T08:00:00Z',
    read: false,
    actionLabel: 'Review users',
    actionHref: '/admin/users',
  },
  {
    id: 'A002',
    type: 'system',
    title: 'Platform overview is ready',
    body: 'Open the admin home to review user counts, provider growth, and any current setup warnings.',
    timestamp: '2026-04-05T16:30:00Z',
    read: true,
    actionLabel: 'Open admin home',
    actionHref: '/admin',
  },
];

const notificationsByAudience: Record<NotificationAudience, Notification[]> = {
  visitor: visitorMarketingNotifications,
  signed_in_unassigned: signedInUnassignedNotifications,
  customer: customerNotifications,
  provider: providerNotifications,
  admin: adminNotifications,
};

export function getNotificationAudience(viewerState: ViewerState): NotificationAudience {
  switch (viewerState) {
    case 'visitor':
      return 'visitor';
    case 'signed_in_unassigned':
      return 'signed_in_unassigned';
    case 'customer':
      return 'customer';
    case 'provider':
    case 'provider_draft':
      return 'provider';
    case 'admin':
    default:
      return 'admin';
  }
}

export function getNotificationsForAudience(audience: NotificationAudience): Notification[] {
  return notificationsByAudience[audience].map((notification) => ({
    ...notification,
  }));
}
