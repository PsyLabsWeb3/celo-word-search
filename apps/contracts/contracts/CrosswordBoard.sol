// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/ErrorMessages.sol";

// Interfaces for the modular contracts
interface ICrosswordCore {
    function setCrossword(bytes32 crosswordId, string memory crosswordData) external;
    function getCurrentCrossword() external view returns (bytes32, string memory, uint256);
    function setSigner(address newSigner) external;
    function completeCrossword(uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl, bytes calldata signature) external;
    function userCompletedCrossword(bytes32 crosswordId, address user) external view returns (bool);
    function emergencyClearCrossword() external;
    function pause() external;
    function unpause() external;
}

interface ICrosswordPrizes {
    function createCrossword(bytes32 crosswordId, address token, uint256 prizePool, uint256[] calldata winnerPercentages, uint256 endTime) external payable;
    function activateCrossword(bytes32 crosswordId) external;
    function claimPrize(bytes32 crosswordId) external;
    function isWinner(bytes32 crosswordId, address user) external view returns (bool);
    function getUserRank(bytes32 crosswordId, address user) external view returns (uint256);
    function pause() external;
    function unpause() external;
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

    function completeCrossword(uint256 durationMs, string calldata username, string calldata displayName, string calldata pfpUrl, bytes calldata signature) external {
        crosswordCore.completeCrossword(durationMs, username, displayName, pfpUrl, signature);
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
        publicCrosswordManager.createCrosswordWithNativeCELOPrizePool{value: msg.value}(
            crosswordId, name, crosswordData, sponsoredBy, maxWinners, prizePool, winnerPercentages, endTime
        );
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
        publicCrosswordManager.createCrosswordWithPrizePool(
            crosswordId, name, crosswordData, sponsoredBy, maxWinners, token, prizePool, winnerPercentages, endTime
        );
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