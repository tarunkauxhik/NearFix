// ─── Types ───────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined';

export interface JobRequest {
  id: string;
  residentName: string;
  residentAvatar: string;
  service: string;
  date: string;       // ISO
  time: string;
  address: string;
  distance: string;
  total: number;
  status: JobStatus;
  note?: string;
  createdAt: string;  // ISO
}

export interface EarningEntry {
  date: string;       // ISO
  amount: number;
  jobId: string;
  service: string;
  residentName: string;
}

export interface ScheduleSlot {
  date: string;       // ISO
  time: string;
  available: boolean;
  jobId?: string;
  residentName?: string;
  service?: string;
}

export interface ProviderReview {
  id: string;
  residentName: string;
  residentAvatar: string;
  rating: number;
  date: string;
  text: string;
  service: string;
  reply?: string;
}

// ─── Mock Job Requests ────────────────────────────────────────────────────────

export const mockJobRequests: JobRequest[] = [
  {
    id: 'JR001',
    residentName: 'Arjun Sharma',
    residentAvatar: '',
    service: 'Wiring Fault Diagnosis',
    date: '2026-04-07',
    time: '10:00 AM',
    address: 'Flat 4B, Prestige Towers, Koramangala',
    distance: '1.2 km',
    total: 628,
    status: 'pending',
    note: 'Lights flickering in bedroom and hall. Please bring necessary tools.',
    createdAt: '2026-04-06T08:30:00Z',
  },
  {
    id: 'JR002',
    residentName: 'Kavya Reddy',
    residentAvatar: '',
    service: 'Fan Installation',
    date: '2026-04-07',
    time: '2:00 PM',
    address: '12, MG Road Apartments, Indiranagar',
    distance: '2.4 km',
    total: 449,
    status: 'pending',
    note: 'New ceiling fan, box is ready.',
    createdAt: '2026-04-06T09:15:00Z',
  },
  {
    id: 'JR003',
    residentName: 'Rohan Mehta',
    residentAvatar: '',
    service: 'Electrical Inspection',
    date: '2026-04-08',
    time: '11:00 AM',
    address: 'Villa 7, Whitefield Gardens',
    distance: '4.1 km',
    total: 799,
    status: 'accepted',
    createdAt: '2026-04-05T14:00:00Z',
  },
  {
    id: 'JR004',
    residentName: 'Sneha Iyer',
    residentAvatar: '',
    service: 'MCB Replacement',
    date: '2026-04-09',
    time: '9:00 AM',
    address: 'Block C, Sobha Dream Acres, Panathur',
    distance: '5.8 km',
    total: 349,
    status: 'accepted',
    createdAt: '2026-04-05T11:30:00Z',
  },
  {
    id: 'JR005',
    residentName: 'Pradeep Nair',
    residentAvatar: '',
    service: 'Wiring Fault Diagnosis',
    date: '2026-04-03',
    time: '3:00 PM',
    address: 'HSR Layout, Sector 2',
    distance: '3.0 km',
    total: 628,
    status: 'completed',
    createdAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'JR006',
    residentName: 'Anita Desai',
    residentAvatar: '',
    service: 'Fan Installation',
    date: '2026-04-01',
    time: '10:00 AM',
    address: 'Jayanagar 4th Block',
    distance: '2.9 km',
    total: 449,
    status: 'completed',
    createdAt: '2026-03-31T09:00:00Z',
  },
  {
    id: 'JR007',
    residentName: 'Vikash Gupta',
    residentAvatar: '',
    service: 'Electrical Inspection',
    date: '2026-03-28',
    time: '11:00 AM',
    address: 'Marathahalli Bridge Road',
    distance: '6.2 km',
    total: 799,
    status: 'declined',
    createdAt: '2026-03-27T08:00:00Z',
  },
];

// ─── Mock Earnings ────────────────────────────────────────────────────────────

