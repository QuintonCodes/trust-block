// TrustBlock Escrow Smart Contract ABI
// This is a mock ABI for the future Solidity smart contract implementation
// It defines the interface for escrow operations on the blockchain

export const ESCROW_ABI = [
  // ============ Read Functions ============
  
  // Get the current status of an escrow
  {
    name: 'getEscrowStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'escrowId', type: 'bytes32' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'freelancer', type: 'address' },
          { name: 'client', type: 'address' },
          { name: 'totalAmount', type: 'uint256' },
          { name: 'releasedAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' }, // 0: Created, 1: Funded, 2: InProgress, 3: Completed, 4: Disputed, 5: Cancelled
          { name: 'createdAt', type: 'uint256' },
          { name: 'fundedAt', type: 'uint256' },
        ]
      }
    ]
  },

  // Get milestone details
  {
    name: 'getMilestone',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'title', type: 'string' },
          { name: 'amount', type: 'uint256' },
          { name: 'status', type: 'uint8' }, // 0: Pending, 1: Funded, 2: Submitted, 3: Approved, 4: Paid, 5: AutoReleased
          { name: 'submittedAt', type: 'uint256' },
          { name: 'autoReleaseAt', type: 'uint256' },
        ]
      }
    ]
  },

  // Get the number of milestones in an escrow
  {
    name: 'getMilestoneCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'escrowId', type: 'bytes32' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },

  // Check if an escrow exists
  {
    name: 'escrowExists',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'escrowId', type: 'bytes32' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },

  // Get protocol fee percentage (in basis points, e.g., 300 = 3%)
  {
    name: 'protocolFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },

  // Get auto-release period in seconds (default: 3 days = 259200)
  {
    name: 'autoReleasePeriod',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },

  // ============ Write Functions ============

  // Deposit funds into escrow (requires USDC approval first)
  {
    name: 'depositFunds',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },

  // Worker submits milestone for review (starts 3-day auto-release timer)
  {
    name: 'submitMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' }
    ],
    outputs: []
  },

  // Client approves milestone and releases funds to worker
  {
    name: 'approveMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' }
    ],
    outputs: []
  },

  // Release funds after auto-release period (can be called by anyone)
  {
    name: 'autoReleaseMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' }
    ],
    outputs: []
  },

  // Client requests changes (resets auto-release timer)
  {
    name: 'requestChanges',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' },
      { name: 'reason', type: 'string' }
    ],
    outputs: []
  },

  // Initiate dispute (only client or worker)
  {
    name: 'initiateDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'reason', type: 'string' }
    ],
    outputs: []
  },

  // Cancel escrow and refund (only if not funded yet)
  {
    name: 'cancelEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' }
    ],
    outputs: []
  },

  // ============ Events ============

  // Emitted when funds are deposited into escrow
  {
    name: 'FundsDeposited',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },

  // Emitted when a milestone is submitted for review
  {
    name: 'MilestoneSubmitted',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'milestoneIndex', type: 'uint256', indexed: true },
      { name: 'autoReleaseAt', type: 'uint256', indexed: false }
    ]
  },

  // Emitted when a milestone is approved and paid
  {
    name: 'MilestoneApproved',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'milestoneIndex', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'recipient', type: 'address', indexed: true }
    ]
  },

  // Emitted when funds are auto-released
  {
    name: 'FundsAutoReleased',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'milestoneIndex', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'recipient', type: 'address', indexed: true }
    ]
  },

  // Emitted when a dispute is initiated
  {
    name: 'DisputeInitiated',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'reason', type: 'string', indexed: false }
    ]
  },

  // Emitted when an escrow is cancelled
  {
    name: 'EscrowCancelled',
    type: 'event',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'refundAmount', type: 'uint256', indexed: false }
    ]
  }
] as const

// ERC20 ABI for USDC approval
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint8' }
    ]
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const

// Type for escrow status from contract
export type ContractEscrowStatus = 0 | 1 | 2 | 3 | 4 | 5
export const CONTRACT_STATUS_MAP = {
  0: 'AWAITING_FUNDS',
  1: 'LOCKED',
  2: 'IN_REVIEW',
  3: 'RELEASED',
  4: 'IN_DISPUTE',
  5: 'CANCELLED',
} as const

// Type for milestone status from contract
export type ContractMilestoneStatus = 0 | 1 | 2 | 3 | 4 | 5
export const CONTRACT_MILESTONE_STATUS_MAP = {
  0: 'PENDING_FUNDS',
  1: 'FUNDED',
  2: 'WORK_SUBMITTED',
  3: 'PENDING_APPROVAL',
  4: 'APPROVED_AND_PAID',
  5: 'AUTO_RELEASED',
} as const
