// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustBlockEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    uint256 public protocolFee = 300; // 300 basis points = 3%
    uint256 public autoReleasePeriod = 3 days;
    address public feeTreasury;

    enum EscrowStatus { AWAITING_FUNDS, LOCKED, IN_REVIEW, RELEASED, IN_DISPUTE, CANCELLED }
    enum MilestoneStatus { PENDING_FUNDS, FUNDED, WORK_SUBMITTED, PENDING_APPROVAL, APPROVED_AND_PAID, AUTO_RELEASED }

    struct Escrow {
        address freelancer;
        address client;
        uint256 totalAmount;
        uint256 releasedAmount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 fundedAt;
    }

    struct Milestone {
        string title;
        uint256 amount;
        MilestoneStatus status;
        uint256 submittedAt;
        uint256 autoReleaseAt;
    }

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => Milestone[]) public escrowMilestones;

    // Events
    event EscrowCreated(bytes32 indexed escrowId, address indexed client, address indexed freelancer, uint256 totalAmount);
    event FundsDeposited(bytes32 indexed escrowId, address indexed client, uint256 amount, uint256 timestamp);
    event MilestoneSubmitted(bytes32 indexed escrowId, uint256 indexed milestoneIndex, uint256 autoReleaseAt);
    event MilestoneApproved(bytes32 indexed escrowId, uint256 indexed milestoneIndex, uint256 amount, address indexed recipient);
    event FundsAutoReleased(bytes32 indexed escrowId, uint256 indexed milestoneIndex, uint256 amount, address indexed recipient);
    event DisputeInitiated(bytes32 indexed escrowId, address indexed initiator, string reason);
    event EscrowCancelled(bytes32 indexed escrowId, uint256 refundAmount);

    constructor(address _usdc, address _feeTreasury) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        feeTreasury = _feeTreasury;
    }

    // NEW: Must be called before depositing to establish the contract rules
    function createEscrow(
        bytes32 escrowId,
        address freelancer,
        uint256 totalAmount,
        string[] memory milestoneTitles,
        uint256[] memory milestoneAmounts
    ) external {
        require(escrows[escrowId].client == address(0), "Escrow already exists");
        require(milestoneTitles.length == milestoneAmounts.length, "Mismatched milestones");
        require(freelancer != address(0), "Invalid freelancer address");

        uint256 calculatedTotal = 0;
        for(uint i = 0; i < milestoneAmounts.length; i++) {
            calculatedTotal += milestoneAmounts[i];
            escrowMilestones[escrowId].push(Milestone({
                title: milestoneTitles[i],
                amount: milestoneAmounts[i],
                status: MilestoneStatus.PENDING_FUNDS,
                submittedAt: 0,
                autoReleaseAt: 0
            }));
        }
        require(calculatedTotal == totalAmount, "Milestone amounts must equal total");

        escrows[escrowId] = Escrow({
            freelancer: freelancer,
            client: address(0),
            totalAmount: totalAmount,
            releasedAmount: 0,
            status: EscrowStatus.AWAITING_FUNDS,
            createdAt: block.timestamp,
            fundedAt: 0
        });

        emit EscrowCreated(escrowId, msg.sender, freelancer, totalAmount);
    }

    function depositFunds(bytes32 escrowId, uint256 amount) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.AWAITING_FUNDS, "Not awaiting funds");

        if (escrow.client == address(0)) {
          require(msg.sender != escrow.freelancer, "Freelancer cannot fund their own escrow");
            escrow.client = msg.sender;
        } else {
          require(msg.sender == escrow.client, "Only client can fund");
        }

        require(amount == escrow.totalAmount, "Must fund exact total amount");

        escrow.status = EscrowStatus.LOCKED;
        escrow.fundedAt = block.timestamp;

        for(uint i = 0; i < escrowMilestones[escrowId].length; i++) {
            escrowMilestones[escrowId][i].status = MilestoneStatus.FUNDED;
        }

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit FundsDeposited(escrowId, msg.sender, amount, block.timestamp);
    }

    function submitMilestone(bytes32 escrowId, uint256 milestoneIndex) external {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.freelancer, "Only freelancer can submit");
        require(escrow.status == EscrowStatus.LOCKED || escrow.status == EscrowStatus.IN_REVIEW, "Escrow not active");

        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];
        require(milestone.status == MilestoneStatus.FUNDED, "Milestone not funded or already submitted");

        milestone.status = MilestoneStatus.WORK_SUBMITTED;
        milestone.submittedAt = block.timestamp;
        milestone.autoReleaseAt = block.timestamp + autoReleasePeriod;
        escrow.status = EscrowStatus.IN_REVIEW;

        emit MilestoneSubmitted(escrowId, milestoneIndex, milestone.autoReleaseAt);
    }

    function approveMilestone(bytes32 escrowId, uint256 milestoneIndex) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.client, "Only client can approve");
        require(escrow.status == EscrowStatus.IN_REVIEW, "Escrow not in review");

        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];
        require(milestone.status == MilestoneStatus.WORK_SUBMITTED, "Milestone not submitted");

        _processPayment(escrowId, milestoneIndex, escrow, milestone, MilestoneStatus.APPROVED_AND_PAID);
    }

    function autoReleaseMilestone(bytes32 escrowId, uint256 milestoneIndex) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];

        require(milestone.status == MilestoneStatus.WORK_SUBMITTED, "Milestone not submitted");
        require(block.timestamp >= milestone.autoReleaseAt, "Auto-release period not met");

        _processPayment(escrowId, milestoneIndex, escrow, milestone, MilestoneStatus.AUTO_RELEASED);
    }

    function requestChanges(bytes32 escrowId, uint256 milestoneIndex, string memory /* reason */) external {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.client, "Only client can request changes");

        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];
        require(milestone.status == MilestoneStatus.WORK_SUBMITTED, "Milestone not submitted");

        milestone.status = MilestoneStatus.FUNDED;
        milestone.submittedAt = 0;
        milestone.autoReleaseAt = 0;

        // Check if any other milestones are still in review
        bool othersInReview = false;
        for(uint i = 0; i < escrowMilestones[escrowId].length; i++) {
            if(escrowMilestones[escrowId][i].status == MilestoneStatus.WORK_SUBMITTED) {
                othersInReview = true;
                break;
            }
        }

        if(!othersInReview) {
            escrow.status = EscrowStatus.LOCKED;
        }
    }

    function initiateDispute(bytes32 escrowId, string memory reason) external {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.client || msg.sender == escrow.freelancer, "Not authorized");
        require(escrow.status == EscrowStatus.LOCKED || escrow.status == EscrowStatus.IN_REVIEW, "Cannot dispute in current state");

        escrow.status = EscrowStatus.IN_DISPUTE;
        emit DisputeInitiated(escrowId, msg.sender, reason);
    }

    function _processPayment(
        bytes32 escrowId,
        uint256 milestoneIndex,
        Escrow storage escrow,
        Milestone storage milestone,
        MilestoneStatus finalStatus
    ) internal {
        milestone.status = finalStatus;

        uint256 fee = (milestone.amount * protocolFee) / 10000;
        uint256 payout = milestone.amount - fee;

        escrow.releasedAmount += milestone.amount;

        if (escrow.releasedAmount == escrow.totalAmount) {
            escrow.status = EscrowStatus.RELEASED;
        } else {
            escrow.status = EscrowStatus.LOCKED;
        }

        if (fee > 0) {
            usdc.safeTransfer(feeTreasury, fee);
        }
        usdc.safeTransfer(escrow.freelancer, payout);

        if (finalStatus == MilestoneStatus.APPROVED_AND_PAID) {
            emit MilestoneApproved(escrowId, milestoneIndex, payout, escrow.freelancer);
        } else {
            emit FundsAutoReleased(escrowId, milestoneIndex, payout, escrow.freelancer);
        }
    }
}