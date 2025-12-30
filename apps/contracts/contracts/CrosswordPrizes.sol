// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/CommonConstants.sol";
import "./libraries/ErrorMessages.sol";
import "./libraries/AccessControlLib.sol";

/**
 * @title CrosswordPrizes (Light Version)
 * @dev Contract to manage prizes
 */
contract CrosswordPrizes is Ownable, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    event CrosswordCreated(bytes32 indexed crosswordId, address indexed token, uint256 prizePool, address creator);
    event CrosswordActivated(bytes32 indexed crosswordId, uint256 activationTime);
    event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank);
    event UnclaimedPrizesRecovered(bytes32 indexed crosswordId, address indexed token, uint256 amount, address recoveredBy);
    event TokenAllowed(address indexed token, bool allowed);
    event NativeCeloReceived(address indexed sender, uint256 amount);
    event PrizeTransferFailed(bytes32 indexed crosswordId, address indexed user, uint256 amount, string reason);
    event MaxWinnersChanged(uint256 oldMaxWinners, uint256 newMaxWinners, address changedBy);

    enum CrosswordState { Inactive, Active, Complete }

    struct CompletionRecord {
        address user;
        uint256 timestamp;
        uint256 rank;
    }

    struct Crossword {
        address token;
        uint256 totalPrizePool;
        uint256[] winnerPercentages;
        CompletionRecord[] completions;
        mapping(address => bool) hasClaimed;
        uint256 activationTime;
        uint256 endTime;
        CrosswordState state;
        uint256 createdAt;
        uint256 claimedAmount;
    }

    mapping(bytes32 => Crossword) public crosswords;
    mapping(address => bool) public allowedTokens;
    uint256 public maxWinners = 3;

    mapping(bytes32 => mapping(address => uint256)) public userRankInCrossword;
    mapping(bytes32 => uint256) public crosswordCeloBalance;

    modifier onlyAdminOrOwner() {
        AccessControlLib.validateAdminOrOwner(Ownable(this), AccessControl(this), _msgSender(), ErrorMessages.NOT_OWNER_OR_ADMIN);
        _;
    }

    constructor(address initialAdmin) Ownable(initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(AccessControlLib.ADMIN_ROLE, initialAdmin);
        _grantRole(AccessControlLib.OPERATOR_ROLE, initialAdmin);
        allowedTokens[address(0)] = true;
    }

    function createCrossword(
        bytes32 crosswordId,
        address token,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external payable onlyAdminOrOwner whenNotPaused {
        _createCrossword(crosswordId, token, prizePool, winnerPercentages, endTime);
    }

    function _createCrossword(
        bytes32 crosswordId,
        address token,
        uint256 prizePool,
        uint256[] memory winnerPercentages,
        uint256 endTime
    ) internal {
        require(crosswords[crosswordId].createdAt == 0, ErrorMessages.ALREADY_EXISTS);
        require(allowedTokens[token], ErrorMessages.TOKEN_NOT_ALLOWED);
        ValidationLib.validateGreaterThanZero(prizePool, ErrorMessages.PRIZE_POOL_GT_ZERO);
        require(winnerPercentages.length > 0, "Percentages needed");
        ValidationLib.validateMaxValue(winnerPercentages.length, maxWinners, ErrorMessages.TOO_MANY_WINNERS);
        if (endTime != 0) {
            if (endTime > block.timestamp) {
                ValidationLib.validateMaxValue(endTime - block.timestamp, CommonConstants.MAX_END_TIME, ErrorMessages.END_TIME_TOO_FAR);
            } else {
                revert(ErrorMessages.INVALID_END_TIME);
            }
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < winnerPercentages.length; i++) {
            ValidationLib.validateMaxValue(winnerPercentages[i], CommonConstants.MAX_SINGLE_WINNER_PERCENTAGE, ErrorMessages.PERCENTAGE_TOO_HIGH);
            ValidationLib.validateGreaterThanZero(winnerPercentages[i], "Percentage > 0");
            totalPercentage += winnerPercentages[i];
        }
        ValidationLib.validateMaxValue(totalPercentage, CommonConstants.MAX_PERCENTAGE, ErrorMessages.TOTAL_GT_100);

        if (token == address(0)) {
            require(msg.value == prizePool, ErrorMessages.VALUE_MISMATCH);
            crosswordCeloBalance[crosswordId] = prizePool;
        } else {
            IERC20(token).safeTransferFrom(_msgSender(), address(this), prizePool);
        }

        Crossword storage newCrossword = crosswords[crosswordId];
        newCrossword.token = token;
        newCrossword.totalPrizePool = prizePool;
        newCrossword.winnerPercentages = winnerPercentages;
        newCrossword.state = CrosswordState.Inactive;
        newCrossword.createdAt = block.timestamp;
        newCrossword.endTime = endTime;

        emit CrosswordCreated(crosswordId, token, prizePool, _msgSender());
    }

    function createCrosswordWithoutValue(
        bytes32 crosswordId,
        address token,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external onlyRole(AccessControlLib.ADMIN_ROLE) whenNotPaused {
        require(crosswords[crosswordId].createdAt == 0, ErrorMessages.ALREADY_EXISTS);
        require(allowedTokens[token], ErrorMessages.TOKEN_NOT_ALLOWED);
        ValidationLib.validateGreaterThanZero(prizePool, ErrorMessages.PRIZE_POOL_GT_ZERO);
        require(winnerPercentages.length > 0, "Percentages needed");
        ValidationLib.validateMaxValue(winnerPercentages.length, maxWinners, ErrorMessages.TOO_MANY_WINNERS);
        if (endTime != 0) {
            if (endTime > block.timestamp) {
                ValidationLib.validateMaxValue(endTime - block.timestamp, CommonConstants.MAX_END_TIME, ErrorMessages.END_TIME_TOO_FAR);
            } else {
                revert(ErrorMessages.INVALID_END_TIME);
            }
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < winnerPercentages.length; i++) {
            ValidationLib.validateMaxValue(winnerPercentages[i], CommonConstants.MAX_SINGLE_WINNER_PERCENTAGE, ErrorMessages.PERCENTAGE_TOO_HIGH);
            ValidationLib.validateGreaterThanZero(winnerPercentages[i], "Percentage > 0");
            totalPercentage += winnerPercentages[i];
        }
        ValidationLib.validateMaxValue(totalPercentage, CommonConstants.MAX_PERCENTAGE, ErrorMessages.TOTAL_GT_100);

        // For this function, we don't require value to be sent - the prize pool is expected to be funded separately
        // If it's native CELO, the balance needs to be set separately
        if (token == address(0)) {
            // We'll set the balance to 0 initially, expecting it to be funded later
            crosswordCeloBalance[crosswordId] = prizePool;
        }

        Crossword storage newCrossword = crosswords[crosswordId];
        newCrossword.token = token;
        newCrossword.totalPrizePool = prizePool;
        newCrossword.winnerPercentages = winnerPercentages;
        newCrossword.state = CrosswordState.Inactive;
        newCrossword.createdAt = block.timestamp;
        newCrossword.endTime = endTime;

        emit CrosswordCreated(crosswordId, token, prizePool, _msgSender());
    }

    /**
     * @dev Grant operator role to a specific contract (like CrosswordBoard)
     * @param operator The address of the contract to grant operator role to
     */
    function grantOperatorRole(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AccessControlLib.OPERATOR_ROLE, operator);
    }

    /**
     * @dev Deposit native CELO for a specific crossword's prize pool
     * @param crosswordId The ID of the crossword to fund
     */
    function depositNativeCELOForCrossword(bytes32 crosswordId) external payable onlyRole(AccessControlLib.ADMIN_ROLE) whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.token == address(0), "Crossword uses non-native token");
        require(msg.value > 0, "Must send value");

        crosswordCeloBalance[crosswordId] += msg.value;
    }

    // Storage to track authorized funding contract (like CrosswordBoard)
    address public fundingContract;

    /**
     * @dev Set the authorized funding contract (like CrosswordBoard)
     * @param _fundingContract The address of the contract authorized to fund crosswords
     */
    function setFundingContract(address _fundingContract) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        fundingContract = _fundingContract;
    }

    /**
     * @dev Function to receive native CELO from authorized contract for prize distribution
     * @param crosswordId The ID of the crossword to fund
     */
    function receiveNativeCELOForCrossword(bytes32 crosswordId) external payable whenNotPaused {
        // Only allow authorized funding contract to call this function
        require(msg.sender == fundingContract, "Only authorized funding contract can fund");

        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.token == address(0), "Crossword uses non-native token");
        require(msg.value > 0, "Must send value");

        crosswordCeloBalance[crosswordId] += msg.value;
    }

    /**
     * @dev Function to receive native CELO for a specific crossword's prize pool by admin
     * @param crosswordId The ID of the crossword to fund
     */
    function fundNativeCELOForCrossword(bytes32 crosswordId) external payable onlyRole(AccessControlLib.ADMIN_ROLE) whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.token == address(0), "Crossword uses non-native token");
        require(msg.value > 0, "Must send value");

        crosswordCeloBalance[crosswordId] += msg.value;
    }

    function activateCrossword(bytes32 crosswordId) external onlyRole(AccessControlLib.ADMIN_ROLE) whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.state == CrosswordState.Inactive, "Not inactive");

        crossword.state = CrosswordState.Active;
        crossword.activationTime = block.timestamp;

        emit CrosswordActivated(crosswordId, block.timestamp);
    }

    function _recordCompletionInternal(bytes32 crosswordId, address user) internal returns (bool awardedPrize) {
        Crossword storage crossword = crosswords[crosswordId];

        // Check if crossword is active
        if (crossword.state != CrosswordState.Active) {
            return false;
        }

        if (user == address(0)) {
            return false;
        }

        // Check if there's an actual prize pool for this crossword
        if (crossword.totalPrizePool == 0) {
            return false;
        }

        // Check if past endTime (if set)
        if (crossword.endTime > 0 && block.timestamp > crossword.endTime) {
            return false;
        }

        // Check if we already have maximum winners
        if (crossword.completions.length >= crossword.winnerPercentages.length || crossword.completions.length >= maxWinners) {
            return false; // User was too late, no prize
        }

        // SECURITY FIX: Check using O(1) mapping instead of loop
        if (userRankInCrossword[crosswordId][user] > 0) {
            return false; // User already has a rank (already completed)
        }

        // SECURITY FIX: Checks-Effects-Interactions pattern
        // 1. CHECKS - already done above

        // 2. EFFECTS - Update all state BEFORE external calls
        uint256 rank = crossword.completions.length + 1;

        // Create completion record
        CompletionRecord memory completion = CompletionRecord({
            user: user,
            timestamp: block.timestamp,
            rank: rank
        });

        crossword.completions.push(completion);

        // Update O(1) mapping for rank lookup
        userRankInCrossword[crosswordId][user] = rank;

        // Calculate prize amount to see if they are a winner
        uint256 prizeAmount = (crossword.totalPrizePool * crossword.winnerPercentages[rank - 1]) / CommonConstants.MAX_PERCENTAGE;

        // If we reached the maximum number of winners, mark as complete
        if (crossword.completions.length >= crossword.winnerPercentages.length || crossword.completions.length >= maxWinners) {
            crossword.state = CrosswordState.Complete;
        }

        // Return true if user was added as a winner (meaning they are eligible to claim)
        return prizeAmount > 0;
    }

    function recordCompletion(bytes32 crosswordId, address user) external onlyRole(AccessControlLib.OPERATOR_ROLE) whenNotPaused returns (bool awardedPrize) {
        awardedPrize = _recordCompletionInternal(crosswordId, user);
    }

    function claimPrize(bytes32 crosswordId) external nonReentrant whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.state == CrosswordState.Active || crossword.state == CrosswordState.Complete, ErrorMessages.NOT_ACTIVE_COMPLETE);
        require(crossword.hasClaimed[msg.sender] == false, ErrorMessages.ALREADY_CLAIMED);

        uint256 rank = userRankInCrossword[crosswordId][msg.sender];
        require(rank > 0, ErrorMessages.NOT_A_WINNER);

        require(rank <= crossword.winnerPercentages.length, ErrorMessages.INVALID_RANK);

        uint256 percentage = crossword.winnerPercentages[rank - 1];
        uint256 prizeAmount = (crossword.totalPrizePool * percentage) / CommonConstants.MAX_PERCENTAGE;

        ValidationLib.validateGreaterThanZero(prizeAmount, ErrorMessages.PRIZE_GT_ZERO);

        crossword.hasClaimed[msg.sender] = true;

        if (crossword.token == address(0)) {
            require(prizeAmount <= crosswordCeloBalance[crosswordId], ErrorMessages.INSUFFICIENT_BALANCE);
            crosswordCeloBalance[crosswordId] -= prizeAmount;
            crossword.claimedAmount += prizeAmount;

            (bool sent, ) = payable(msg.sender).call{value: prizeAmount}("");
            if (!sent) {
                crossword.hasClaimed[msg.sender] = false;
                crosswordCeloBalance[crosswordId] += prizeAmount;
                crossword.claimedAmount -= prizeAmount;
                emit PrizeTransferFailed(crosswordId, msg.sender, prizeAmount, ErrorMessages.TRANSFER_FAILED);
                return;
            }
        } else {
            IERC20(crossword.token).safeTransfer(msg.sender, prizeAmount);
        }

        emit PrizeDistributed(crosswordId, msg.sender, prizeAmount, rank);
    }

    function recoverUnclaimedPrizes(bytes32 crosswordId) external onlyRole(AccessControlLib.ADMIN_ROLE) nonReentrant whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, "Does not exist");
        require(crossword.state == CrosswordState.Complete, "Not complete");
        require(block.timestamp >= crossword.activationTime + CommonConstants.RECOVERY_WINDOW, "Window not elapsed");
        
        uint256 unclaimedAmount;
        if (crossword.token == address(0)) {
            unclaimedAmount = crosswordCeloBalance[crosswordId];
            crosswordCeloBalance[crosswordId] = 0;
            
            (bool sent, ) = payable(_msgSender()).call{value: unclaimedAmount}("");
            require(sent, "CELO recovery failed");
        } else {
            unclaimedAmount = IERC20(crossword.token).balanceOf(address(this));
            IERC20(crossword.token).safeTransfer(_msgSender(), unclaimedAmount);
        }

        emit UnclaimedPrizesRecovered(crosswordId, crossword.token, unclaimedAmount, _msgSender());
    }

    function setAllowedToken(address token, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function setMaxWinners(uint256 newMaxWinners) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        ValidationLib.validateGreaterThanZero(newMaxWinners, "Max > 0");
        ValidationLib.validateMaxValue(newMaxWinners, CommonConstants.MAX_CONFIGURABLE_WINNERS, ErrorMessages.MAX_EXCEEDS_LIMIT);

        uint256 oldMaxWinners = maxWinners;
        maxWinners = newMaxWinners;

        emit MaxWinnersChanged(oldMaxWinners, newMaxWinners, _msgSender());
    }

    function isWinner(bytes32 crosswordId, address user) external view returns (bool) {
        return userRankInCrossword[crosswordId][user] > 0;
    }

    function getUserRank(bytes32 crosswordId, address user) external view returns (uint256) {
        return userRankInCrossword[crosswordId][user];
    }

    function getCrosswordDetails(bytes32 crosswordId)
        external
        view
        returns (
            address token,
            uint256 totalPrizePool,
            uint256[] memory winnerPercentages,
            address[] memory winners,
            uint256 activationTime,
            uint256 endTime,
            CrosswordState state,
            bool isFinalized
        )
    {
        Crossword storage crossword = crosswords[crosswordId];
        token = crossword.token;
        totalPrizePool = crossword.totalPrizePool;
        winnerPercentages = crossword.winnerPercentages;
        activationTime = crossword.activationTime;
        endTime = crossword.endTime;
        state = crossword.state;
        isFinalized = crossword.state == CrosswordState.Complete;

        uint256 winnerCount = crossword.completions.length < winnerPercentages.length ? 
            crossword.completions.length : 
            winnerPercentages.length;
        winners = new address[](winnerCount);
        for (uint256 i = 0; i < winnerCount; i++) {
            winners[i] = crossword.completions[i].user;
        }
    }

    function getMaxWinners() external view returns (uint256) {
        return maxWinners;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    receive() external payable {
        emit NativeCeloReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit NativeCeloReceived(msg.sender, msg.value);
    }
}