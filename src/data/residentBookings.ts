import { avatarUrl } from '@/lib/utils';

export type BookingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface ResidentBooking {
  id: string;
  providerId: string;
  providerName: string;
  providerPhoto: string;
  service: string;
  category: string;
  date: string; // ISO date string
  time: string;
  address: string;
  status: BookingStatus;
  total: number;
  rating?: number;
  review?: string;
  canRebook: boolean;
}

export const mockBookings: ResidentBooking[] = [
  {
    id: 'BK1712345001',
    providerId: 'rajesh-kumar',
    providerName: 'Rajesh Kumar',
    providerPhoto: avatarUrl('Rajesh Kumar'),
    service: 'Electrical Inspection',
    category: 'Electrician',
    date: '2026-04-10',
    time: '10:00 AM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'upcoming',
    total: 628,
    canRebook: false,
  },
  {
    id: 'BK1712345002',
    providerId: 'suresh-patel',
    providerName: 'Suresh Patel',
    providerPhoto: avatarUrl('Suresh Patel'),
    service: 'Pipe Leak Repair',
    category: 'Plumber',
    date: '2026-04-08',
    time: '2:00 PM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'upcoming',
    total: 778,
    canRebook: false,
  },
  {
    id: 'BK1712345003',
    providerId: 'meena-nair',
    providerName: 'Meena Nair',
    providerPhoto: avatarUrl('Meena Nair'),
    service: 'Bridal Makeup',
    category: 'Beautician',
    date: '2026-03-28',
    time: '9:00 AM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'completed',
    total: 1828,
    rating: 5,
    review: 'Absolutely stunning work! Meena is incredibly talented.',
    canRebook: true,
  },
  {
    id: 'BK1712345004',
    providerId: 'arun-mehta',
    providerName: 'Arun Mehta',
    providerPhoto: avatarUrl('Arun Mehta'),
    service: 'AC Gas Refill',
    category: 'AC Repair',
    date: '2026-03-15',
    time: '11:00 AM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'completed',
    total: 1028,
    rating: 4,
    canRebook: true,
  },
  {
    id: 'BK1712345005',
    providerId: 'vikram-singh',
    providerName: 'Vikram Singh',
    providerPhoto: avatarUrl('Vikram Singh'),
    service: 'Furniture Assembly',
    category: 'Carpenter',
    date: '2026-02-20',
    time: '3:00 PM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'completed',
    total: 879,
    rating: 5,
    review: 'Very professional and quick. Highly recommend!',
    canRebook: true,
  },
  {
    id: 'BK1712345006',
    providerId: 'priya-sharma',
    providerName: 'Priya Sharma',
    providerPhoto: avatarUrl('Priya Sharma'),
    service: 'Math Tutoring (2 hrs)',
    category: 'Home Tutor',
    date: '2026-02-05',
    time: '5:00 PM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    status: 'cancelled',
    total: 1029,
    canRebook: true,
  },
];

export const savedProviderIds = ['rajesh-kumar', 'meena-nair', 'priya-sharma', 'arun-mehta'];
