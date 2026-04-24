import type { Provider } from '@/data/providers';
import { providers } from '@/data/providers';
import { avatarUrl } from '@/lib/utils';

/**
 * Build a placeholder portfolio / before-after image URL for a given caption.
 * Uses placehold.co (no signup, no API key) so the UI always renders.
 */
function placeholderImage(caption: string, color = '1a1a1a'): string {
  const text = encodeURIComponent(caption);
  return `https://placehold.co/600x400/${color}/FF6B00?text=${text}`;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  service: string;
  helpful: number;
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  popular?: boolean;
}

export interface ProviderDetail {
  id: string;
  name: string;
  service: string;
  tagline: string;
  photo: string;
  coverPhoto?: string;
  rating: number;
  reviews: number;
  completedJobs: number;
  responseTime: string;
  memberSince: string;
  location: string;
  serviceRadius: string;
  languages: string[];
  verified: boolean;
  backgroundCheck: boolean;
  about: string;
  services: ServiceOffering[];
  portfolio: { slot: string; caption: string }[];
  beforeAfter: { before: string; after: string; caption: string }[];
  reviews_list: Review[];
  badges: string[];
  availability: Record<string, string[]>; // date string → available time slots
}

// Generate next 7 days of availability
function generateAvailability(): Record<string, string[]> {
  const slots: Record<string, string[]> = {};
  const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = d.toISOString().split('T')[0];
    // Randomly remove some slots to simulate bookings
    const available = allSlots.filter((_, idx) => {
      if (i === 0) return idx > 2; // today: fewer slots
      return idx % 3 !== 1; // other days: some gaps
    });
    slots[key] = available;
  }
  return slots;
}

export const providerDetails: Record<string, ProviderDetail> = {
  'rajesh-kumar': {
    id: 'rajesh-kumar',
    name: 'Rajesh Kumar',
    service: 'Electrician',
    tagline: 'Licensed electrician with 8+ years in residential & commercial wiring',
    photo: avatarUrl('Rajesh Kumar'),
    rating: 4.8,
    reviews: 124,
    completedJobs: 312,
    responseTime: '< 15 min',
    memberSince: 'Jan 2022',
    location: 'Koramangala, Bengaluru',
    serviceRadius: '5 km',
    languages: ['Kannada', 'Hindi', 'English'],
    verified: true,
    backgroundCheck: true,
    about:
      'I am a licensed electrician with over 8 years of experience in residential and commercial electrical work. I specialise in wiring, panel upgrades, fan and fixture installation, and fault diagnosis. I carry all tools and materials needed for most jobs — no extra charges for standard parts.',
    services: [
      { id: 's1', name: 'Basic Electrical Repair', description: 'Switches, sockets, MCB faults, minor wiring issues', price: '₹299', duration: '1–2 hrs', popular: false },
      { id: 's2', name: 'Fan / Light Installation', description: 'Ceiling fan, exhaust fan, LED fixture installation', price: '₹399', duration: '1 hr', popular: true },
      { id: 's3', name: 'Full Home Wiring', description: 'New wiring for 1/2/3 BHK apartments', price: '₹4,999', duration: '1–2 days', popular: false },
      { id: 's4', name: 'Panel / MCB Upgrade', description: 'Distribution board replacement and MCB upgrade', price: '₹1,499', duration: '3–4 hrs', popular: false },
      { id: 's5', name: 'AC Point Installation', description: 'Dedicated 16A point for air conditioner', price: '₹599', duration: '1–2 hrs', popular: true },
    ],
    portfolio: [
      { slot: placeholderImage('Ceiling fan installation'), caption: 'Ceiling fan installation' },
      { slot: placeholderImage('Socket installation'), caption: 'Socket installation' },
      { slot: placeholderImage('Panel repair'), caption: 'Panel repair job' },
      { slot: placeholderImage('Wiring upgrade'), caption: 'Wiring upgrade' },
    ],
    beforeAfter: [
      {
        before: placeholderImage('Before — old panel', '2a2a2a'),
        after: placeholderImage('After — new panel'),
        caption: 'Electrical panel upgrade — old vs new',
      },
    ],
    reviews_list: [
      { id: 'r1', author: 'Ananya Krishnan', avatar: 'AK', rating: 5, date: '2 days ago', text: 'Rajesh was punctual, professional, and fixed our MCB issue in under an hour. Highly recommend!', service: 'Basic Electrical Repair', helpful: 12 },
      { id: 'r2', author: 'Siddharth Rao', avatar: 'SR', rating: 5, date: '1 week ago', text: 'Installed 3 ceiling fans and 2 light fixtures. Clean work, no mess left behind. Will book again.', service: 'Fan / Light Installation', helpful: 8 },
      { id: 'r3', author: 'Deepa Menon', avatar: 'DM', rating: 4, date: '2 weeks ago', text: 'Good work overall. Took slightly longer than estimated but the quality was excellent.', service: 'AC Point Installation', helpful: 5 },
      { id: 'r4', author: 'Karthik Nair', avatar: 'KN', rating: 5, date: '3 weeks ago', text: 'Very knowledgeable. Diagnosed a tricky fault that two other electricians had missed. Saved us a lot of money.', service: 'Basic Electrical Repair', helpful: 19 },
      { id: 'r5', author: 'Preethi Sharma', avatar: 'PS', rating: 5, date: '1 month ago', text: 'Completed full home wiring for our new 2BHK. Excellent quality, transparent pricing, no hidden charges.', service: 'Full Home Wiring', helpful: 23 },
    ],
    badges: ['Top Rated', 'Background Verified', 'Quick Responder', '300+ Jobs'],
    availability: generateAvailability(),
  },
  'suresh-patel': {
    id: 'suresh-patel',
    name: 'Suresh Patel',
    service: 'Plumber',
    tagline: 'Expert plumber for leaks, pipe fitting, bathroom renovation & more',
    photo: avatarUrl('Suresh Patel'),
    rating: 4.6,
    reviews: 89,
    completedJobs: 198,
    responseTime: '< 30 min',
    memberSince: 'Mar 2022',
    location: 'HSR Layout, Bengaluru',
    serviceRadius: '6 km',
    languages: ['Gujarati', 'Hindi', 'Kannada'],
    verified: true,
    backgroundCheck: true,
    about: 'Professional plumber with 6 years of experience. Specialise in leak detection, pipe fitting, bathroom fittings, and water heater installation.',
    services: [
      { id: 's1', name: 'Leak Repair', description: 'Pipe leaks, tap leaks, joint sealing', price: '₹349', duration: '1–2 hrs', popular: true },
      { id: 's2', name: 'Tap / Faucet Replacement', description: 'Kitchen and bathroom tap replacement', price: '₹299', duration: '30–60 min', popular: false },
      { id: 's3', name: 'Water Heater Installation', description: 'Geyser installation and plumbing connection', price: '₹799', duration: '2–3 hrs', popular: true },
      { id: 's4', name: 'Bathroom Renovation Plumbing', description: 'Full plumbing for bathroom remodel', price: '₹3,999', duration: '1–2 days', popular: false },
    ],
    portfolio: [
      { slot: placeholderImage('Bathroom fitting'), caption: 'Bathroom fitting' },
    ],
    beforeAfter: [],
    reviews_list: [
      { id: 'r1', author: 'Meera Iyer', avatar: 'MI', rating: 5, date: '3 days ago', text: 'Fixed a major leak under the kitchen sink quickly. Very professional.', service: 'Leak Repair', helpful: 7 },
      { id: 'r2', author: 'Rahul Verma', avatar: 'RV', rating: 4, date: '2 weeks ago', text: 'Good work on geyser installation. Slightly delayed but quality was fine.', service: 'Water Heater Installation', helpful: 4 },
    ],
    badges: ['Verified', 'Background Check', '190+ Jobs'],
    availability: generateAvailability(),
  },
};

