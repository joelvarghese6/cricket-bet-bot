import { createOrder, getMarket, getMintInfo } from "@monaco-protocol/client";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "../utils";
import { Program, BN } from "@coral-xyz/anchor";
import { getMarketOutcomePriceData } from "./market";

export const placeBet = async (
  marketPk: string,
  type: "for" | "against",
  amount: number,
  sk: Uint8Array
) => {
  const program = await getProgram(
    new PublicKey("monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih"),
    sk
  );
  console.log("Market: ", marketPk);
  const marketData = await getMarket(program, new PublicKey(marketPk));
  const mintInfo = await getMintInfo(
    program,
    marketData.data.account.mintAccount
  );
  const stakeInteger = new BN(amount * 10 ** mintInfo.data.decimals);
  let marketPricesData = await getMarketOutcomePriceData(
    program,
    new PublicKey(marketPk)
  );

  if (!marketPricesData || !marketData.success) {
    return undefined;
  }

  try {
    console.log({
      pk: new PublicKey(marketPk),
      indx: marketPricesData.marketOutcomeIndex,
      for: type == "for" ? true : false,
      price:
        type == "for"
          ? marketPricesData.forOutcomePrice
          : marketPricesData.againstOutcomePrice,
      stakeInteger: stakeInteger.toNumber(),
    });
    const data = await createOrder(
      program,
      new PublicKey(marketPk),
      marketPricesData.marketOutcomeIndex,
      type == "for" ? true : false,
      type == "for"
        ? marketPricesData.forOutcomePrice
        : marketPricesData.againstOutcomePrice,
      stakeInteger
    );

    console.log("Order Res: ", data);
    return { data, marketPricesData };
  } catch (e: any) {
    console.log("Error creating order: ", e.errors.toString());
    return { error: true, data: e.toString() };
  }
};
