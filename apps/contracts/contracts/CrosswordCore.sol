// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/CryptoLib.sol";
import "./libraries/CommonConstants.sol";
import "./libraries/ErrorMessages.sol";
import "./libraries/AccessControlLib.sol";

/**
 * @title CrosswordCore (Light Version)
 * @dev Core contract to store and manage crosswords
 */
contract CrosswordCore is Ownable, AccessControl, ReentrancyGuard, Pausable {
    using Strings for uint256;

    event CrosswordUpdated(bytes32 indexed crosswordId, string crosswordData, address updatedBy);
    event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs);

    struct CrosswordCompletion {
        address user;
        uint256 completionTimestamp;
        uint256 durationMs;
    }

    struct UserProfile {
        string username;
        string displayName;
        string pfpUrl;
        uint256 timestamp;
    }

    bytes32 public currentCrosswordId;
    string public currentCrosswordData;
    uint256 public lastUpdateTime;

    mapping(bytes32 => CrosswordCompletion[]) public crosswordCompletions;
    mapping(bytes32 => mapping(address => bool)) public hasCompletedCrossword;
    mapping(address => UserProfile) public userProfiles;

    address public signer;

    modifier onlyAdminOrOwner() {
        AccessControlLib.validateAdminOrOwner(Ownable(this), AccessControl(this), _msgSender(), ErrorMessages.NOT_OWNER_OR_ADMIN);
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(AccessControlLib.ADMIN_ROLE, initialOwner);
        _grantRole(AccessControlLib.OPERATOR_ROLE, initialOwner);
    }

    function setCrossword(bytes32 crosswordId, string memory crosswordData) external onlyAdminOrOwner whenNotPaused {
        ValidationLib.validateStringLengthMin(crosswordData, 1, ErrorMessages.DATA_EMPTY);
        currentCrosswordId = crosswordId;
        currentCrosswordData = crosswordData;
        lastUpdateTime = block.timestamp;
        emit CrosswordUpdated(crosswordId, crosswordData, _msgSender());
    }

    function getCurrentCrossword() external view returns (bytes32, string memory, uint256) {
        return (currentCrosswordId, currentCrosswordData, lastUpdateTime);
    }

    function setSigner(address newSigner) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        ValidationLib.validateNonZeroAddress(newSigner, ErrorMessages.ZERO_ADDRESS);
        signer = newSigner;
    }

    function completeCrossword(
        uint256 durationMs,
        string calldata username,
        string calldata displayName,
        string calldata pfpUrl,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        ValidationLib.validateNonZeroAddress(msg.sender, ErrorMessages.INVALID_SENDER);
        bytes32 crosswordId = currentCrosswordId;
        require(!hasCompletedCrossword[crosswordId][msg.sender], ErrorMessages.ALREADY_COMPLETED);
        require(crosswordId != bytes32(0), ErrorMessages.NO_CROSSWORD);
        ValidationLib.validateGreaterThanZero(durationMs, ErrorMessages.DURATION_GT_ZERO);

        ValidationLib.validateStringLengthMin(username, 1, ErrorMessages.INVALID_USERNAME);
        ValidationLib.validateStringLengthMax(username, CommonConstants.MAX_USERNAME_LENGTH, ErrorMessages.INVALID_USERNAME);

        ValidationLib.validateStringLengthMin(displayName, 1, ErrorMessages.INVALID_DISPLAY_NAME);
        ValidationLib.validateStringLengthMax(displayName, CommonConstants.MAX_DISPLAYNAME_LENGTH, ErrorMessages.INVALID_DISPLAY_NAME);

        ValidationLib.validateStringLengthMax(pfpUrl, CommonConstants.MAX_PFPURL_LENGTH, ErrorMessages.PFPURL_TOO_LONG);

        address _signer = signer;
        ValidationLib.validateNonZeroAddress(_signer, ErrorMessages.SIGNER_NOT_SET);

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, crosswordId, durationMs, address(this)));

        CryptoLib.recoverSigner(messageHash, signature, _signer, ErrorMessages.INVALID_SIGNATURE);

        require(crosswordCompletions[crosswordId].length < CommonConstants.MAX_COMPLETIONS_PER_CROSSWORD, ErrorMessages.MAX_COMPLETIONS);

        crosswordCompletions[crosswordId].push(CrosswordCompletion({
            user: msg.sender,
            completionTimestamp: block.timestamp,
            durationMs: durationMs
        }));

        hasCompletedCrossword[crosswordId][msg.sender] = true;

        userProfiles[msg.sender] = UserProfile({
            username: username,
            displayName: displayName,
            pfpUrl: pfpUrl,
            timestamp: block.timestamp
        });

        emit CrosswordCompleted(crosswordId, msg.sender, block.timestamp, durationMs);
    }

    function getCrosswordCompletions(bytes32 crosswordId) external view returns (CrosswordCompletion[] memory) {
        return crosswordCompletions[crosswordId];
    }

    function userCompletedCrossword(bytes32 crosswordId, address user) external view returns (bool) {
        return hasCompletedCrossword[crosswordId][user];
    }

    function getUserProfile(address user) external view returns (string memory, string memory, string memory, uint256) {
        UserProfile storage profile = userProfiles[user];
        return (profile.username, profile.displayName, profile.pfpUrl, profile.timestamp);
    }

    function emergencyClearCrossword() external onlyOwner {
        currentCrosswordId = bytes32(0);
        currentCrosswordData = "";
        lastUpdateTime = block.timestamp;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}