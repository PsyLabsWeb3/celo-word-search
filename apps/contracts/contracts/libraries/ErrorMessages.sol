// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ErrorMessages
 * @dev Library for standard error messages
 */
library ErrorMessages {
    // Validation errors
    string public constant ZERO_ADDRESS = "Zero address";
    string public constant INVALID_SENDER = "Invalid sender";
    string public constant VALUE_MISMATCH = "Value mismatch";
    string public constant PRIZE_GT_ZERO = "Prize > 0";
    string public constant DURATION_GT_ZERO = "Duration > 0";
    string public constant DATA_EMPTY = "Data empty";
    string public constant ALREADY_EXISTS = "Already exists";
    string public constant DOES_NOT_EXIST = "Does not exist";
    string public constant ALREADY_COMPLETED = "Already completed";
    string public constant NO_CROSSWORD = "No crossword";
    string public constant SIGNER_NOT_SET = "Signer not set";
    string public constant MAX_COMPLETIONS = "Max completions";
    string public constant INSUFFICIENT_BALANCE = "Insufficient balance";
    string public constant TRANSFER_FAILED = "Transfer failed";
    string public constant INVALID_SIGNATURE = "Invalid signature";
    string public constant INVALID_RANK = "Invalid rank";
    string public constant WINDOW_NOT_ELAPSED = "Window not elapsed";
    string public constant TOO_MANY_WINNERS = "Too many winners";
    string public constant PERCENTAGE_TOO_HIGH = "Percentage too high";
    string public constant TOTAL_GT_100 = "Total > 100%";
    string public constant END_TIME_TOO_FAR = "End time too far";
    string public constant MAX_EXCEEDS_LIMIT = "Max exceeds limit";
    string public constant ALREADY_CLAIMED = "Already claimed";
    string public constant NOT_A_WINNER = "Not a winner";
    string public constant NOT_OWNER_OR_ADMIN = "Not owner or admin";
    string public constant NOT_ACTIVE_COMPLETE = "Not active/complete";
    string public constant DEADLINE_PASSED = "Deadline passed";
    string public constant TOKEN_NOT_ALLOWED = "Token not allowed";
    string public constant PRIZE_POOL_GT_ZERO = "Prize > 0";
    
    string public constant INVALID_END_TIME = "Invalid end time";
    
    // String validation errors
    string public constant INVALID_USERNAME = "Invalid username";
    string public constant INVALID_DISPLAY_NAME = "Invalid display name";
    string public constant PFPURL_TOO_LONG = "Pfp URL too long";
    string public constant BIO_TOO_LONG = "bio too long";
    string public constant WEBSITE_TOO_LONG = "website too long";
    
    // UserProfiles specific errors
    string public constant USERPROFILES_INVALID_USERNAME = "UserProfiles: invalid username length";
    string public constant USERPROFILES_INVALID_DISPLAY_NAME = "UserProfiles: invalid display name length";
    string public constant USERPROFILES_PFPURL_TOO_LONG = "UserProfiles: pfpUrl too long";
    
    // AdminManager specific errors
    string public constant ADMINMANAGER_ZERO_ADDRESS = "AdminManager: admin address cannot be zero";
    string public constant ADMINMANAGER_ALREADY_EXISTS = "AdminManager: admin already exists";
    string public constant ADMINMANAGER_DOES_NOT_EXIST = "AdminManager: admin does not exist";
    string public constant ADMINMANAGER_CANNOT_REMOVE_OWNER = "AdminManager: cannot remove owner";
    string public constant OPERATOR_ZERO_ADDRESS = "AdminManager: operator address cannot be zero";
    
    // CrosswordBoard specific errors
    string public constant CROSSWORDBOARD_CORE_ZERO = "CrosswordBoard: core address cannot be zero";
    string public constant CROSSWORDBOARD_PRIZES_ZERO = "CrosswordBoard: prizes address cannot be zero";
    string public constant CROSSWORDBOARD_PROFILES_ZERO = "CrosswordBoard: profiles address cannot be zero";
    string public constant CROSSWORDBOARD_CONFIG_ZERO = "CrosswordBoard: config address cannot be zero";
    string public constant CROSSWORDBOARD_ADMIN_ZERO = "CrosswordBoard: admin address cannot be zero";
    string public constant CROSSWORDBOARD_NOT_ADMIN = "CrosswordBoard: caller is not an admin";
}