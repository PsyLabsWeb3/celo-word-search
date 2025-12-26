// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./libraries/ValidationLib.sol";
import "./libraries/ErrorMessages.sol";
import "./libraries/AccessControlLib.sol";

/**
 * @title AdminManager
 * @dev Contract to manage admin roles for the Celo Crossword Learning App
 * Provides functionality to add, remove, and check admin roles.
 */
contract AdminManager is Ownable, AccessControl, Pausable {

    // Events for admin management
    event AdminAdded(address indexed admin, address addedBy);
    event AdminRemoved(address indexed admin, address removedBy);

    // State variables for admin management
    mapping(address => bool) public isAdmin;
    address[] public admins;

    /**
     * @dev Constructor - sets deployer as owner and first admin
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        isAdmin[initialOwner] = true;
        admins.push(initialOwner);

        // Grant default admin role to initial owner
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(AccessControlLib.ADMIN_ROLE, initialOwner);
        _grantRole(AccessControlLib.OPERATOR_ROLE, initialOwner);
    }

    /**
     * @dev Add an admin address
     * @param newAdmin The address to add as an admin
     */
    function addAdmin(address newAdmin) external onlyOwner whenNotPaused {
        ValidationLib.validateNonZeroAddress(newAdmin, ErrorMessages.ADMINMANAGER_ZERO_ADDRESS);
        require(!isAdmin[newAdmin], ErrorMessages.ADMINMANAGER_ALREADY_EXISTS);

        isAdmin[newAdmin] = true;
        admins.push(newAdmin);

        // Grant admin roles to the new admin
        _grantRole(AccessControlLib.ADMIN_ROLE, newAdmin);
        _grantRole(AccessControlLib.OPERATOR_ROLE, newAdmin);

        emit AdminAdded(newAdmin, _msgSender());
    }

    /**
     * @dev Remove an admin address
     * @param adminToRemove The address to remove from admins
     */
    function removeAdmin(address adminToRemove) external onlyOwner whenNotPaused {
        require(isAdmin[adminToRemove], ErrorMessages.ADMINMANAGER_DOES_NOT_EXIST);
        require(adminToRemove != owner(), ErrorMessages.ADMINMANAGER_CANNOT_REMOVE_OWNER);

        isAdmin[adminToRemove] = false;

        // Remove from admins array
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == adminToRemove) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                break;
            }
        }

        // Revoke admin roles from the removed admin
        _revokeRole(AccessControlLib.ADMIN_ROLE, adminToRemove);
        _revokeRole(AccessControlLib.OPERATOR_ROLE, adminToRemove);

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
     * @dev Add an operator role (can perform certain operations)
     * @param operator The address to grant operator role
     */
    function addOperator(address operator) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        ValidationLib.validateNonZeroAddress(operator, ErrorMessages.OPERATOR_ZERO_ADDRESS);
        _grantRole(AccessControlLib.OPERATOR_ROLE, operator);
    }

    /**
     * @dev Remove an operator role
     * @param operator The address to revoke operator role
     */
    function removeOperator(address operator) external onlyRole(AccessControlLib.ADMIN_ROLE) {
        _revokeRole(AccessControlLib.OPERATOR_ROLE, operator);
    }

    /**
     * @dev Check if an address has operator role
     * @param account The address to check
     * @return bool True if the address has operator role
     */
    function isOperator(address account) external view returns (bool) {
        return hasRole(AccessControlLib.OPERATOR_ROLE, account);
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