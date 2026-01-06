# Onchain Word Search (Prototype)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Celo](https://img.shields.io/badge/Powered%20by-Celo-green)](https://celo.org/)
[![Solidity](https://img.shields.io/badge/Language-Solidity-ff69b4)](https://soliditylang.org/)

A modern, neubrutalist-styled Onchain Word Search game built for the Celo ecosystem. This project is a prototype designed as a Farcaster MiniApp, offering a premium and engaging user experience.

> [!NOTE]
> This project is a **fork** of the [Celo Crossword Learning App](https://github.com/PsyLabsWeb3/celo-word-search), adapted and evolved into a Word Search experience.

## Overview

Onchain Word Search enables users to solve word search puzzles designed with a bold, neubrutalist aesthetic. Built with React and Next.js, it leverages Celo for its blockchain layer and is optimized for the Farcaster environment.

### Key Features

- **Neubrutalist Design**: Vibrant colors, bold borders, and premium shadows for a "wow" first impression.
- **Mobile Optimized**: Seamless touch-based word selection for Farcaster MiniApp usage.
- **Demo Mode Ready**: Configured for effortless demo walkthroughs with activated features even without wallet connection.
- **Game Mechanics**: Smooth word selection with straight-line enforcement (horizontal, vertical, diagonal).
- **Instant Reset**: Regenerate the grid layout at any time to keep the game fresh.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (Premium Neubrutalist Theme), Lucide Icons
- **Blockchain**: Celo (Wagmi + Viem integration ready)
- **Environment**: Farcaster MiniApp / Frame compatible

## Installation & Setup

### Prerequisites

- Node.js 18+
- pnpm package manager

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/PsyLabsWeb3/celo-word-search.git
   cd celo-word-search
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run locally**
   ```bash
   cd apps/web
   pnpm dev
   ```
   The app will be available at `http://localhost:3000`.

## Fork Information

This project evolved from the Celo Crossword project. While the core "onchain gaming" philosophy remains, it has been refactored to:

1. Replace crossword mechanics with word search logic.
2. Implement a complete UI/UX overhaul using neubrutalist design principles.
3. Optimize for fast-paced, mini-game engagement within social protocols like Farcaster.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by PsyLabs for the Celo ecosystem
</p>
