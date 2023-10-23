import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { Keypair } from "@solana/web3.js";
import { Menu } from "@grammyjs/menu";
import { ShowAvailableMarkets } from "./commands/market";
import { placeBet } from "./commands/placebet";
import express from "express";

const bot = new Bot(process.env.TELEGRAM_TOKEN || "");
const userKeyPairs: any = {};

const introductionMessage = `Welcome to our Cricket Betting Bot!
I'm powered by Monaco Protocol, the next-generation decentralized liquidity 
network for exchange-based applications built on the Solana blockchain.

<b>Commands</b>
/menu - The command will display this Message
/market - The command will display the Market
/mykey - The command will display your Solana Wallet Address`;

bot.api.setMyCommands([
  { command: "menu", description: "Display this Message" },
  {
    command: "market",
    description: "Display the Market",
  },
  {
    command: "mykey",
    description: "Display your public key",
  },
]);

const menu = new Menu("my-menu-identifier")
  .text("Show my Key", async (ctx) => {
    if (ctx && ctx.chat) {
      const wallet = userKeyPairs[ctx.chat.id];

      if (wallet) {
        const message = `Your Solana wallet address:\n${wallet.publicKey.toBase58()}\n\nPlease keep this address and your secret key safe.`;
        await ctx.reply(message, { reply_markup: menu, parse_mode: "HTML" });
      } else {
        const message =
          "You haven't generated a Solana keypair yet. Please use /start to generate one.";
        await ctx.reply(message, { reply_markup: menu, parse_mode: "HTML" });
      }
    } else {
      console.log("ctx or ctx.chat is undefined.");
    }
  })
  .text("List Market", async (ctx) => {
    const markets = await ShowAvailableMarkets();
    const message = `<b>markets</b>
  These are the markets that are available right now.
  
  <b>title</b>
  For Outcome Price: 0.14
  To Outcome Price: 0.15
  Address: 2zasdawdadsadasdweweadasda
  
  Commands to place bet:
  for: /placebet for 2zasdawdadsadasdweweadasda AMOUNT
  against: /placebet against 2zasdawdadsadasdweweadasda AMOUNT
  `;
    await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });

    for (const market of markets) {
      await ctx.reply(market.stringV, {
        parse_mode: "HTML",
        reply_markup: menu,
      });
    }
  })

bot.use(menu);

bot.command("menu", async (ctx) => {
  await ctx.reply(introductionMessage, {
    parse_mode: "HTML",
    reply_markup: menu,
  });
})

bot.command("start", async (ctx) => {
  await ctx.reply(introductionMessage, {
    parse_mode: "HTML",
    reply_markup: menu,
  });
  const keypair = Keypair.generate();
  userKeyPairs[ctx.chat.id] = keypair;
  const message = `Your Solana wallet address:\n${keypair.publicKey.toBase58()}\n\nPlease keep this address and your secret key safe.`;
  await ctx.reply(message, { reply_markup: menu });
});

bot.command("mykey", async (ctx) => {
  const keypair = userKeyPairs[ctx.chat.id];
  if (keypair) {
    const message = `Your Solana wallet address:\n${keypair.publicKey.toBase58()}\n\nPlease keep this address and your secret key safe.`;
    await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });
  } else {
    const message =
      "You haven't generated a Solana keypair yet. Please use /start to generate one.";
    await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });
  }
});

// bot.command("placebet", async (ctx) => {
//   const message =
//     "Thank you for placing a bet. We will notify you when the result is available.";
//   await ctx.reply(message);
// });

bot.command("market", async (ctx) => {
  const markets = await ShowAvailableMarkets();
  const message = `<b>markets</b>
  These are the markets that are available right now.
  
  <b>title</b>
  For Outcome Price: 0.14
  To Outcome Price: 0.15
  Address: 2zasdawdadsadasdweweadasda
  
  Commands to place bet:
  for: /placebet for 2zasdawdadsadasdweweadasda AMOUNT
  against: /placebet against 2zasdawdadsadasdweweadasda AMOUNT
  `;
  await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });

  for (const market of markets) {
    await ctx.reply(market.stringV, { parse_mode: "HTML", reply_markup: menu });
  }
});


bot.on("message", async (ctx) => {
  const messageText = ctx.message.text;
  const wallet = userKeyPairs[ctx.chat.id];

  if (!wallet) {
    const message =
      "You haven't generated a Solana keypair yet. Please use /start to generate one.";
    await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });
    return;
  }

  if (messageText && messageText.startsWith("/placebet") && wallet) {
    const betText = messageText.substring("/placebet".length).trim();
    const betTokens = betText.split(/\s+/);

    const keypair = wallet.secretKey;
    if (!wallet) {
      const message =
        "You haven't generated a Solana keypair yet. Please use /start to generate one.";
      await ctx.reply(message, { parse_mode: "HTML", reply_markup: menu });
      return;
    }
    if ((betTokens.length === 3 && betTokens[0] === "for") || "against") {
      const outcome = betTokens[0];
      const marketAddress = betTokens[1];
      const amount = Number(betTokens[2]);
      const res = await placeBet(
        marketAddress,
        outcome as "for" | "against",
        amount,
        keypair
      );
      if (res?.error) {
        await ctx.reply(
          "Very sorry your order can't be placed right now, please try again after some time",
          { parse_mode: "HTML", reply_markup: menu }
        );
        return;
      } else if (res?.data.success) {
        await ctx.reply("Your order has been placed successfully", {
          parse_mode: "HTML",
          reply_markup: menu,
        });
        return;
      } else {
        await ctx.reply(
          "Very sorry your order can't be placed right now, please try again after some time",
          { parse_mode: "HTML", reply_markup: menu }
        );
      }
    }

    console.log(betTokens);
    return;
  }

  await ctx.reply("Place use a valid command");
});

if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