function buildGenericProviderDetail(provider: Provider): ProviderDetail {
  const basePrice = provider.price;
  const categoryLabel = provider.service;

  return {
    id: provider.id,
    name: provider.name,
    service: provider.service,
    tagline: `Trusted ${categoryLabel.toLowerCase()} for residential service visits in ${provider.location.split(',')[0]}`,
    photo: provider.photo || avatarUrl(provider.name),
    rating: provider.rating,
    reviews: provider.reviews,
    completedJobs: provider.completedJobs,
    responseTime: provider.availability === 'now' ? '< 15 min' : provider.availability === 'today' ? '< 45 min' : '< 2 hrs',
    memberSince: '2024',
    location: provider.location,
    serviceRadius: '6 km',
    languages: ['English', 'Hindi'],
    verified: provider.verified,
    backgroundCheck: true,
    about: `${provider.name} is a verified NearFix ${categoryLabel.toLowerCase()} serving ${provider.location}. This demo profile is generated from the shared provider dataset so every development provider has a working detail page and booking flow.`,
    services: [
      {
        id: 's1',
        name: `${categoryLabel} Visit`,
        description: `General ${categoryLabel.toLowerCase()} visit and inspection`,
        price: basePrice,
        duration: '1 hr',
        popular: true,
      },
      {
        id: 's2',
        name: `${categoryLabel} Repair`,
        description: `Common repair and troubleshooting work`,
        price: basePrice,
        duration: '1–2 hrs',
      },
      {
        id: 's3',
        name: `${categoryLabel} Premium Service`,
        description: `Extended support for larger or more detailed jobs`,
        price: basePrice,
        duration: '2–3 hrs',
      },
    ],
    portfolio: [
      { slot: placeholderImage(`${provider.name} portfolio 1`), caption: `${categoryLabel} project 1` },
      { slot: placeholderImage(`${provider.name} portfolio 2`), caption: `${categoryLabel} project 2` },
      { slot: placeholderImage(`${provider.name} toolkit`), caption: `${categoryLabel} tools and setup` },
    ],
    beforeAfter: [
      {
        before: placeholderImage(`${provider.name} before`, '2a2a2a'),
        after: placeholderImage(`${provider.name} after`),
        caption: `${categoryLabel} before and after result`,
      },
    ],
    reviews_list: [
      {
        id: `${provider.id}-r1`,
        author: 'Demo Customer',
        avatar: 'DC',
        rating: Math.round(provider.rating),
        date: '1 week ago',
        text: `${provider.name} was professional, punctual, and easy to work with. Great experience overall.`,
        service: `${categoryLabel} Visit`,
        helpful: 8,
      },
      {
        id: `${provider.id}-r2`,
        author: 'Test User',
        avatar: 'TU',
        rating: Math.max(4, Math.round(provider.rating)),
        date: '2 weeks ago',
        text: `Smooth service from start to finish. I would happily book ${provider.name} again.`,
        service: `${categoryLabel} Repair`,
        helpful: 4,
      },
    ],
    badges: [
      provider.verified ? 'Verified' : 'Profile Live',
      `${provider.completedJobs}+ Jobs`,
      `${provider.rating.toFixed(1)} Rating`,
    ],
    availability: generateAvailability(),
  };
}

// Fallback for providers without handcrafted detailed data
export function getProviderDetail(id: string): ProviderDetail | null {
  if (providerDetails[id]) {
    return providerDetails[id];
  }

  const provider = providers.find((item) => item.id === id);
  return provider ? buildGenericProviderDetail(provider) : null;
}
