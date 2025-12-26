// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CommonConstants
 * @dev Library for common constants used across contracts
 */
library CommonConstants {
    // String length limits
    uint256 public constant MAX_USERNAME_LENGTH = 100;
    uint256 public constant MAX_DISPLAYNAME_LENGTH = 200;
    uint256 public constant MAX_PFPURL_LENGTH = 500;
    uint256 public constant MAX_BIO_LENGTH = 500;
    uint256 public constant MAX_WEBSITE_LENGTH = 200;
    
    // Prize distribution limits
    uint256 public constant MAX_CONFIGURABLE_WINNERS = 1000;
    uint256 public constant MAX_PERCENTAGE = 10000; // 100% represented as 10000 basis points
    uint256 public constant MAX_SINGLE_WINNER_PERCENTAGE = 8000; // 80% represented as 8000 basis points
    
    // Time limits
    uint256 public constant MAX_END_TIME = 30 days;
    uint256 public constant RECOVERY_WINDOW = 30 days;
    uint256 public constant MAX_COMPLETIONS_PER_CROSSWORD = 1000;
}