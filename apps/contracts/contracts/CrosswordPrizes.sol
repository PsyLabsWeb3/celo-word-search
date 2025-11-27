// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrosswordPrizes
 * @dev Contract to manage prize pools for educational crosswords on Celo
 * Handles automatic token rewards for the first N users who complete a crossword
 */
contract CrosswordPrizes is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Events
    event CrosswordCreated(
        bytes32 indexed crosswordId,
        address indexed token,
        uint256 prizePool,
        address creator
    );
    event CrosswordActivated(bytes32 indexed crosswordId, uint256 activationTime);
    event PrizeDistributed(
        bytes32 indexed crosswordId,
        address indexed winner,
        uint256 amount,
        uint256 rank
    );
    event UnclaimedPrizesRecovered(
        bytes32 indexed crosswordId,
        address indexed token,
        uint256 amount,
        address recoveredBy
    );
    event TokenAllowed(address indexed token, bool allowed);

    // Crossword status
    enum CrosswordState {
        Inactive,  // Created but not active
        Active,    // Active for solving
        Complete   // All prizes distributed
    }

    // Completion record
    struct CompletionRecord {
        address user;
        uint256 timestamp;
        uint256 rank; // 1-indexed rank (1st place, 2nd place, etc.)
    }

    // Crossword structure
    struct Crossword {
        IERC20 token;
        uint256 totalPrizePool;
        uint256[] winnerPercentages; // In basis points (10000 = 100%)
        CompletionRecord[] completions; // Track who completed in what order
        mapping(address => bool) hasClaimed; // Track claimed prizes
        uint256 activationTime;
        uint256 endTime; // 0 = no deadline
        CrosswordState state;
        uint256 createdAt;
    }

    // State variables
    mapping(bytes32 => Crossword) public crosswords;
    mapping(address => bool) public allowedTokens;
    uint256 public maxWinners = 3; // Configurable maximum number of winners, defaulting to 3
    uint256 public constant MAX_CONFIGURABLE_WINNERS = 10; // Maximum allowed configurable winners
    uint256 public constant MAX_PERCENTAGE = 10000; // 100% in basis points
    uint256 public constant MAX_SINGLE_WINNER_PERCENTAGE = 8000; // 80% max per winner
    uint256 public constant MAX_END_TIME = 30 days; // Max 30 days for deadline
    uint256 public constant RECOVERY_WINDOW = 30 days; // Unclaimed prizes recovery window

    /**
     * @dev Constructor - sets up roles and initial admin
     */
    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(OPERATOR_ROLE, initialAdmin);
    }

    /**
     * @dev Create a new crossword with prize pool
     * @param crosswordId Unique identifier for the crossword
     * @param token ERC-20 token address for rewards
     * @param prizePool Total amount of tokens for the prize pool
     * @param winnerPercentages Array of basis points for each winner (e.g., [6000, 4000] = 60%/40%)
     * @param endTime Optional deadline for submissions (0 for no deadline)
     */
    function createCrossword(
        bytes32 crosswordId,
        address token,
        uint256 prizePool,
        uint256[] memory winnerPercentages,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(token != address(0), "CrosswordPrizes: token cannot be zero address");
        require(allowedTokens[token], "CrosswordPrizes: token not allowed");
        require(prizePool > 0, "CrosswordPrizes: prize pool must be greater than 0");
        require(winnerPercentages.length > 0, "CrosswordPrizes: winners required");
        require(winnerPercentages.length <= maxWinners, "CrosswordPrizes: too many winners");
        require(prizePool >= winnerPercentages.length, "CrosswordPrizes: prize pool too small for winners");

        // Validate percentages sum to 10000 (100%) or less
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < winnerPercentages.length; i++) {
            require(
                winnerPercentages[i] > 0,
                "CrosswordPrizes: winner percentage must be greater than 0"
            );
            require(
                winnerPercentages[i] <= MAX_SINGLE_WINNER_PERCENTAGE,
                "CrosswordPrizes: single winner percentage too high"
            );
            totalPercentage += winnerPercentages[i];
        }
        require(
            totalPercentage <= MAX_PERCENTAGE,
            "CrosswordPrizes: total percentage exceeds 100%"
        );

        // Validate endTime
        if (endTime > 0) {
            require(
                endTime <= block.timestamp + MAX_END_TIME,
                "CrosswordPrizes: end time too far in the future"
            );
        }

        // Transfer tokens from admin to contract
        IERC20 tokenContract = IERC20(token);
        tokenContract.safeTransferFrom(_msgSender(), address(this), prizePool);

        Crossword storage crossword = crosswords[crosswordId];
        crossword.token = tokenContract;
        crossword.totalPrizePool = prizePool;
        crossword.winnerPercentages = winnerPercentages;
        crossword.endTime = endTime;
        crossword.state = CrosswordState.Inactive;
        crossword.createdAt = block.timestamp;

        emit CrosswordCreated(crosswordId, token, prizePool, _msgSender());
    }

    /**
     * @dev Activate a crossword (make it available for solving)
     * @param crosswordId The ID of the crossword to activate
     */
    function activateCrossword(bytes32 crosswordId) external onlyRole(ADMIN_ROLE) whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.state != CrosswordState.Complete, "CrosswordPrizes: already complete");
        require(crossword.state != CrosswordState.Active, "CrosswordPrizes: already active");
        require(address(crossword.token) != address(0), "CrosswordPrizes: crossword not created");

        crossword.state = CrosswordState.Active;
        crossword.activationTime = block.timestamp;

        emit CrosswordActivated(crosswordId, block.timestamp);
    }

    /**
     * @dev Record a user's crossword completion and distribute prize if they're in the top X finishers
     * @param crosswordId The ID of the crossword
     * @param user The address of the user who completed the crossword
     */
    function recordCompletion(bytes32 crosswordId, address user) external onlyRole(OPERATOR_ROLE) whenNotPaused returns (bool awardedPrize) {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.state == CrosswordState.Active, "CrosswordPrizes: crossword not active");
        require(user != address(0), "CrosswordPrizes: user address cannot be zero");
        require(!crossword.hasClaimed[user], "CrosswordPrizes: already received prize");

        // Check if past endTime (if set)
        if (crossword.endTime > 0) {
            require(block.timestamp <= crossword.endTime, "CrosswordPrizes: deadline passed");
        }

        // Check if we already have maximum winners
        if (crossword.completions.length >= crossword.winnerPercentages.length || crossword.completions.length >= maxWinners) {
            return false; // User was too late, no prize
        }

        // Create completion record with current rank
        uint256 rank = crossword.completions.length + 1;
        CompletionRecord memory completion = CompletionRecord({
            user: user,
            timestamp: block.timestamp,
            rank: rank
        });
        
        crossword.completions.push(completion);
        crossword.hasClaimed[user] = true;

        // Calculate and distribute prize
        uint256 prizeAmount = (crossword.totalPrizePool * crossword.winnerPercentages[rank - 1]) / MAX_PERCENTAGE;
        
        // Transfer the prize
        if (prizeAmount > 0) {
            crossword.token.safeTransfer(user, prizeAmount);
        }

        // Emit event
        emit PrizeDistributed(crosswordId, user, prizeAmount, rank);

        // If we reached the maximum number of winners, mark as complete
        if (crossword.completions.length >= crossword.winnerPercentages.length || crossword.completions.length >= maxWinners) {
            crossword.state = CrosswordState.Complete;
        }

        return true; // User received a prize
    }

    /**
     * @dev Allow winners to claim their prizes (fallback if automatic distribution failed)
     * @param crosswordId The ID of the crossword
     */
    function claimPrize(bytes32 crosswordId) external nonReentrant whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.state == CrosswordState.Complete, "CrosswordPrizes: crossword not complete or prizes already distributed");
        require(!crossword.hasClaimed[_msgSender()], "CrosswordPrizes: already claimed");

        // Find the user's completion record
        uint256 rank = 0;
        for (uint256 i = 0; i < crossword.completions.length; i++) {
            if (crossword.completions[i].user == _msgSender()) {
                rank = crossword.completions[i].rank;
                break;
            }
        }
        
        require(rank > 0, "CrosswordPrizes: not a verified winner");
        require(rank <= crossword.winnerPercentages.length, "CrosswordPrizes: rank too low for a prize");

        uint256 prizeAmount = (crossword.totalPrizePool * crossword.winnerPercentages[rank - 1]) / MAX_PERCENTAGE;
        require(prizeAmount > 0, "CrosswordPrizes: no prize available");

        // Check that contract has sufficient balance for this claim
        uint256 contractBalance = crossword.token.balanceOf(address(this));
        require(contractBalance >= prizeAmount, "CrosswordPrizes: insufficient contract balance");

        crossword.hasClaimed[_msgSender()] = true;
        crossword.token.safeTransfer(_msgSender(), prizeAmount);

        emit PrizeDistributed(crosswordId, _msgSender(), prizeAmount, rank);
    }

    /**
     * @dev Recover unclaimed prizes after recovery window
     * @param crosswordId The ID of the crossword
     */
    function recoverUnclaimedPrizes(bytes32 crosswordId) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.state == CrosswordState.Complete, "CrosswordPrizes: crossword not complete");
        require(
            block.timestamp >= crossword.activationTime + RECOVERY_WINDOW,
            "CrosswordPrizes: recovery window not elapsed"
        );
        require(crossword.activationTime > 0, "CrosswordPrizes: crossword not activated");

        uint256 remainingBalance = crossword.token.balanceOf(address(this));

        // Calculate how much should have been distributed
        uint256 totalExpectedDistributed = 0;
        for (uint256 i = 0; i < crossword.winnerPercentages.length && i < crossword.completions.length; i++) {
            totalExpectedDistributed += (crossword.totalPrizePool * crossword.winnerPercentages[i]) / MAX_PERCENTAGE;
        }

        // The remaining balance should be what wasn't distributed due to users not having records
        uint256 amountToRecover = crossword.totalPrizePool - totalExpectedDistributed;

        if (amountToRecover > 0 && remainingBalance >= amountToRecover) {
            crossword.token.safeTransfer(_msgSender(), amountToRecover);
            emit UnclaimedPrizesRecovered(crosswordId, address(crossword.token), amountToRecover, _msgSender());
        }
    }

    /**
     * @dev Add/remove allowed tokens for prize pools
     * @param token Token address to update
     * @param allowed Whether the token is allowed
     */
    function setAllowedToken(address token, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    /**
     * @dev Set the maximum number of winners allowed per crossword
     * @param newMaxWinners The new maximum number of winners (max 10)
     */
    function setMaxWinners(uint256 newMaxWinners) external onlyRole(ADMIN_ROLE) {
        require(newMaxWinners > 0, "CrosswordPrizes: max winners must be greater than 0");
        require(newMaxWinners <= MAX_CONFIGURABLE_WINNERS, "CrosswordPrizes: max winners exceeds limit");
        maxWinners = newMaxWinners;
    }

    /**
     * @dev Pause function to stop all distributions (alias for emergency pause)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Check if an address is a winner for a specific crossword
     * @param crosswordId The ID of the crossword
     * @param user The address to check
     * @return bool Whether the user is a winner
     */
    function isWinner(bytes32 crosswordId, address user) external view returns (bool) {
        Crossword storage crossword = crosswords[crosswordId];
        for (uint256 i = 0; i < crossword.completions.length; i++) {
            if (crossword.completions[i].user == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get the rank of a user for a specific crossword
     * @param crosswordId The ID of the crossword
     * @param user The address to check
     * @return uint256 The rank of the user (0 if not a winner)
     */
    function getUserRank(bytes32 crosswordId, address user) external view returns (uint256) {
        Crossword storage crossword = crosswords[crosswordId];
        for (uint256 i = 0; i < crossword.completions.length; i++) {
            if (crossword.completions[i].user == user) {
                return crossword.completions[i].rank;
            }
        }
        return 0; // Not a winner
    }

    /**
     * @dev Get crossword details
     * @param crosswordId The ID of the crossword
     * @return token The token address
     * @return totalPrizePool The total prize pool
     * @return winnerPercentages The percentages for each winner
     * @return completions The list of completions with their ranks
     * @return activationTime The activation timestamp
     * @return endTime The end time for submissions
     * @return state The current state of the crossword
     */
    function getCrosswordDetails(bytes32 crosswordId)
        external
        view
        returns (
            address token,
            uint256 totalPrizePool,
            uint256[] memory winnerPercentages,
            CompletionRecord[] memory completions,
            uint256 activationTime,
            uint256 endTime,
            CrosswordState state
        )
    {
        Crossword storage crossword = crosswords[crosswordId];
        return (
            address(crossword.token),
            crossword.totalPrizePool,
            crossword.winnerPercentages,
            crossword.completions,
            crossword.activationTime,
            crossword.endTime,
            crossword.state
        );
    }

    /**
     * @dev Get the number of completions for a crossword
     * @param crosswordId The ID of the crossword
     * @return uint256 The number of completions
     */
    function getCompletionsCount(bytes32 crosswordId) external view returns (uint256) {
        return crosswords[crosswordId].completions.length;
    }

    /**
     * @dev Get the current maximum number of winners
     * @return uint256 The maximum number of winners allowed
     */
    function getMaxWinners() external view returns (uint256) {
        return maxWinners;
    }

    /**
     * @dev Internal function to check if contract is paused before sensitive operations
     */
    function _requireNotPaused() internal view virtual override(Pausable) {
        require(!paused(), "CrosswordPrizes: contract is paused");
        super._requireNotPaused();
    }
}