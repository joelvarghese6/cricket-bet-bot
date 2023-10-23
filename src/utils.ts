import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program, Wallet } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor"
import CustomWallet from "./wallet";

export const getProgram = async (protocolAddress: PublicKey, sk?: Uint8Array) => {

    const wallet = CustomWallet.with_private_key(sk || new Keypair().secretKey);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const provider = new AnchorProvider(connection, wallet as Wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = await Program.at(protocolAddress, provider);
    return program;
}
