// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ValidationLib
 * @dev Library for common validation functions
 */
library ValidationLib {
    /**
     * @dev Validates that an address is not zero
     */
    function validateNonZeroAddress(address addr, string memory errorMessage) internal pure {
        require(addr != address(0), errorMessage);
    }

    /**
     * @dev Validates string length is within bounds
     */
    function validateStringLength(string memory str, uint256 minLength, uint256 maxLength, string memory errorMessage) internal pure {
        uint256 len = bytes(str).length;
        require(len >= minLength && len <= maxLength, errorMessage);
    }

    /**
     * @dev Validates string length is within bounds (only minimum)
     */
    function validateStringLengthMin(string memory str, uint256 minLength, string memory errorMessage) internal pure {
        uint256 len = bytes(str).length;
        require(len >= minLength, errorMessage);
    }

    /**
     * @dev Validates string length is within bounds (only maximum)
     */
    function validateStringLengthMax(string memory str, uint256 maxLength, string memory errorMessage) internal pure {
        uint256 len = bytes(str).length;
        require(len <= maxLength, errorMessage);
    }

    /**
     * @dev Validates uint256 value is greater than zero
     */
    function validateGreaterThanZero(uint256 value, string memory errorMessage) internal pure {
        require(value > 0, errorMessage);
    }

    /**
     * @dev Validates uint256 value is within bounds
     */
    function validateRange(uint256 value, uint256 minValue, uint256 maxValue, string memory errorMessage) internal pure {
        require(value >= minValue && value <= maxValue, errorMessage);
    }

    /**
     * @dev Validates uint256 value is within bounds (only minimum)
     */
    function validateMinValue(uint256 value, uint256 minValue, string memory errorMessage) internal pure {
        require(value >= minValue, errorMessage);
    }

    /**
     * @dev Validates uint256 value is within bounds (only maximum)
     */
    function validateMaxValue(uint256 value, uint256 maxValue, string memory errorMessage) internal pure {
        require(value <= maxValue, errorMessage);
    }
}