// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/CommonConstants.sol";
import "./libraries/ErrorMessages.sol";

/**
 * @title PublicCrosswordManager
 * @dev Contract to manage public crossword creation and sponsorship
 */
contract PublicCrosswordManager is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    event CrosswordCreated(bytes32 indexed crosswordId, string name, string sponsoredBy, address indexed creator, uint256 timestamp);
    event CrosswordDataUpdated(bytes32 indexed crosswordId, string crosswordData, address updatedBy);
    event PrizePoolFunded(bytes32 indexed crosswordId, address indexed token, uint256 amount, address funder);
    event CrosswordActivated(bytes32 indexed crosswordId, uint256 activationTime);

    struct Crossword {
        string name;
        string sponsoredBy;
        string crosswordData;
        address token; // Address(0) for native CELO
        uint256 totalPrizePool;
        uint256 maxWinners;
        uint256[] winnerPercentages;
        uint256 activationTime;
        uint256 endTime; // 0 means no deadline
        uint256 createdAt;
        bool isActive;
        bool isCompleted;
        address creator;
    }

    mapping(bytes32 => Crossword) public crosswords;
    mapping(address => bool) public allowedTokens;
    
    // Keep track of all crosswords created
    bytes32[] public allCrosswordIds;
    
    uint256 public constant MAX_WINNERS = 10;
    uint256 public creationFee = 0; // Fee to create a crossword (can be set by owner)

    constructor(address initialOwner) Ownable(initialOwner) {
        // Allow native CELO by default
        allowedTokens[address(0)] = true;
    }

    /**
     * @dev Create a new crossword without prize pool (anyone can call)
     */
    function createCrossword(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy
    ) external payable whenNotPaused {
        _createCrossword(crosswordId, name, crosswordData, sponsoredBy, address(0), 0, new uint256[](0), 0, 1); // Default to 1 max winner
    }

    /**
     * @dev Create a new crossword with native CELO prize pool (anyone can call)
     */
    function createCrosswordWithNativeCELOPrizePool(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy,
        uint256 maxWinners,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external payable whenNotPaused {
        require(msg.value == prizePool, ErrorMessages.VALUE_MISMATCH);
        _createCrossword(crosswordId, name, crosswordData, sponsoredBy, address(0), prizePool, winnerPercentages, endTime, maxWinners);
    }

    /**
     * @dev Create a new crossword with ERC20 token prize pool (anyone can call)
     */
    function createCrosswordWithPrizePool(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy,
        uint256 maxWinners,
        address token,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external whenNotPaused {
        require(allowedTokens[token], ErrorMessages.TOKEN_NOT_ALLOWED);
        IERC20(token).safeTransferFrom(_msgSender(), address(this), prizePool);
        _createCrossword(crosswordId, name, crosswordData, sponsoredBy, token, prizePool, winnerPercentages, endTime, maxWinners);
    }

    function _createCrossword(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy,
        address token,
        uint256 prizePool,
        uint256[] memory winnerPercentages,
        uint256 endTime,
        uint256 maxWinners
    ) internal {
        require(crosswords[crosswordId].createdAt == 0, ErrorMessages.ALREADY_EXISTS);
        require(bytes(name).length > 0, "Name is required");
        require(bytes(crosswordData).length > 0, "Crossword data is required");
        require(maxWinners > 0 && maxWinners <= MAX_WINNERS, "Invalid max winners");
        
        if (winnerPercentages.length > 0) {
            require(winnerPercentages.length <= maxWinners, "Too many winner percentages");
            
            uint256 totalPercentage = 0;
            for (uint256 i = 0; i < winnerPercentages.length; i++) {
                require(winnerPercentages[i] <= CommonConstants.MAX_SINGLE_WINNER_PERCENTAGE, ErrorMessages.PERCENTAGE_TOO_HIGH);
                require(winnerPercentages[i] > 0, "Percentage must be > 0");
                totalPercentage += winnerPercentages[i];
            }
            require(totalPercentage <= CommonConstants.MAX_PERCENTAGE, ErrorMessages.TOTAL_GT_100);
        }
        
        if (endTime != 0) {
            ValidationLib.validateMaxValue(endTime, CommonConstants.MAX_END_TIME, ErrorMessages.END_TIME_TOO_FAR);
        }

        // Check creation fee if applicable
        if (creationFee > 0) {
            require(msg.value >= creationFee, "Insufficient creation fee");
            // Send creation fee to owner
            if (msg.value > creationFee) {
                // Refund excess
                (bool refundSuccess, ) = payable(_msgSender()).call{value: msg.value - creationFee}("");
                require(refundSuccess, "Refund failed");
            }
        } else if (msg.value > 0 && prizePool == 0) {
            // If no prize pool and no creation fee, refund any sent value
            (bool refundSuccess, ) = payable(_msgSender()).call{value: msg.value}("");
            require(refundSuccess, "Refund failed");
        }

        Crossword storage newCrossword = crosswords[crosswordId];
        newCrossword.name = name;
        newCrossword.sponsoredBy = sponsoredBy;
        newCrossword.crosswordData = crosswordData;
        newCrossword.token = token;
        newCrossword.totalPrizePool = prizePool;
        newCrossword.winnerPercentages = winnerPercentages;
        newCrossword.maxWinners = maxWinners;
        newCrossword.isActive = true; // Auto-activate upon creation
        newCrossword.isCompleted = false;
        newCrossword.createdAt = block.timestamp;
        newCrossword.activationTime = block.timestamp; // Set activation time to creation time
        newCrossword.endTime = endTime;
        newCrossword.creator = _msgSender();

        // Add to the list of all crosswords
        allCrosswordIds.push(crosswordId);

        emit CrosswordCreated(crosswordId, name, sponsoredBy, _msgSender(), block.timestamp);
    }

    /**
     * @dev Activate a crossword created by the user (anyone can activate if they have the right to)
     * For this implementation, we'll allow the creator to activate it
     */
    function activateCrossword(bytes32 crosswordId) external whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(!crossword.isActive, "Already active");
        require(_msgSender() == crossword.creator, "Only creator can activate");
        
        crossword.isActive = true;
        crossword.activationTime = block.timestamp;

        emit CrosswordActivated(crosswordId, block.timestamp);
    }

    /**
     * @dev Add funds to an existing crossword's prize pool
     */
    function fundPrizePool(bytes32 crosswordId) external payable whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.token == address(0), "Can only fund native CELO prize pools directly");
        
        crossword.totalPrizePool += msg.value;

        emit PrizePoolFunded(crosswordId, address(0), msg.value, _msgSender());
    }

    /**
     * @dev Allow funding via ERC20 tokens
     */
    function fundPrizePoolWithToken(bytes32 crosswordId, uint256 amount) external whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(crossword.token != address(0), "Crossword uses native CELO, not tokens");
        
        IERC20(crossword.token).safeTransferFrom(_msgSender(), address(this), amount);
        crossword.totalPrizePool += amount;

        emit PrizePoolFunded(crosswordId, crossword.token, amount, _msgSender());
    }

    /**
     * @dev Update crossword data (only creator can do this, and only if not yet active)
     */
    function updateCrosswordData(bytes32 crosswordId, string memory crosswordData) external whenNotPaused {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        require(_msgSender() == crossword.creator, "Only creator can update");
        require(!crossword.isActive, "Cannot update active crossword");
        
        crossword.crosswordData = crosswordData;

        emit CrosswordDataUpdated(crosswordId, crosswordData, _msgSender());
    }

    /**
     * @dev Get all crossword IDs
     */
    function getAllCrosswordIds() external view returns (bytes32[] memory) {
        return allCrosswordIds;
    }

    /**
     * @dev Get active crossword IDs
     */
    function getActiveCrosswordIds() external view returns (bytes32[] memory) {
        uint256 count = 0;
        // First count active crosswords
        for (uint256 i = 0; i < allCrosswordIds.length; i++) {
            if (crosswords[allCrosswordIds[i]].isActive) {
                count++;
            }
        }
        
        // Create result array
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCrosswordIds.length; i++) {
            if (crosswords[allCrosswordIds[i]].isActive) {
                result[index] = allCrosswordIds[i];
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get crossword details
     */
    function getCrosswordDetails(bytes32 crosswordId) external view returns (
        string memory name,
        string memory sponsoredBy,
        string memory crosswordData,
        address token,
        uint256 totalPrizePool,
        uint256 maxWinners,
        uint256[] memory winnerPercentages,
        uint256 activationTime,
        uint256 endTime,
        uint256 createdAt,
        bool isActive,
        bool isCompleted,
        address creator
    ) {
        Crossword storage crossword = crosswords[crosswordId];
        require(crossword.createdAt != 0, ErrorMessages.DOES_NOT_EXIST);
        
        name = crossword.name;
        sponsoredBy = crossword.sponsoredBy;
        crosswordData = crossword.crosswordData;
        token = crossword.token;
        totalPrizePool = crossword.totalPrizePool;
        maxWinners = crossword.maxWinners;
        winnerPercentages = crossword.winnerPercentages;
        activationTime = crossword.activationTime;
        endTime = crossword.endTime;
        createdAt = crossword.createdAt;
        isActive = crossword.isActive;
        isCompleted = crossword.isCompleted;
        creator = crossword.creator;
    }

    /**
     * @dev Set allowed tokens (only owner)
     */
    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
    }

    /**
     * @dev Set creation fee (only owner)
     */
    function setCreationFee(uint256 fee) external onlyOwner {
        creationFee = fee;
    }

    /**
     * @dev Withdraw creation fees (only owner)
     */
    function withdrawFees(address to, uint256 amount) external onlyOwner {
        (bool sent, ) = payable(to).call{value: amount}("");
        require(sent, "Withdrawal failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        // Allow receiving native CELO
    }
}