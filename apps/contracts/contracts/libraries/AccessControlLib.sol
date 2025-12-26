// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessControlLib
 * @dev Library for common access control operations
 */
library AccessControlLib {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    /**
     * @dev Checks if an account has the admin role or is the owner
     */
    function hasAdminOrOwnerAccess(Ownable ownableContract, IAccessControl accessControlContract, address account) internal view returns (bool) {
        return ownableContract.owner() == account || accessControlContract.hasRole(ADMIN_ROLE, account);
    }
    
    /**
     * @dev Checks if an account has the operator role
     */
    function hasOperatorRole(IAccessControl accessControlContract, address account) internal view returns (bool) {
        return accessControlContract.hasRole(OPERATOR_ROLE, account);
    }
    
    /**
     * @dev Validates that an account has admin or owner access
     */
    function validateAdminOrOwner(Ownable ownableContract, IAccessControl accessControlContract, address account, string memory errorMessage) internal view {
        require(hasAdminOrOwnerAccess(ownableContract, accessControlContract, account), errorMessage);
    }
}