// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/CommonConstants.sol";
import "./libraries/ErrorMessages.sol";
import "./libraries/AccessControlLib.sol";

/**
 * @title UserProfiles
 * @dev Contract to manage user profiles for the Celo Crossword Learning App
 * Stores username, display name, profile picture URL, and other profile data.
 */
contract UserProfiles is Ownable, AccessControl, Pausable {
    // User profile structure
    struct UserProfile {
        string username;
        string displayName;
        string pfpUrl;
        uint256 timestamp;
        string bio; // Optional bio field
        string website; // Optional website field
    }

    // Events for profile management
    event ProfileUpdated(
        address indexed user,
        string username,
        string displayName,
        string pfpUrl,
        string bio,
        string website
    );
    event ProfileCleared(address indexed user, address clearedBy);

    // State variables
    mapping(address => UserProfile) public userProfiles;

    /**
     * @dev Constructor - sets deployer as owner
     */
    constructor(address initialAdmin) Ownable(initialAdmin) {
        // Grant default admin role to initial admin
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(AccessControlLib.ADMIN_ROLE, initialAdmin);
    }

    /**
     * @dev Update user profile
     * @param username The Farcaster username of the user
     * @param displayName The Farcaster display name of the user
     * @param pfpUrl The profile picture URL of the user
     * @param bio The user's bio
     * @param website The user's website URL
     */
    function updateProfile(
        string calldata username,
        string calldata displayName,
        string calldata pfpUrl,
        string calldata bio,
        string calldata website
    ) external whenNotPaused {
        ValidationLib.validateStringLengthMin(username, 1, ErrorMessages.USERPROFILES_INVALID_USERNAME);
        ValidationLib.validateStringLengthMax(username, CommonConstants.MAX_USERNAME_LENGTH, ErrorMessages.USERPROFILES_INVALID_USERNAME);
        ValidationLib.validateStringLengthMin(displayName, 1, ErrorMessages.USERPROFILES_INVALID_DISPLAY_NAME);
        ValidationLib.validateStringLengthMax(displayName, CommonConstants.MAX_DISPLAYNAME_LENGTH, ErrorMessages.USERPROFILES_INVALID_DISPLAY_NAME);
        ValidationLib.validateStringLengthMax(pfpUrl, CommonConstants.MAX_PFPURL_LENGTH, ErrorMessages.USERPROFILES_PFPURL_TOO_LONG);
        ValidationLib.validateStringLengthMax(bio, CommonConstants.MAX_BIO_LENGTH, ErrorMessages.BIO_TOO_LONG);
        ValidationLib.validateStringLengthMax(website, CommonConstants.MAX_WEBSITE_LENGTH, ErrorMessages.WEBSITE_TOO_LONG);

        userProfiles[msg.sender] = UserProfile({
            username: username,
            displayName: displayName,
            pfpUrl: pfpUrl,
            timestamp: block.timestamp,
            bio: bio,
            website: website
        });

        emit ProfileUpdated(msg.sender, username, displayName, pfpUrl, bio, website);
    }

    /**
     * @dev Get a user's profile
     * @param user The user address
     * @return username The Farcaster username
     * @return displayName The Farcaster display name
     * @return pfpUrl The profile picture URL
     * @return timestamp The timestamp of profile creation/update
     * @return bio The user's bio
     * @return website The user's website URL
     */
    function getUserProfile(address user) external view returns (
        string memory username,
        string memory displayName,
        string memory pfpUrl,
        uint256 timestamp,
        string memory bio,
        string memory website
    ) {
        UserProfile storage profile = userProfiles[user];
        return (
            profile.username,
            profile.displayName,
            profile.pfpUrl,
            profile.timestamp,
            profile.bio,
            profile.website
        );
    }

    /**
     * @dev Get the current user's profile
     * @return username The Farcaster username
     * @return displayName The Farcaster display name
     * @return pfpUrl The profile picture URL
     * @return timestamp The timestamp of profile creation/update
     * @return bio The user's bio
     * @return website The user's website URL
     */
    function getMyProfile() external view returns (
        string memory username,
        string memory displayName,
        string memory pfpUrl,
        uint256 timestamp,
        string memory bio,
        string memory website
    ) {
        UserProfile storage profile = userProfiles[msg.sender];
        return (
            profile.username,
            profile.displayName,
            profile.pfpUrl,
            profile.timestamp,
            profile.bio,
            profile.website
        );
    }

    /**
     * @dev Clear a user's profile (admin function)
     * @param user The user address to clear
     */
    function clearProfile(address user) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        delete userProfiles[user];
        emit ProfileCleared(user, _msgSender());
    }

    /**
     * @dev Check if a user has a profile
     * @param user The user address
     * @return True if the user has a profile, false otherwise
     */
    function hasProfile(address user) external view returns (bool) {
        return bytes(userProfiles[user].username).length > 0;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}