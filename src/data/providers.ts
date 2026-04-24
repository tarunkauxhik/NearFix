import { providerCategoryLabels, type ProviderCategory } from '@/lib/access';
import { avatarUrl } from '@/lib/utils';

export interface Provider {
  id: string;
  name: string;
  service: string;
  category: ProviderCategory;
  rating: number;
  reviews: number;
  price: string;
  priceUnit: string;
  availability: 'now' | 'today' | 'tomorrow';
  availabilityLabel: string;
  photo: string;
  location: string;
  distance: string;
  verified: boolean;
  completedJobs: number;
  mapX: number; // % position on map placeholder
  mapY: number;
  pinColor: string;
}

const categoryMeta: Record<
  ProviderCategory,
  { service: string; price: number; priceUnit: string; pinColor: string }
> = {
  electrician: { service: providerCategoryLabels.electrician, price: 299, priceUnit: 'visit', pinColor: '#FF6B00' },
  plumber: { service: providerCategoryLabels.plumber, price: 349, priceUnit: 'visit', pinColor: '#3B82F6' },
  tutor: { service: providerCategoryLabels.tutor, price: 500, priceUnit: 'hr', pinColor: '#10B981' },
  beautician: { service: providerCategoryLabels.beautician, price: 799, priceUnit: 'session', pinColor: '#EC4899' },
  carpenter: { service: providerCategoryLabels.carpenter, price: 450, priceUnit: 'visit', pinColor: '#F59E0B' },
  'ac-repair': { service: providerCategoryLabels['ac-repair'], price: 599, priceUnit: 'visit', pinColor: '#8B5CF6' },
  'pest-control': { service: providerCategoryLabels['pest-control'], price: 699, priceUnit: 'visit', pinColor: '#EF4444' },
  cleaning: { service: providerCategoryLabels.cleaning, price: 399, priceUnit: 'visit', pinColor: '#06B6D4' },
};

function getAvailabilityLabel(availability: Provider['availability']): string {
  switch (availability) {
    case 'now':
      return 'Available Now';
    case 'today':
      return 'Today 2PM';
    case 'tomorrow':
      return 'Tomorrow 10AM';
    default:
      return 'Available Soon';
  }
}

function makeProvider({
  id,
  name,
  category,
  rating,
  reviews,
  availability,
  location,
  distance,
  completedJobs,
  mapX,
  mapY,
}: {
  id: string;
  name: string;
  category: ProviderCategory;
  rating: number;
  reviews: number;
  availability: Provider['availability'];
  location: string;
  distance: string;
  completedJobs: number;
  mapX: number;
  mapY: number;
}): Provider {
  const meta = categoryMeta[category];

  return {
    id,
    name,
    service: meta.service,
    category,
    rating,
    reviews,
    price: `₹${meta.price}`,
    priceUnit: meta.priceUnit,
    availability,
    availabilityLabel: getAvailabilityLabel(availability),
    photo: avatarUrl(name),
    location,
    distance,
    verified: true,
    completedJobs,
    mapX,
    mapY,
    pinColor: meta.pinColor,
  };
}

