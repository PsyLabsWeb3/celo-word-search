// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/ErrorMessages.sol";

// Interfaces for the modular contracts
interface ICrosswordCore {
    struct CrosswordCompletion {
        address user;
        uint256 completionTimestamp;
        uint256 durationMs;
    }
    function setCrossword(bytes32 crosswordId, string memory crosswordData) external;
    function getCurrentCrossword() external view returns (bytes32, string memory, uint256);
    function setSigner(address newSigner) external;
    function completeCrossword(bytes32 crosswordId, uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl, bytes calldata signature) external;
    function completeCrosswordForUser(address user, bytes32 crosswordId, uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl, bytes calldata signature) external;
    function userCompletedCrossword(bytes32 crosswordId, address user) external view returns (bool);
    function getCrosswordCompletions(bytes32 crosswordId) external view returns (CrosswordCompletion[] memory);
    function emergencyClearCrossword() external;
    function pause() external;
    function unpause() external;
}

interface ICrosswordPrizes {
    function createCrossword(bytes32 crosswordId, address token, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external payable;
    function createCrosswordWithoutValue(bytes32 crosswordId, address token, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external;
    function activateCrossword(bytes32 crosswordId) external;
    function claimPrize(bytes32 crosswordId) external;
    function isWinner(bytes32 crosswordId, address user) external view returns (bool);
    function getUserRank(bytes32 crosswordId, address user) external view returns (uint256);
    function recordCompletion(bytes32 crosswordId, address user) external returns (bool awardedPrize);
    function getCrosswordDetails(bytes32 crosswordId) external view returns (
        address token,
        uint256 totalPrizePool,
        uint256[] memory winnerPercentages,
        address[] memory winners,
        uint256 activationTime,
        uint256 endTime,
        uint8 state,  // 0=Inactive, 1=Active, 2=Complete
        bool isFinalized
    );
    function pause() external;
    function unpause() external;
    function grantOperatorRole(address operator) external;
    function receiveNativeCELOForCrossword(bytes32 crosswordId) external payable;
    function setFundingContract(address _fundingContract) external;
}

interface IUserProfiles {
    function updateProfile(string calldata username, string calldata displayName, string calldata pfpUrl, string calldata bio, string calldata website) external;
    function getUserProfile(address user) external view returns (string memory, string memory, string memory, uint256);
    function pause() external;
    function unpause() external;
}

interface IConfigManager {
    function getBoolConfigWithDefault(string calldata key, bool defaultValue) external view returns (bool);
    function pause() external;
    function unpause() external;
}

interface IAdminManager {
    function isAdminAddress(address addr) external view returns (bool);
    function pause() external;
    function unpause() external;
}

interface IPublicCrosswordManager {
    function createCrossword(bytes32 crosswordId, string memory name, string memory crosswordData, string memory sponsoredBy) external payable;
    function createCrosswordWithNativeCELOPrizePool(bytes32 crosswordId, string memory name, string memory crosswordData, string memory sponsoredBy, uint256 maxWinners, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external payable;
    function createCrosswordWithPrizePool(bytes32 crosswordId, string memory name, string memory crosswordData, string memory sponsoredBy, uint256 maxWinners, address token, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external;
    function activateCrossword(bytes32 crosswordId) external;
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
    );
    function getActiveCrosswordIds() external view returns (bytes32[] memory);
    function getAllCrosswordIds() external view returns (bytes32[] memory);
    function pause() external;
    function unpause() external;
}

/**
 * @title CrosswordBoard (Modularized Version)
 * @dev Coordinator contract for the modularized Celo Crossword Learning App
 * This contract coordinates between the modular contracts to provide unified functionality.
 */
contract CrosswordBoard is Ownable, ReentrancyGuard, Pausable {
    // Contract addresses
    ICrosswordCore public crosswordCore;
    ICrosswordPrizes public crosswordPrizes;
    IUserProfiles public userProfiles;
    IConfigManager public configManager;
    IAdminManager public adminManager;
    IPublicCrosswordManager public publicCrosswordManager;

    // Events
    event ContractsUpdated(address core, address prizes, address profiles, address config, address admin, address publicManager);

    /**
     * @dev Constructor - sets the addresses of the modular contracts
     */
    constructor(
        address _crosswordCore,
        address _crosswordPrizes,
        address _userProfiles,
        address _configManager,
        address _adminManager,
        address _publicCrosswordManager
    ) Ownable(msg.sender) {
        updateContractAddresses(
            _crosswordCore,
            _crosswordPrizes,
            _userProfiles,
            _configManager,
            _adminManager,
            _publicCrosswordManager
        );
    }

    /**
     * @dev Update the addresses of the modular contracts
     */
    function updateContractAddresses(
        address _crosswordCore,
        address _crosswordPrizes,
        address _userProfiles,
        address _configManager,
        address _adminManager,
        address _publicCrosswordManager
    ) public onlyOwner {
        ValidationLib.validateNonZeroAddress(_crosswordCore, ErrorMessages.CROSSWORDBOARD_CORE_ZERO);
        ValidationLib.validateNonZeroAddress(_crosswordPrizes, ErrorMessages.CROSSWORDBOARD_PRIZES_ZERO);
        ValidationLib.validateNonZeroAddress(_userProfiles, ErrorMessages.CROSSWORDBOARD_PROFILES_ZERO);
        ValidationLib.validateNonZeroAddress(_configManager, ErrorMessages.CROSSWORDBOARD_CONFIG_ZERO);
        ValidationLib.validateNonZeroAddress(_adminManager, ErrorMessages.CROSSWORDBOARD_ADMIN_ZERO);
        ValidationLib.validateNonZeroAddress(_publicCrosswordManager, ErrorMessages.CROSSWORDBOARD_ADMIN_ZERO); // Reusing error message

        crosswordCore = ICrosswordCore(_crosswordCore);
        crosswordPrizes = ICrosswordPrizes(_crosswordPrizes);
        userProfiles = IUserProfiles(_userProfiles);
        configManager = IConfigManager(_configManager);
        adminManager = IAdminManager(_adminManager);
        publicCrosswordManager = IPublicCrosswordManager(_publicCrosswordManager);

        emit ContractsUpdated(_crosswordCore, _crosswordPrizes, _userProfiles, _configManager, _adminManager, _publicCrosswordManager);
    }

    // Convenience functions that delegate to the appropriate contracts

    // Crossword Core Functions
    function setCrossword(bytes32 crosswordId, string memory crosswordData) external {
        crosswordCore.setCrossword(crosswordId, crosswordData);
    }

    function getCurrentCrossword() external view returns (bytes32, string memory, uint256) {
        return crosswordCore.getCurrentCrossword();
    }

    function setSigner(address newSigner) external {
        crosswordCore.setSigner(newSigner);
    }

    function completeCrossword(bytes32 crosswordId, uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl, bytes calldata signature) external {
        crosswordCore.completeCrosswordForUser(msg.sender, crosswordId, durationMs, username, displayName, pfpUrl, signature);
        // Record completion in prizes contract to determine if user is a winner
        bool awardedPrize = crosswordPrizes.recordCompletion(crosswordId, msg.sender);
        // If user was awarded a prize, they are a winner
        if (awardedPrize) {
            // User can now claim their prize manually via the leaderboard
        }
    }

    function userCompletedCrossword(bytes32 crosswordId, address user) external view returns (bool) {
        return crosswordCore.userCompletedCrossword(crosswordId, user);
    }

    function emergencyClearCrossword() external {
        crosswordCore.emergencyClearCrossword();
    }

    // Crossword Prizes Functions
    function createCrossword(bytes32 crosswordId, address token, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external payable {
        crosswordPrizes.createCrossword{value: msg.value}(crosswordId, token, prizePool, winnerPercentages, endTime);
    }

    function activateCrossword(bytes32 crosswordId) external {
        crosswordPrizes.activateCrossword(crosswordId);
    }

    function claimPrize(bytes32 crosswordId) external {
        crosswordPrizes.claimPrize(crosswordId);
    }

    function isWinner(bytes32 crosswordId, address user) external view returns (bool) {
        return crosswordPrizes.isWinner(crosswordId, user);
    }

    function getUserRank(bytes32 crosswordId, address user) external view returns (uint256) {
        return crosswordPrizes.getUserRank(crosswordId, user);
    }

    // Public Crossword Manager Functions
    function createPublicCrossword(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy
    ) external payable {
        publicCrosswordManager.createCrossword{value: msg.value}(crosswordId, name, crosswordData, sponsoredBy);

        // For crosswords without prize pools, we still need to ensure they exist in prizes contract
        // to track completions properly, but with zero prize pool
        try crosswordPrizes.createCrosswordWithoutValue(
            crosswordId, address(0), 0, new uint256[](0), 0
        ) {
            // If successful, activate it
            try crosswordPrizes.activateCrossword(crosswordId) {
                // Success
            } catch {
                // If activation fails, that's OK for no-prize crosswords
            }
        } catch {
            // If creating in prizes contract fails, that's OK - it might already exist
        }
    }

    function createPublicCrosswordWithNativeCELOPrizePool(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy,
        uint256 maxWinners,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external payable {
        require(msg.value == prizePool, "Value must equal prize pool");

        // Create the crossword in the public manager first (for tracking)
        publicCrosswordManager.createCrosswordWithNativeCELOPrizePool{value: 0}(
            crosswordId,
            name,
            crosswordData,
            sponsoredBy,
            maxWinners,
            prizePool,
            winnerPercentages,
            endTime
        );

        // Create the crossword in the prizes contract and fund it with the received value
        crosswordPrizes.createCrossword{value: msg.value}(
            crosswordId,
            address(0), // native CELO
            prizePool,
            winnerPercentages,
            endTime
        );

        // Activate the crossword in prizes contract to allow completions
        crosswordPrizes.activateCrossword(crosswordId);
    }

    /**
     * @dev Function to fund the CrosswordPrizes contract with native CELO for a specific crossword
     * @param crosswordId The ID of the crossword to fund
     */
    function fundCrosswordPrizes(bytes32 crosswordId) external payable onlyOwner whenNotPaused {
        crosswordPrizes.receiveNativeCELOForCrossword{value: msg.value}(crosswordId);
    }

    /**
     * @dev Function to set the funding contract for CrosswordPrizes (should be called by admin)
     * @param fundingContractAddr The address of the funding contract
     */
    function setFundingContractForPrizes(address fundingContractAddr) external onlyOwner whenNotPaused {
        crosswordPrizes.setFundingContract(fundingContractAddr);
    }

    function createPublicCrosswordWithPrizePool(
        bytes32 crosswordId,
        string memory name,
        string memory crosswordData,
        string memory sponsoredBy,
        uint256 maxWinners,
        address token,
        uint256 prizePool,
        uint256[] calldata winnerPercentages,
        uint256 endTime
    ) external {
        // Create the crossword in the public manager first (for tracking)
        publicCrosswordManager.createCrosswordWithPrizePool(
            crosswordId, name, crosswordData, sponsoredBy, maxWinners, token, prizePool, winnerPercentages, endTime
        );

        // Also create in prizes contract to track completions and prizes
        crosswordPrizes.createCrosswordWithoutValue(
            crosswordId, token, prizePool, winnerPercentages, endTime
        );

        // Activate the crossword in prizes contract to allow completions
        crosswordPrizes.activateCrossword(crosswordId);
    }

    function activatePublicCrossword(bytes32 crosswordId) external {
        publicCrosswordManager.activateCrossword(crosswordId);
    }

    function getPublicCrosswordDetails(bytes32 crosswordId) external view returns (
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
        return publicCrosswordManager.getCrosswordDetails(crosswordId);
    }

    function getActivePublicCrosswords() external view returns (bytes32[] memory) {
        return publicCrosswordManager.getActiveCrosswordIds();
    }

    function getAllPublicCrosswords() external view returns (bytes32[] memory) {
        return publicCrosswordManager.getAllCrosswordIds();
    }

    function getCompletedCrosswords() external view returns (bytes32[] memory) {
        bytes32[] memory allCrosswordIds = publicCrosswordManager.getAllCrosswordIds();
        bytes32[] memory completedCrosswords = new bytes32[](allCrosswordIds.length);
        uint256 completedCount = 0;

        for (uint256 i = 0; i < allCrosswordIds.length; i++) {
            try crosswordPrizes.getCrosswordDetails(allCrosswordIds[i]) returns (
                address,
                uint256,
                uint256[] memory,
                address[] memory,
                uint256,
                uint256,
                uint8 state,
                bool isFinalized
            ) {
                // Check if the crossword is complete in the prizes contract
                // State 2 corresponds to Complete (0=Inactive, 1=Active, 2=Complete)
                if (state == 2 || isFinalized) {
                    completedCrosswords[completedCount] = allCrosswordIds[i];
                    completedCount++;
                }
            } catch {
                // If the crossword doesn't exist in prizes contract, skip it
                continue;
            }
        }

        // Create result array with exact size
        bytes32[] memory result = new bytes32[](completedCount);
        for (uint256 i = 0; i < completedCount; i++) {
            result[i] = completedCrosswords[i];
        }

        return result;
    }

    /**
     * @dev Aggregated getCrosswordDetails for backward compatibility and easier frontend usage
     */
    function getCrosswordDetails(bytes32 crosswordId) external view returns (
        address token,
        uint256 totalPrizePool,
        uint256[] memory winnerPercentages,
        ICrosswordCore.CrosswordCompletion[] memory completions,
        uint256 activationTime,
        uint256 endTime,
        uint8 state,
        string memory name,
        string memory gridData,
        string memory sponsoredBy
    ) {
        // Get metadata from PublicCrosswordManager
        (name, sponsoredBy, gridData, , , , , , , , , , ) = publicCrosswordManager.getCrosswordDetails(crosswordId);

        // Get prize and state from CrosswordPrizes
        try crosswordPrizes.getCrosswordDetails(crosswordId) returns (
            address _token,
            uint256 _totalPrizePool,
            uint256[] memory _winnerPercentages,
            address[] memory,
            uint256 _activationTime,
            uint256 _endTime,
            uint8 _state,
            bool
        ) {
            token = _token;
            totalPrizePool = _totalPrizePool;
            winnerPercentages = _winnerPercentages;
            activationTime = _activationTime;
            endTime = _endTime;
            state = _state;
        } catch {
            // If not found in prizes, metadata fields might still hold partial info
            token = address(0);
            totalPrizePool = 0;
            activationTime = 0;
            endTime = 0;
            state = 0;
        }

        // Get completions from CrosswordCore
        completions = crosswordCore.getCrosswordCompletions(crosswordId);

        return (
            token,
            totalPrizePool,
            winnerPercentages,
            completions,
            activationTime,
            endTime,
            state,
            name,
            gridData,
            sponsoredBy
        );
    }

    // User Profile Functions
    function updateProfile(string calldata username, string calldata displayName, string calldata pfpUrl, string calldata bio, string calldata website) external {
        userProfiles.updateProfile(username, displayName, pfpUrl, bio, website);
    }

    // Config Management Functions
    function isReturnHomeButtonVisible() external view returns (bool) {
        return configManager.getBoolConfigWithDefault("home_button_visible", true);
    }

    // Admin Management Functions
    function isAdminAddress(address addr) external view returns (bool) {
        return adminManager.isAdminAddress(addr);
    }

    // Pause/Unpause - all contracts
    function pauseAll() external {
        require(adminManager.isAdminAddress(msg.sender), ErrorMessages.CROSSWORDBOARD_NOT_ADMIN);
        crosswordCore.pause();
        crosswordPrizes.pause();
        userProfiles.pause();
        configManager.pause();
        adminManager.pause();
        publicCrosswordManager.pause();
    }

    function unpauseAll() external {
        require(adminManager.isAdminAddress(msg.sender), ErrorMessages.CROSSWORDBOARD_NOT_ADMIN);
        crosswordCore.unpause();
        crosswordPrizes.unpause();
        userProfiles.unpause();
        configManager.unpause();
        adminManager.unpause();
        publicCrosswordManager.unpause();
    }

    // Fallback function to accept native CELO
    receive() external payable {
        // Funds received are assumed to be for prize pools and handled by the prizes contract
    }
}