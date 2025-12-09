# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-12-09

### Added
- Added `sponsoredBy` field to Crossword struct in smart contract
- Added "Sponsored By" input field to admin panel UI
- Added display of "Sponsored by" information in crossword history cards
- Added verification scripts for testing crossword data storage
- Added deployment instructions and configuration documentation

### Changed
- Updated CrosswordBoard.sol contract to include sponsoredBy in all crossword creation functions:
  - `createCrossword()` - now accepts and stores sponsoredBy parameter
  - `createCrosswordWithNativeCELO()` - now accepts and stores sponsoredBy parameter
  - `createCrosswordWithPrizePool()` - now accepts and stores sponsoredBy parameter
  - `createCrosswordWithNativeCELOPrizePool()` - now accepts and stores sponsoredBy parameter
- Updated `getCrosswordDetails()` function to return sponsoredBy (now returns 10 values instead of 9)
- Updated internal `_createCrossword()` and `_createCrosswordWithNativeCELO()` functions to store sponsoredBy
- Updated admin panel to pass sponsoredBy parameter when creating crosswords
- Updated `useGetCrosswordHistory` hook to handle the new sponsoredBy field
- Updated `CrosswordHistoryCard` component to display sponsoredBy information
- Updated `LegacyCrosswordHistory` component to support sponsoredBy field
- Updated contract ABI files with new function signatures
- Updated contract address in frontend configuration to new Sepolia deployment: `0xe8a2c7df99bda594db3ab3431d7f25ba3d7e2e82`
- Fixed ABI encoding parameter mismatch errors by ensuring parameter counts match contract functions

## [1.1.1] - 2025-12-09

### Refactored
- Updated ABI management to import from JSON files instead of inline definitions in useContract.ts
- This allows for easier synchronization between contract deployments and frontend
- Contract configuration now uses dynamic ABI loading from artifact files
- Ready for mainnet deployment while maintaining current Sepolia configuration as active network
- Ensures ABI consistency between contract functions and frontend hooks
- Updated CrosswordBoard.json ABI with latest contract functions including sponsoredBy
- Configuration supports both testnet and mainnet deployments seamlessly

### Fixed
- Fixed issue where ABI encoding expected 7 parameters but 8 were provided
- Corrected parameter counts in all contract function calls
- Resolved TypeScript type mismatches related to new contract fields
- Updated all related hooks and components to properly handle 8-parameter contract functions

### Security
- Maintained all existing security patterns and checks
- Added sponsoredBy parameter to validation flows

## [1.1.0] - 2025-12-03

### Added
- Initial implementation of crossword name display in history
- Crossword grid data storage and retrieval
- Prize pool functionality with native CELO support

## [1.0.0] - 2025-11-30

### Added
- Initial crossword creation and completion system
- Blockchain integration with CELO
- Admin panel for managing crosswords
- History page for viewing completed crosswords

[Unreleased]: https://github.com/0x66/celo-crossword/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/0x66/celo-crossword/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/0x66/celo-crossword/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/0x66/celo-crossword/releases/tag/v1.0.0