export const mockEarnings: EarningEntry[] = [
  { date: '2026-04-03', amount: 628, jobId: 'JR005', service: 'Wiring Fault Diagnosis', residentName: 'Pradeep Nair' },
  { date: '2026-04-01', amount: 449, jobId: 'JR006', service: 'Fan Installation', residentName: 'Anita Desai' },
  { date: '2026-03-28', amount: 799, jobId: 'JR007', service: 'Electrical Inspection', residentName: 'Vikash Gupta' },
  { date: '2026-03-25', amount: 628, jobId: 'JR008', service: 'Wiring Fault Diagnosis', residentName: 'Meera Pillai' },
  { date: '2026-03-22', amount: 349, jobId: 'JR009', service: 'MCB Replacement', residentName: 'Suresh Babu' },
  { date: '2026-03-20', amount: 449, jobId: 'JR010', service: 'Fan Installation', residentName: 'Deepa Krishnan' },
  { date: '2026-03-18', amount: 799, jobId: 'JR011', service: 'Electrical Inspection', residentName: 'Rahul Joshi' },
  { date: '2026-03-15', amount: 628, jobId: 'JR012', service: 'Wiring Fault Diagnosis', residentName: 'Pooja Shetty' },
  { date: '2026-03-12', amount: 449, jobId: 'JR013', service: 'Fan Installation', residentName: 'Kiran Rao' },
  { date: '2026-03-10', amount: 349, jobId: 'JR014', service: 'MCB Replacement', residentName: 'Anil Kumar' },
  { date: '2026-03-08', amount: 799, jobId: 'JR015', service: 'Electrical Inspection', residentName: 'Sunita Verma' },
  { date: '2026-03-05', amount: 628, jobId: 'JR016', service: 'Wiring Fault Diagnosis', residentName: 'Ravi Shankar' },
];

// ─── Weekly earnings for chart (last 7 days) ─────────────────────────────────

export const weeklyChartData = [
  { day: 'Mon', amount: 628 },
  { day: 'Tue', amount: 0 },
  { day: 'Wed', amount: 449 + 349 },
  { day: 'Thu', amount: 799 },
  { day: 'Fri', amount: 628 },
  { day: 'Sat', amount: 449 },
  { day: 'Sun', amount: 0 },
];

export const monthlyChartData = [
  { label: 'Week 1', amount: 2254 },
  { label: 'Week 2', amount: 3124 },
  { label: 'Week 3', amount: 1876 },
  { label: 'Week 4', amount: 2877 },
];

// ─── Mock Schedule ────────────────────────────────────────────────────────────

function buildSchedule(): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  const today = new Date('2026-04-06');

  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    times.forEach((time, i) => {
      const booked = (d === 0 && (i === 1 || i === 4)) || (d === 1 && (i === 0 || i === 2)) || (d === 2 && i === 3);
      slots.push({
        date: dateStr,
        time,
        available: !booked,
        ...(booked && {
          jobId: `JR00${d * 2 + i}`,
          residentName: ['Arjun Sharma', 'Kavya Reddy', 'Rohan Mehta', 'Sneha Iyer'][d % 4],
          service: ['Wiring Fault Diagnosis', 'Fan Installation', 'Electrical Inspection', 'MCB Replacement'][i % 4],
        }),
      });
    });
  }
  return slots;
}

export const mockSchedule = buildSchedule();

// ─── Mock Reviews ─────────────────────────────────────────────────────────────

export const mockProviderReviews: ProviderReview[] = [
  {
    id: 'R1',
    residentName: 'Pradeep Nair',
    residentAvatar: '',
    rating: 5,
    date: '2026-04-03',
    text: 'Rajesh was incredibly professional. Diagnosed the fault within minutes and fixed it cleanly. Will definitely book again!',
    service: 'Wiring Fault Diagnosis',
    reply: 'Thank you Pradeep! Happy to help anytime.',
  },
  {
    id: 'R2',
    residentName: 'Anita Desai',
    residentAvatar: '',
    rating: 5,
    date: '2026-04-01',
    text: 'Very neat work. Installed the fan perfectly and cleaned up after. Highly recommended.',
    service: 'Fan Installation',
  },
  {
    id: 'R3',
    residentName: 'Vikash Gupta',
    residentAvatar: '',
    rating: 4,
    date: '2026-03-28',
    text: 'Good work overall. Arrived on time and completed the inspection thoroughly. Minor delay in starting.',
    service: 'Electrical Inspection',
  },
  {
    id: 'R4',
    residentName: 'Meera Pillai',
    residentAvatar: '',
    rating: 5,
    date: '2026-03-25',
    text: 'Excellent service! Fixed a complex wiring issue that two other electricians couldn\'t solve.',
    service: 'Wiring Fault Diagnosis',
  },
  {
    id: 'R5',
    residentName: 'Suresh Babu',
    residentAvatar: '',
    rating: 4,
    date: '2026-03-22',
    text: 'Quick and efficient. Replaced the MCB in under 30 minutes. Fair pricing.',
    service: 'MCB Replacement',
  },
];
