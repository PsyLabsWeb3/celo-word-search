// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CryptoLib
 * @dev Library for cryptographic operations and signature verification
 */
library CryptoLib {
    /**
     * @dev Recovers the signer from a message and signature
     */
    function recoverSigner(bytes32 message, bytes calldata signature, address expectedSigner, string memory errorMessage) internal pure returns (address) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(message);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == expectedSigner, errorMessage);
        return recoveredSigner;
    }

    /**
     * @dev Creates a hash from packed data
     */
    function createHashPacked(bytes memory data) internal pure returns (bytes32) {
        return keccak256(data);
    }

    /**
     * @dev Creates a hash from packed arguments
     */
    function createHashPacked(address user, bytes32 crosswordId, uint256 durationMs, address contractAddr) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, crosswordId, durationMs, contractAddr));
    }

    /**
     * @dev Creates a hash from packed arguments for user profile updates
     */
    function createHashPackedForProfile(address user, string calldata username, string calldata displayName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, username, displayName));
    }

    /**
     * @dev Verifies a signature against a message hash
     */
    function verifySignature(bytes32 messageHash, bytes calldata signature, address signer) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        return ECDSA.recover(ethSignedMessageHash, signature) == signer;
    }
}