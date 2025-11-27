// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Config
 * @dev Contract to store application configuration settings
 * Allows admins to configure various UI and application parameters
 */
contract Config is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Configuration keys for various settings
    string public constant HOME_BUTTON_VISIBLE = "home_button_visible";
    string public constant MAX_WINNERS_CONFIG = "max_winners";

    // Store configuration values as strings to support different types
    mapping(string => string) private _configValues;
    mapping(string => bool) private _configBools;
    mapping(string => uint256) private _configUInts;

    event ConfigSet(string indexed key, string value, address setter);
    event ConfigBoolSet(string indexed key, bool value, address setter);
    event ConfigUIntSet(string indexed key, uint256 value, address setter);

    /**
     * @dev Constructor - sets up roles and initial admin
     */
    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(OPERATOR_ROLE, initialAdmin);
    }

    /**
     * @dev Set a string configuration value
     * @param key The configuration key
     * @param value The string value to store
     */
    function setStringConfig(string calldata key, string calldata value) external onlyRole(ADMIN_ROLE) whenNotPaused {
        _configValues[key] = value;
        emit ConfigSet(key, value, _msgSender());
    }

    /**
     * @dev Set a boolean configuration value
     * @param key The configuration key
     * @param value The boolean value to store
     */
    function setBoolConfig(string calldata key, bool value) external onlyRole(ADMIN_ROLE) whenNotPaused {
        _configBools[key] = value;
        emit ConfigBoolSet(key, value, _msgSender());
    }

    /**
     * @dev Set a uint256 configuration value
     * @param key The configuration key
     * @param value The uint256 value to store
     */
    function setUIntConfig(string calldata key, uint256 value) external onlyRole(ADMIN_ROLE) whenNotPaused {
        _configUInts[key] = value;
        // Also set the config value string to indicate the key exists (avoiding default value)
        _configValues[key] = Strings.toString(value);
        emit ConfigUIntSet(key, value, _msgSender());
    }

    /**
     * @dev Get a string configuration value
     * @param key The configuration key
     * @return The string value
     */
    function getStringConfig(string calldata key) external view returns (string memory) {
        return _configValues[key];
    }

    /**
     * @dev Get a boolean configuration value
     * @param key The configuration key
     * @return The boolean value
     */
    function getBoolConfig(string calldata key) external view returns (bool) {
        return _configBools[key];
    }

    /**
     * @dev Get a uint256 configuration value
     * @param key The configuration key
     * @return The uint256 value
     */
    function getUIntConfig(string calldata key) external view returns (uint256) {
        return _configUInts[key];
    }

    /**
     * @dev Check if a boolean config exists and get its value with a default
     * @param key The configuration key
     * @param defaultValue The default value if key doesn't exist
     * @return The boolean value (stored or default)
     */
    function getBoolConfigWithDefault(string calldata key, bool defaultValue) external view returns (bool) {
        if (bytes(_configValues[key]).length == 0) {
            return defaultValue;
        }
        return _configBools[key];
    }

    /**
     * @dev Check if a uint config exists and get its value with a default
     * @param key The configuration key
     * @param defaultValue The default value if key doesn't exist
     * @return The uint256 value (stored or default)
     */
    function getUIntConfigWithDefault(string calldata key, uint256 defaultValue) external view returns (uint256) {
        if (bytes(_configValues[key]).length == 0) {
            return defaultValue;
        }
        return _configUInts[key];
    }

    /**
     * @dev Set default configurations
     * This can be called once by admin to set initial values
     */
    function setDefaultConfigurations() external onlyRole(ADMIN_ROLE) {
        // Set default visibility for return home button to true
        if (bytes(_configValues[HOME_BUTTON_VISIBLE]).length == 0) {
            _configBools[HOME_BUTTON_VISIBLE] = true; // Default to visible
            emit ConfigBoolSet(HOME_BUTTON_VISIBLE, true, _msgSender());
        }
        
        // Set default max winners to 3
        if (bytes(_configValues[MAX_WINNERS_CONFIG]).length == 0) {
            _configUInts[MAX_WINNERS_CONFIG] = 3; // Default to 3
            emit ConfigUIntSet(MAX_WINNERS_CONFIG, 3, _msgSender());
        }
    }

    /**
     * @dev Pause function to stop all config updates
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}