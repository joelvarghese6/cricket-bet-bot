import { getProgram } from "../utils";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  MarketStatusFilter,
  getMarketAccountsByStatusAndMintAccount,
  Orders,
  OrderStatusFilter,
  MarketOutcomes,
  getMarketPricesWithMatchingPoolsFromOrders,
  ResponseFactory,
  MarketPricesAndPendingOrders,
} from "@monaco-protocol/client";
import { query } from "express";

const marketsStatus = MarketStatusFilter.Open;

export const getMarketPrices = async (program: Program, marketPk: PublicKey) => {
  const response = new ResponseFactory({} as MarketPricesAndPendingOrders);
  const openOrdersResponse = await new Orders(program)
    .filterByMarket(marketPk)
    .filterByStatus(OrderStatusFilter.Open)
    .fetch();

  const marketOutcomes = await MarketOutcomes.marketOutcomeQuery(program)
    .filterByMarket(marketPk)
    .fetch();

  if (!marketOutcomes.success) {
    console.log("Market outcome query failed: ");
  }

  const pendingOrders = openOrdersResponse.data.orderAccounts;
  const marketOutcomeTitles = marketOutcomes.data.marketOutcomeAccounts.map(
    (market) => market.account.title
  );

  const marketPrices = await getMarketPricesWithMatchingPoolsFromOrders(
    program,
    marketPk,
    pendingOrders,
    marketOutcomeTitles
  );

  response.addResponseData({
    pendingOrders: pendingOrders,
    marketPrices: marketPrices.data.marketPrices,
    marketOutcomeAccounts: marketOutcomes.data.marketOutcomeAccounts,
  });

  return response.body;
};

export const getBestMarketOutcomeWithOdd = (
  marketPricesAndPendingOrders: MarketPricesAndPendingOrders
) => {
  const { marketPrices } = marketPricesAndPendingOrders;

  let marketOutcomes: any = {};
  for (let i = 0; i < marketPrices.length; i++) {
    let marketPrice = marketPrices[i];
    // skip Draw market outcome
    if (marketPrice.marketOutcome === "Draw") {
      continue;
    }
    if (!marketOutcomes[marketPrice.marketOutcome]) {
      marketOutcomes[marketPrice.marketOutcome] = {
        marketOutcomeIndex: marketPrice.marketOutcomeIndex,
        forOutcomePrice: 0,
        againstOutcomePrice: 0,
      };
    }
    if (
      marketPrice.forOutcome &&
      marketPrice.price >
        marketOutcomes[marketPrice.marketOutcome].forOutcomePrice
    ) {
      marketOutcomes[marketPrice.marketOutcome].forOutcomePrice =
        marketPrice.price;
    } else if (
      !marketPrice.forOutcome &&
      marketPrice.price >
        marketOutcomes[marketPrice.marketOutcome].againstOutcomePrice
    ) {
      marketOutcomes[marketPrice.marketOutcome].againstOutcomePrice =
        marketPrice.price;
    }
  }
  if (Object.keys(marketOutcomes).length !== 2) {
    return null;
  }
  let marketOutcomeA = Object.keys(marketOutcomes)[0];
  let marketOutcomeB = Object.keys(marketOutcomes)[1];
  for (let marketOutcome in marketOutcomes) {
    let forOutcomePrice = marketOutcomes[marketOutcome].forOutcomePrice;
    let againstOutcomePrice = marketOutcomes[marketOutcome].againstOutcomePrice;
    if (forOutcomePrice > 0 && againstOutcomePrice > 0) {
      return {
        marketOutcome: marketOutcome,
        marketOutcomeAgainst:
          marketOutcome === marketOutcomeA ? marketOutcomeB : marketOutcomeA,
        marketOutcomeIndex: marketOutcomes[marketOutcome].marketOutcomeIndex,
        forOutcomePrice: forOutcomePrice,
        againstOutcomePrice: againstOutcomePrice,
      };
    }
  }
  return null;
};

export const getMarketOutcomePriceData = async (
  program: Program,
  marketPk: PublicKey
) => {
  let marketPricesResponse = await getMarketPrices(program, marketPk);
  console.log("Market price response: ", marketPricesResponse);

  if (
    !marketPricesResponse.success ||
    marketPricesResponse.data.pendingOrders.length == 0
  ) {
    return null;
  }

  if (marketPricesResponse.data) {
    const moreData = getBestMarketOutcomeWithOdd(marketPricesResponse.data);
    return moreData;
  }
  return null;
};

export const ShowAvailableMarkets = async () => {
  let token = "Aqw6KyChFm2jwAFND3K29QjUcKZ3Pk72ePe5oMxomwMH";
  const program = await getProgram(
    new PublicKey("monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih")
  );
  const marketResponse = await getMarketAccountsByStatusAndMintAccount(
    program,
    marketsStatus,
    new PublicKey(token)
  );

  const currentTime = +new Date() / 1000;
  const marketsWithOutcomes = marketResponse.data.markets
    .filter((market) => market.account.marketOutcomesCount > 0)
    .filter(
      (market) =>
        market.account.marketLockTimestamp.toNumber() > currentTime - 60
    );

  const format_strings = [];

  for (let market of marketsWithOutcomes) {
    let marketPk = market.publicKey;
    let marketPricesData = await getMarketOutcomePriceData(program, marketPk);
    if (!marketPricesData) {
      console.log("No data: ", marketPk.toBase58());
      continue;
    }
    const marketData = {
      pk: marketPk.toString(),
      market: market,
      prices: marketPricesData,
    };

    const formattedString = {stringV: `<b>markets</b>
    These are the markets that are available right now.
    
    <b>title</b>
    For Outcome Price: ${marketData.prices.forOutcomePrice}
    To Outcome Price: ${marketData.prices.againstOutcomePrice}
    Address: ${marketData.pk}
    
    Commands to place bet:
    for: /placebet for ${marketData.pk} AMOUNT
    against: /placebet against ${marketData.pk} AMOUNT
    `}

    //const formattedString = {stringV : `For Outcome Price: \`${marketData.prices.forOutcomePrice}\`\nTo Outcome Price: \`${marketData.prices.againstOutcomePrice}\`\nAddress: \`${marketData.pk}\`\n[View on Solscan](https://solscan.io/account/${marketData.pk})`};
    format_strings.push(formattedString);
  }

  return format_strings;
};
