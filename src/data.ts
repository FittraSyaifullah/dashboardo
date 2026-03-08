export interface HouseholdMember {
  name: string;
  relationship: 'Immediate Family' | 'Parent/In-law';
}

export interface Donator {
  id: string;
  name: string;
  tier: 'Individual' | 'Household';
  discount: boolean;
  monthlyAmount: number;
  status: 'Active' | 'Inactive';
  bounces: 0 | 1 | 2;
  history: PaymentRecord[];
  householdMembers?: HouseholdMember[];
}

export interface IncomingDonator {
  id: string;
  name: string;
  tier: 'Individual' | 'Household';
  discount: boolean;
  submittedDate: string;
  status: 'Pending Giro' | 'Pending e-Giro';
  householdMembers?: HouseholdMember[];
}

export interface PaymentRecord {
  date: string;
  amount: number;
  status: 'Paid' | 'Bounced' | 'No Record';
}

export const MOCK_CURRENT_DONATORS: Donator[] = [
  {
    id: '1',
    name: 'Ahmad bin Sulaiman',
    tier: 'Individual',
    discount: false,
    monthlyAmount: 50,
    status: 'Active',
    bounces: 0,
    history: [
      { date: 'Mar 2025', amount: 50, status: 'Paid' },
      { date: 'Feb 2025', amount: 50, status: 'Paid' },
      { date: 'Jan 2025', amount: 50, status: 'Paid' },
      { date: 'Dec 2024', amount: 50, status: 'Paid' },
    ]
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    tier: 'Household',
    discount: true,
    monthlyAmount: 80, // discounted from maybe 160?
    status: 'Active',
    bounces: 1,
    history: [
      { date: 'Mar 2025', amount: 80, status: 'Bounced' },
      { date: 'Feb 2025', amount: 80, status: 'Paid' },
      { date: 'Jan 2025', amount: 80, status: 'Paid' },
    ],
    householdMembers: [
      { name: 'Datuk K', relationship: 'Immediate Family' },
      { name: 'Aafiyah Khalid', relationship: 'Immediate Family' },
      { name: 'Afwa Khalid', relationship: 'Immediate Family' },
      { name: 'Tarudin Ismail', relationship: 'Parent/In-law' }
    ]
  },
  {
    id: '3',
    name: 'Farid Kamil',
    tier: 'Individual',
    discount: false,
    monthlyAmount: 30,
    status: 'Active',
    bounces: 2,
    history: [
      { date: 'Mar 2025', amount: 30, status: 'Bounced' },
      { date: 'Feb 2025', amount: 30, status: 'Bounced' },
      { date: 'Jan 2025', amount: 30, status: 'Paid' },
    ]
  },
  {
    id: '4',
    name: 'Zainab binti Ali',
    tier: 'Household',
    discount: false,
    monthlyAmount: 100,
    status: 'Active',
    bounces: 0,
    history: [
      { date: 'Mar 2025', amount: 100, status: 'Paid' },
      { date: 'Feb 2025', amount: 100, status: 'Paid' },
    ],
    householdMembers: [
      { name: 'Ali bin Abu', relationship: 'Immediate Family' },
      { name: 'Fatimah binti Ali', relationship: 'Immediate Family' },
      { name: 'Hassan bin Ali', relationship: 'Immediate Family' },
      { name: 'Mariam binti Yusof', relationship: 'Parent/In-law' },
      { name: 'Yusof bin Daud', relationship: 'Parent/In-law' }
    ]
  },
  {
    id: '5',
    name: 'Omar Abdullah',
    tier: 'Individual',
    discount: true,
    monthlyAmount: 25,
    status: 'Active',
    bounces: 0,
    history: [
      { date: 'Mar 2025', amount: 25, status: 'Paid' },
      { date: 'Feb 2025', amount: 25, status: 'Paid' },
    ]
  },
  {
    id: '6',
    name: 'Khadijah Ibrahim',
    tier: 'Household',
    discount: true,
    monthlyAmount: 60,
    status: 'Inactive',
    bounces: 0,
    history: [
      { date: 'Mar 2025', amount: 0, status: 'No Record' },
      { date: 'Feb 2025', amount: 60, status: 'Paid' },
    ],
    householdMembers: [
      { name: 'Ibrahim bin Musa', relationship: 'Immediate Family' },
      { name: 'Sarah binti Ibrahim', relationship: 'Immediate Family' },
      { name: 'Musa bin Ahmad', relationship: 'Parent/In-law' },
      { name: 'Aminah binti Salleh', relationship: 'Parent/In-law' }
    ]
  },
  {
    id: '7',
    name: 'Yusof Haslam',
    tier: 'Individual',
    discount: false,
    monthlyAmount: 100,
    status: 'Active',
    bounces: 0,
    history: Array(12).fill({ date: '2024', amount: 100, status: 'Paid' }).map((_, i) => ({
      date: new Date(2025, 2 - i, 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      amount: 100,
      status: 'Paid'
    }))
  },
  {
    id: '8',
    name: 'Norlida Ahmad',
    tier: 'Household',
    discount: false,
    monthlyAmount: 120,
    status: 'Active',
    bounces: 1,
    history: [
      { date: 'Mar 2025', amount: 120, status: 'Paid' },
      { date: 'Feb 2025', amount: 120, status: 'Bounced' },
    ],
    householdMembers: [
      { name: 'Ahmad bin Kassim', relationship: 'Immediate Family' },
      { name: 'Syafiq bin Ahmad', relationship: 'Immediate Family' },
      { name: 'Syahira binti Ahmad', relationship: 'Immediate Family' },
      { name: 'Kassim bin Baba', relationship: 'Parent/In-law' }
    ]
  }
];

export const MOCK_INCOMING_DONATORS: IncomingDonator[] = [
  {
    id: '101',
    name: 'Hassan Basri',
    tier: 'Individual',
    discount: false,
    submittedDate: '2025-03-05',
    status: 'Pending Giro'
  },
  {
    id: '102',
    name: 'Aishah Sinclair',
    tier: 'Household',
    discount: true,
    submittedDate: '2025-03-04',
    status: 'Pending e-Giro',
    householdMembers: [
      { name: 'Adam Sinclair', relationship: 'Immediate Family' },
      { name: 'Bunga Sinclair', relationship: 'Immediate Family' },
      { name: 'Mohamed Sinclair', relationship: 'Parent/In-law' },
      { name: 'Kharsiah', relationship: 'Parent/In-law' }
    ]
  },
  {
    id: '103',
    name: 'Mawi World',
    tier: 'Individual',
    discount: false,
    submittedDate: '2025-03-01',
    status: 'Pending Giro'
  },
  {
    id: '104',
    name: 'Erra Fazira',
    tier: 'Household',
    discount: false,
    submittedDate: '2025-02-28',
    status: 'Pending e-Giro',
    householdMembers: [
      { name: 'Engku Emran', relationship: 'Immediate Family' },
      { name: 'Engku Aleesya', relationship: 'Immediate Family' },
      { name: 'Wan Chek', relationship: 'Parent/In-law' },
      { name: 'Fazira', relationship: 'Parent/In-law' }
    ]
  }
];