export const providers: Provider[] = [
  makeProvider({ id: 'rajesh-kumar', name: 'Rajesh Kumar', category: 'electrician', rating: 4.8, reviews: 124, availability: 'now', location: 'Koramangala, Bengaluru', distance: '1.2 km', completedJobs: 312, mapX: 35, mapY: 40 }),
  makeProvider({ id: 'harish-verma', name: 'Harish Verma', category: 'electrician', rating: 4.7, reviews: 91, availability: 'today', location: 'Indiranagar, Bengaluru', distance: '2.6 km', completedJobs: 221, mapX: 41, mapY: 28 }),
  makeProvider({ id: 'mohan-reddy', name: 'Mohan Reddy', category: 'electrician', rating: 4.6, reviews: 84, availability: 'tomorrow', location: 'Jayanagar, Bengaluru', distance: '3.1 km', completedJobs: 173, mapX: 31, mapY: 56 }),

  makeProvider({ id: 'suresh-patel', name: 'Suresh Patel', category: 'plumber', rating: 4.6, reviews: 89, availability: 'today', location: 'HSR Layout, Bengaluru', distance: '2.1 km', completedJobs: 198, mapX: 55, mapY: 30 }),
  makeProvider({ id: 'imran-shaikh', name: 'Imran Shaikh', category: 'plumber', rating: 4.7, reviews: 73, availability: 'now', location: 'Bellandur, Bengaluru', distance: '2.8 km', completedJobs: 164, mapX: 61, mapY: 44 }),
  makeProvider({ id: 'dev-malhotra', name: 'Dev Malhotra', category: 'plumber', rating: 4.5, reviews: 62, availability: 'tomorrow', location: 'BTM Layout, Bengaluru', distance: '3.7 km', completedJobs: 149, mapX: 52, mapY: 61 }),

  makeProvider({ id: 'priya-sharma', name: 'Priya Sharma', category: 'tutor', rating: 4.9, reviews: 67, availability: 'now', location: 'Indiranagar, Bengaluru', distance: '0.8 km', completedJobs: 145, mapX: 70, mapY: 55 }),
  makeProvider({ id: 'neha-joshi', name: 'Neha Joshi', category: 'tutor', rating: 4.8, reviews: 88, availability: 'today', location: 'Whitefield, Bengaluru', distance: '1.9 km', completedJobs: 202, mapX: 76, mapY: 48 }),
  makeProvider({ id: 'rahul-kulkarni', name: 'Rahul Kulkarni', category: 'tutor', rating: 4.7, reviews: 59, availability: 'tomorrow', location: 'Marathahalli, Bengaluru', distance: '2.5 km', completedJobs: 119, mapX: 67, mapY: 39 }),

  makeProvider({ id: 'meena-nair', name: 'Meena Nair', category: 'beautician', rating: 4.7, reviews: 156, availability: 'today', location: 'Jayanagar, Bengaluru', distance: '3.4 km', completedJobs: 421, mapX: 25, mapY: 65 }),
  makeProvider({ id: 'kavita-rao', name: 'Kavita Rao', category: 'beautician', rating: 4.8, reviews: 102, availability: 'now', location: 'Koramangala, Bengaluru', distance: '1.6 km', completedJobs: 266, mapX: 29, mapY: 52 }),
  makeProvider({ id: 'sana-khan', name: 'Sana Khan', category: 'beautician', rating: 4.6, reviews: 74, availability: 'tomorrow', location: 'HSR Layout, Bengaluru', distance: '2.9 km', completedJobs: 188, mapX: 22, mapY: 43 }),

  makeProvider({ id: 'vikram-singh', name: 'Vikram Singh', category: 'carpenter', rating: 4.5, reviews: 43, availability: 'now', location: 'BTM Layout, Bengaluru', distance: '1.9 km', completedJobs: 87, mapX: 48, mapY: 72 }),
  makeProvider({ id: 'faizan-ali', name: 'Faizan Ali', category: 'carpenter', rating: 4.7, reviews: 66, availability: 'today', location: 'Banashankari, Bengaluru', distance: '2.7 km', completedJobs: 152, mapX: 39, mapY: 78 }),
  makeProvider({ id: 'rakesh-yadav', name: 'Rakesh Yadav', category: 'carpenter', rating: 4.6, reviews: 58, availability: 'tomorrow', location: 'JP Nagar, Bengaluru', distance: '3.8 km', completedJobs: 134, mapX: 44, mapY: 67 }),

  makeProvider({ id: 'arun-mehta', name: 'Arun Mehta', category: 'ac-repair', rating: 4.8, reviews: 98, availability: 'tomorrow', location: 'Whitefield, Bengaluru', distance: '4.2 km', completedJobs: 234, mapX: 78, mapY: 38 }),
  makeProvider({ id: 'nitin-bose', name: 'Nitin Bose', category: 'ac-repair', rating: 4.7, reviews: 81, availability: 'today', location: 'Marathahalli, Bengaluru', distance: '3.3 km', completedJobs: 197, mapX: 72, mapY: 31 }),
  makeProvider({ id: 'salman-qureshi', name: 'Salman Qureshi', category: 'ac-repair', rating: 4.5, reviews: 69, availability: 'now', location: 'Electronic City, Bengaluru', distance: '5.1 km', completedJobs: 143, mapX: 82, mapY: 57 }),

  makeProvider({ id: 'deepak-jha', name: 'Deepak Jha', category: 'pest-control', rating: 4.6, reviews: 72, availability: 'today', location: 'Hebbal, Bengaluru', distance: '4.4 km', completedJobs: 176, mapX: 58, mapY: 18 }),
  makeProvider({ id: 'omkar-patil', name: 'Omkar Patil', category: 'pest-control', rating: 4.7, reviews: 64, availability: 'now', location: 'Rajajinagar, Bengaluru', distance: '3.6 km', completedJobs: 154, mapX: 46, mapY: 22 }),
  makeProvider({ id: 'farhan-sheikh', name: 'Farhan Sheikh', category: 'pest-control', rating: 4.5, reviews: 52, availability: 'tomorrow', location: 'Yelahanka, Bengaluru', distance: '6.2 km', completedJobs: 121, mapX: 64, mapY: 11 }),

  makeProvider({ id: 'pooja-das', name: 'Pooja Das', category: 'cleaning', rating: 4.8, reviews: 118, availability: 'now', location: 'Indiranagar, Bengaluru', distance: '1.4 km', completedJobs: 284, mapX: 18, mapY: 34 }),
  makeProvider({ id: 'lakshmi-menon', name: 'Lakshmi Menon', category: 'cleaning', rating: 4.7, reviews: 95, availability: 'today', location: 'Sarjapur Road, Bengaluru', distance: '2.7 km', completedJobs: 231, mapX: 26, mapY: 27 }),
  makeProvider({ id: 'aarti-gupta', name: 'Aarti Gupta', category: 'cleaning', rating: 4.6, reviews: 88, availability: 'tomorrow', location: 'Kadubeesanahalli, Bengaluru', distance: '3.2 km', completedJobs: 204, mapX: 14, mapY: 46 }),
];

const categoryCounts = providers.reduce<Record<ProviderCategory, number>>(
  (counts, provider) => {
    counts[provider.category] += 1;
    return counts;
  },
  {
    electrician: 0,
    plumber: 0,
    tutor: 0,
    beautician: 0,
    carpenter: 0,
    'ac-repair': 0,
    'pest-control': 0,
    cleaning: 0,
  }
);

export const categories = [
  { id: 'electrician', label: 'Electrician', icon: '⚡', count: categoryCounts.electrician, size: 'tall' },
  { id: 'plumber', label: 'Plumber', icon: '🔧', count: categoryCounts.plumber, size: 'normal' },
  { id: 'tutor', label: 'Home Tutor', icon: '📚', count: categoryCounts.tutor, size: 'normal' },
  { id: 'beautician', label: 'Beautician', icon: '💅', count: categoryCounts.beautician, size: 'wide' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚', count: categoryCounts.carpenter, size: 'normal' },
  { id: 'ac-repair', label: 'AC Repair', icon: '❄️', count: categoryCounts['ac-repair'], size: 'normal' },
  { id: 'pest-control', label: 'Pest Control', icon: '🐛', count: categoryCounts['pest-control'], size: 'normal' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹', count: categoryCounts.cleaning, size: 'tall' },
] as const;
