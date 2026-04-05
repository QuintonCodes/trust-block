// Mock data for demonstration purposes
// In production, this would come from the database via Prisma

import type { EscrowLink, Transaction, DashboardMetrics, User } from './types'

export const mockUser: User = {
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  displayName: 'Acme Dev Studio',
  avatarUrl: null,
  bio: 'Full-stack development services',
  role: 'WORKER',
  createdAt: new Date('2024-01-15'),
  lastLogin: new Date(),
}

// Mock client user for testing client view
export const mockClientUser: User = {
  walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  displayName: 'TechCorp Inc.',
  avatarUrl: null,
  bio: 'Looking for quality development work',
  role: 'CLIENT',
  createdAt: new Date('2024-02-01'),
  lastLogin: new Date(),
}

export const mockEscrows: EscrowLink[] = [
  {
    id: 'esc-001-abc',
    freelancerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    clientAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    projectTitle: 'E-commerce Platform Development',
    scopeOfWork: 'Full-stack development of a custom e-commerce platform with payment integration, inventory management, and admin dashboard.',
    totalAmount: 5000,
    currency: 'USDC',
    status: 'LOCKED',
    contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
    milestones: [
      {
        id: 'ms-001',
        escrowLinkId: 'esc-001-abc',
        title: 'UI/UX Design Delivery',
        description: 'Complete design mockups and prototypes',
        amount: 1250,
        orderIndex: 0,
        status: 'APPROVED_AND_PAID',
        dueDate: new Date('2024-03-15'),
        submittedAt: new Date('2024-03-14'),
        autoReleaseAt: null,
      },
      {
        id: 'ms-002',
        escrowLinkId: 'esc-001-abc',
        title: 'Frontend Development',
        description: 'React frontend with responsive design',
        amount: 1875,
        orderIndex: 1,
        status: 'PENDING_APPROVAL',
        dueDate: new Date('2024-04-01'),
        submittedAt: new Date('2024-03-28'),
        autoReleaseAt: new Date('2024-03-31'), // 3 days after submission
      },
      {
        id: 'ms-003',
        escrowLinkId: 'esc-001-abc',
        title: 'Backend & Deployment',
        description: 'API development and cloud deployment',
        amount: 1875,
        orderIndex: 2,
        status: 'FUNDED',
        dueDate: new Date('2024-04-15'),
        submittedAt: null,
        autoReleaseAt: null,
      },
    ],
  },
  {
    id: 'esc-002-def',
    freelancerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    clientAddress: null,
    projectTitle: 'Mobile App UI Redesign',
    scopeOfWork: 'Complete redesign of existing mobile application with modern UI components and improved UX flow.',
    totalAmount: 2500,
    currency: 'USDC',
    status: 'AWAITING_FUNDS',
    contractAddress: null,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
    milestones: [
      {
        id: 'ms-004',
        escrowLinkId: 'esc-002-def',
        title: 'Full Payment',
        description: 'Complete project delivery',
        amount: 2500,
        orderIndex: 0,
        status: 'PENDING_FUNDS',
        dueDate: new Date('2024-04-10'),
        submittedAt: null,
        autoReleaseAt: null,
      },
    ],
  },
  {
    id: 'esc-003-ghi',
    freelancerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    clientAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
    projectTitle: 'Smart Contract Audit',
    scopeOfWork: 'Security audit of DeFi protocol smart contracts including vulnerability assessment and recommendations.',
    totalAmount: 8000,
    currency: 'USDC',
    status: 'IN_REVIEW',
    contractAddress: '0x1111222233334444555566667777888899990000',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-12'),
    milestones: [
      {
        id: 'ms-005',
        escrowLinkId: 'esc-003-ghi',
        title: 'Initial Review',
        description: 'Code review and vulnerability scan',
        amount: 4000,
        orderIndex: 0,
        status: 'APPROVED_AND_PAID',
        dueDate: new Date('2024-03-01'),
        submittedAt: new Date('2024-02-28'),
        autoReleaseAt: null,
      },
      {
        id: 'ms-006',
        escrowLinkId: 'esc-003-ghi',
        title: 'Final Report',
        description: 'Detailed audit report with recommendations',
        amount: 4000,
        orderIndex: 1,
        status: 'PENDING_APPROVAL',
        dueDate: new Date('2024-03-15'),
        submittedAt: new Date('2024-03-12'),
        autoReleaseAt: new Date('2024-03-15'), // 3 days after submission
      },
    ],
  },
  {
    id: 'esc-004-jkl',
    freelancerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    clientAddress: '0x0000111122223333444455556666777788889999',
    projectTitle: 'Landing Page Design',
    scopeOfWork: 'Modern landing page design for SaaS product launch.',
    totalAmount: 1200,
    currency: 'USDC',
    status: 'RELEASED',
    contractAddress: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    milestones: [
      {
        id: 'ms-007',
        escrowLinkId: 'esc-004-jkl',
        title: 'Full Payment',
        description: 'Complete project delivery',
        amount: 1200,
        orderIndex: 0,
        status: 'APPROVED_AND_PAID',
        dueDate: new Date('2024-02-01'),
        submittedAt: new Date('2024-01-30'),
        autoReleaseAt: null,
      },
    ],
  },
  {
    id: 'esc-005-mno',
    freelancerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    clientAddress: null,
    projectTitle: 'API Integration Service',
    scopeOfWork: 'Integration of third-party payment APIs with existing backend infrastructure.',
    totalAmount: 3500,
    currency: 'USDC',
    status: 'DRAFT',
    contractAddress: null,
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-14'),
    milestones: [],
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    escrowLinkId: 'esc-001-abc',
    txHash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
    transactionType: 'DEPOSIT',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x9876543210fedcba9876543210fedcba98765432',
    amount: 5000,
    timestamp: new Date('2024-03-05T14:30:00'),
  },
  {
    id: 'tx-002',
    escrowLinkId: 'esc-001-abc',
    txHash: '0xdef456789012345678901234567890123456789012345678901234567890efgh',
    transactionType: 'PAYOUT',
    fromAddress: '0x9876543210fedcba9876543210fedcba98765432',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    amount: 1212.5,
    timestamp: new Date('2024-03-15T10:15:00'),
  },
  {
    id: 'tx-003',
    escrowLinkId: 'esc-001-abc',
    txHash: '0xghi789012345678901234567890123456789012345678901234567890123ijkl',
    transactionType: 'FEE_COLLECTION',
    fromAddress: '0x9876543210fedcba9876543210fedcba98765432',
    toAddress: '0xfeefeefeefeefeefeefeefeefeefeefeefeefee0',
    amount: 37.5,
    timestamp: new Date('2024-03-15T10:15:00'),
  },
  {
    id: 'tx-004',
    escrowLinkId: 'esc-003-ghi',
    txHash: '0xjkl012345678901234567890123456789012345678901234567890123456mnop',
    transactionType: 'DEPOSIT',
    fromAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
    toAddress: '0x1111222233334444555566667777888899990000',
    amount: 8000,
    timestamp: new Date('2024-02-25T09:00:00'),
  },
  {
    id: 'tx-005',
    escrowLinkId: 'esc-003-ghi',
    txHash: '0xqrs345678901234567890123456789012345678901234567890123456789tuvw',
    transactionType: 'PAYOUT',
    fromAddress: '0x1111222233334444555566667777888899990000',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    amount: 3880,
    timestamp: new Date('2024-03-01T16:45:00'),
  },
  {
    id: 'tx-006',
    escrowLinkId: 'esc-004-jkl',
    txHash: '0xxyz678901234567890123456789012345678901234567890123456789012abc',
    transactionType: 'DEPOSIT',
    fromAddress: '0x0000111122223333444455556666777788889999',
    toAddress: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
    amount: 1200,
    timestamp: new Date('2024-01-20T11:30:00'),
  },
  {
    id: 'tx-007',
    escrowLinkId: 'esc-004-jkl',
    txHash: '0xdef901234567890123456789012345678901234567890123456789012345ghij',
    transactionType: 'PAYOUT',
    fromAddress: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    amount: 1164,
    timestamp: new Date('2024-02-01T14:00:00'),
  },
]

export const mockMetrics: DashboardMetrics = {
  totalSecured: 13500,
  lifetimeEarnings: 6256.5,
  activeEscrows: 3,
  pendingDeposits: 2,
}

// Helper functions to simulate database queries
export function getEscrowsByStatus(status: string): EscrowLink[] {
  return mockEscrows.filter(e => e.status === status)
}

export function getEscrowById(id: string): EscrowLink | undefined {
  return mockEscrows.find(e => e.id === id)
}

export function getTransactionsByEscrowId(escrowId: string): Transaction[] {
  return mockTransactions.filter(t => t.escrowLinkId === escrowId)
}

export function getAllTransactions(): Transaction[] {
  return mockTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
