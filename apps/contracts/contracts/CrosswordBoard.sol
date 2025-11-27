// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./CrosswordPrizes.sol";
import "./Config.sol";

/**
 * @title CrosswordBoard
 * @dev Contract to store and manage crosswords for the Celo Crossword Learning App
 * This contract stores the current crossword data, manages completions, and integrates
 * with the CrosswordPrizes contract for automatic prize distribution
 */
contract CrosswordBoard is Ownable, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    // Events
    event CrosswordUpdated(bytes32 indexed crosswordId, string crosswordData, address updatedBy);
    event CrosswordCompleted(
        bytes32 indexed crosswordId,
        address indexed user,
        uint256 timestamp,
        uint256 durationMs
    );
    event AdminAdded(address indexed admin, address addedBy);
    event AdminRemoved(address indexed admin, address removedBy);
    event PrizesContractSet(address indexed prizesContract);

    // Structures
    struct UserProfile {
        string username;
        string displayName;
        string pfpUrl;
        uint256 timestamp;
    }

    struct CrosswordCompletion {
        address user;
        uint256 completionTimestamp;
        uint256 durationMs;
    }

    // State variables
    bytes32 public currentCrosswordId;
    string public currentCrosswordData;
    uint256 public lastUpdateTime;

    // Reference to CrosswordPrizes contract
    CrosswordPrizes public prizesContract;

    // Reference to Config contract for application settings
    Config public configContract;

    // Configuration key for max winners only
    string public constant MAX_WINNERS_CONFIG = "max_winners";

    // Completions tracking
    mapping(bytes32 => CrosswordCompletion[]) public crosswordCompletions;
    mapping(bytes32 => mapping(address => bool)) public hasCompletedCrossword;

    // User profiles
    mapping(address => UserProfile) public userProfiles;

    // Admin management
    mapping(address => bool) public isAdmin;
    address[] public admins;

    // Modifiers
    modifier onlyAdminOrOwner() {
        require(
            owner() == _msgSender() || isAdmin[_msgSender()] || hasRole(ADMIN_ROLE, _msgSender()),
            "CrosswordBoard: caller is not the owner or an admin"
        );
        _;
    }

    /**
     * @dev Constructor - sets deployer as owner and first admin
     */
    constructor(address initialOwner, address _prizesContract, address _configContract) Ownable(initialOwner) {
        isAdmin[initialOwner] = true;
        admins.push(initialOwner);
        prizesContract = CrosswordPrizes(_prizesContract);
        configContract = Config(_configContract);

        // Grant default admin role to initial owner
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(OPERATOR_ROLE, initialOwner);
    }

    /**
     * @dev Set the CrosswordPrizes contract address
     * @param _prizesContract Address of the CrosswordPrizes contract
     */
    function setPrizesContract(address _prizesContract) external onlyOwner {
        require(_prizesContract != address(0), "CrosswordBoard: prizes contract cannot be zero address");
        prizesContract = CrosswordPrizes(_prizesContract);
        emit PrizesContractSet(_prizesContract);
    }

    /**
     * @dev Set the Config contract address
     * @param _configContract Address of the Config contract
     */
    function setConfigContract(address _configContract) external onlyOwner {
        require(_configContract != address(0), "CrosswordBoard: config contract cannot be zero address");
        configContract = Config(_configContract);
    }

    /**
     * @dev Set a new crossword for all users to see
     * @param crosswordId Unique identifier for the crossword
     * @param crosswordData JSON string containing the crossword grid and clues
     */
    function setCrossword(bytes32 crosswordId, string memory crosswordData)
        external
        onlyAdminOrOwner
        nonReentrant
        whenNotPaused
    {
        require(bytes(crosswordData).length > 0, "CrosswordBoard: crossword data cannot be empty");

        currentCrosswordId = crosswordId;
        currentCrosswordData = crosswordData;
        lastUpdateTime = block.timestamp;

        emit CrosswordUpdated(crosswordId, crosswordData, _msgSender());
    }

    /**
     * @dev Get the current crossword data
     * @return crosswordId The ID of the current crossword
     * @return crosswordData The JSON string of the current crossword
     * @return updatedAt The timestamp when the crossword was last updated
     */
    function getCurrentCrossword()
        external
        view
        returns (
            bytes32 crosswordId,
            string memory crosswordData,
            uint256 updatedAt
        )
    {
        return (
            currentCrosswordId,
            currentCrosswordData,
            lastUpdateTime
        );
    }

    /**
     * @dev Add a new admin
     * @param newAdmin Address to add as admin
     */
    function addAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "CrosswordBoard: admin address cannot be zero");
        require(!isAdmin[newAdmin], "CrosswordBoard: admin already exists");

        isAdmin[newAdmin] = true;
        admins.push(newAdmin);

        emit AdminAdded(newAdmin, _msgSender());
    }

    /**
     * @dev Remove an admin
     * @param adminToRemove Address to remove from admins
     */
    function removeAdmin(address adminToRemove) external onlyOwner {
        require(isAdmin[adminToRemove], "CrosswordBoard: admin does not exist");
        require(adminToRemove != owner(), "CrosswordBoard: cannot remove owner");

        isAdmin[adminToRemove] = false;

        // Remove from admins array
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == adminToRemove) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                break;
            }
        }

        emit AdminRemoved(adminToRemove, _msgSender());
    }

    /**
     * @dev Get all admin addresses
     * @return Array of admin addresses
     */
    function getAdmins() external view returns (address[] memory) {
        return admins;
    }

    /**
     * @dev Check if an address is an admin
     * @param addr Address to check
     * @return bool True if the address is an admin
     */
    function isAdminAddress(address addr) external view returns (bool) {
        return isAdmin[addr];
    }

    /**
     * @dev Emergency function to clear crossword data if needed
     * Callable only by owner for emergency purposes
     */
    function emergencyClearCrossword() external onlyOwner {
        currentCrosswordId = bytes32(0);
        currentCrosswordData = "";
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Pause the contract in case of emergency
     * Callable only by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     * Callable only by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Complete a crossword for the current user and potentially receive a prize
     * @param durationMs The time taken to complete the crossword in milliseconds
     * @param username The Farcaster username of the user
     * @param displayName The Farcaster display name of the user
     * @param pfpUrl The profile picture URL of the user
     */
    function completeCrossword(uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl) external nonReentrant whenNotPaused {
        // Verify user is connected (msg.sender is not zero address)
        require(msg.sender != address(0), "CrosswordBoard: invalid sender");

        bytes32 crosswordId = currentCrosswordId;

        // Check if user already completed this crossword
        require(!hasCompletedCrossword[crosswordId][msg.sender], "CrosswordBoard: already completed this crossword");

        // Check that we have a current crossword
        require(crosswordId != bytes32(0), "CrosswordBoard: no active crossword");

        // Verify that duration is greater than 0
        require(durationMs > 0, "CrosswordBoard: duration must be greater than 0");

        // Add completion record with blockchain timestamp
        crosswordCompletions[crosswordId].push(CrosswordCompletion({
            user: msg.sender,
            completionTimestamp: block.timestamp,
            durationMs: durationMs
        }));

        // Store or update user profile
        userProfiles[msg.sender] = UserProfile({
            username: username,
            displayName: displayName,
            pfpUrl: pfpUrl,
            timestamp: block.timestamp
        });

        // Mark that user has completed this crossword
        hasCompletedCrossword[crosswordId][msg.sender] = true;

        // Try to record completion in prizes contract - this will automatically distribute prizes
        // to the first N finishers if the prizes contract is active for this crossword
        try prizesContract.recordCompletion(crosswordId, msg.sender) {
            // Prize distribution handled by the prizes contract
        } catch {
            // If there was an error with the prizes contract, continue with just the completion
            // This ensures the core functionality still works even if prizes are temporarily unavailable
        }

        emit CrosswordCompleted(crosswordId, msg.sender, block.timestamp, durationMs);
    }

    /**
     * @dev Get completions for a specific crossword
     * @param crosswordId The ID of the crossword
     * @return Array of completion records
     */
    function getCrosswordCompletions(bytes32 crosswordId) external view returns (CrosswordCompletion[] memory) {
        return crosswordCompletions[crosswordId];
    }

    /**
     * @dev Get the number of completions for a specific crossword
     * @param crosswordId The ID of the crossword
     * @return Number of completions
     */
    function getCompletionsCount(bytes32 crosswordId) external view returns (uint256) {
        return crosswordCompletions[crosswordId].length;
    }

    /**
     * @dev Check if a user has completed a specific crossword
     * @param crosswordId The ID of the crossword
     * @param user The address of the user
     * @return Boolean indicating if user completed the crossword
     */
    function userCompletedCrossword(bytes32 crosswordId, address user) external view returns (bool) {
        return hasCompletedCrossword[crosswordId][user];
    }

    /**
     * @dev Get user profile information
     * @param user The address of the user
     * @return username The Farcaster username
     * @return displayName The Farcaster display name
     * @return pfpUrl The profile picture URL
     * @return timestamp The timestamp when profile was updated
     */
    function getUserProfile(address user) external view returns (string memory username, string memory displayName, string memory pfpUrl, uint256 timestamp) {
        UserProfile memory profile = userProfiles[user];
        return (profile.username, profile.displayName, profile.pfpUrl, profile.timestamp);
    }

    /**
     * @dev Get whether the return home button should be visible
     * @return bool Whether the return home button is visible (always true now)
     */
    function isReturnHomeButtonVisible() external pure returns (bool) {
        // Always return true since we're removing this configuration option
        return true;
    }

    /**
     * @dev Get the maximum number of winners configured in the system
     * @return uint256 The maximum number of winners allowed
     */
    function getMaxWinnersConfig() external view returns (uint256) {
        if (address(configContract) != address(0)) {
            // Use the config contract to check the setting with default value of 3
            return configContract.getUIntConfigWithDefault(MAX_WINNERS_CONFIG, 3);
        } else {
            // If no config contract, fall back to the CrosswordPrizes contract's setting
            return prizesContract.getMaxWinners();
        }
    }

    /**
     * @dev Set the maximum number of winners through the config contract
     * @param newMaxWinners The new maximum number of winners
     */
    function setMaxWinnersConfig(uint256 newMaxWinners) external onlyRole(ADMIN_ROLE) {
        require(address(configContract) != address(0), "Config contract not set");
        configContract.setUIntConfig(MAX_WINNERS_CONFIG, newMaxWinners);

        // Also update the prizes contract to maintain consistency
        prizesContract.setMaxWinners(newMaxWinners);
    }

    /**
     * @dev Set both crossword and maximum number of winners in a single transaction
     * @param crosswordId Unique identifier for the crossword
     * @param crosswordData JSON string containing the crossword grid and clues
     * @param newMaxWinners The new maximum number of winners
     */
    function setCrosswordAndMaxWinners(
        bytes32 crosswordId,
        string memory crosswordData,
        uint256 newMaxWinners
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
        require(bytes(crosswordData).length > 0, "CrosswordBoard: crossword data cannot be empty");
        require(newMaxWinners > 0, "CrosswordBoard: max winners must be greater than 0");
        require(newMaxWinners <= 10, "CrosswordBoard: max winners exceeds limit of 10");

        // Set the crossword first
        currentCrosswordId = crosswordId;
        currentCrosswordData = crosswordData;
        lastUpdateTime = block.timestamp;

        // Update max winners in both contracts to maintain consistency
        // First, update the config contract if it exists
        if (address(configContract) != address(0)) {
            configContract.setUIntConfig(MAX_WINNERS_CONFIG, newMaxWinners);
        }

        // Always update the prizes contract as well to ensure consistency
        prizesContract.setMaxWinners(newMaxWinners);

        emit CrosswordUpdated(crosswordId, crosswordData, _msgSender());
    }

}