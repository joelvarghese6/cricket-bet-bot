# Telegram Cricket Betting Bot

Welcome to the Telegram Cricket Betting Bot! This bot allows users to place bets on cricket matches. Here's an overview of how the bot works and how to use it:

## Prerequisites

Before getting started, make sure you have the following prerequisites:

- [Node.js](https://nodejs.org/) installed on your system.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/joelvarghese6/cricket-betting-bot.git

2. **Navigate to the Project Directory**:

   ```bash
   cd cricket-betting-bot
3. **Install Dependencies**:

   ```bash
   npm install
4. **Create a Configuration File**:
   Create a .env file in the project directory and add your Telegram Bot Token and any other configuration variables:

   ```bash
   TELEGRAM_BOT_TOKEN=your-bot-token
5. **Start the Bot**:
  Run the bot using the following command:

   ```bash
   npm start

## Getting Started

1. **Start a Chat**: Begin by starting a chat with the bot at [t.me/cricket_bet_bot](https://t.me/cricket_bet_bot).

2. **Create a Wallet**: To get started, send the `/start` command to the bot. This will create a wallet for you.

3. **Fund Your Wallet**: Before placing bets, you need to transfer some USDT (Tether) to your wallet within the bot. The wallet address can be obtained by using the `/mykey` command.

## Placing Bets

To place a bet, use the following format:

`/placebet type marketAddress amount`


- `type`: Specify the type of bet you want to place.
- `marketAddress`: Provide the address of the cricket match market you want to bet on.
- `amount`: Enter the amount you want to bet.

## Viewing Available Markets

To check the available cricket match markets, simply type `/market` in the chat.

## Additional Commands

- `/mykey`: Use this command to get your wallet address within the bot.

## Support and Assistance

If you have any questions or need assistance, feel free to reach out to us through telegram @joelvarghese6. We're here to help and ensure you have a great betting experience.

Happy Betting!
