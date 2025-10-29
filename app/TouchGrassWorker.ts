import {
  Mina,
  PublicKey,
  PrivateKey,
  Signature,
  Field,
  fetchAccount,
} from "o1js";
import { computeOnChainCommitmentCrossPlatform } from "authenticity-zkapp/browser";
import * as Comlink from "comlink";
import Client from "mina-signer";

export const api = {
  /**
   * Computes the on-chain commitment using the official zkapp implementation
   * Returns SHA256 hash (for signing) and Field representation (for on-chain storage)
   * Uses authenticity-zkapp v0.1.5 computeOnChainCommitmentCrossPlatform
   */
  async computeOnChainCommitmentWeb(imageBuffer: Uint8Array): Promise<{
    sha256Hash: string;
    high128String: string;
    low128String: string;
  }> {
    console.log("Computing commitment using authenticity-zkapp...");

    try {
      const { computeOnChainCommitmentCrossPlatform } = await import("authenticity-zkapp/browser");
      const result = await computeOnChainCommitmentCrossPlatform(imageBuffer);

      console.log("Commitment computed successfully");
      return {
        sha256Hash: result.sha256,
        high128String: result.high128.toString(),
        low128String: result.low128.toString(),
      };
    } catch (error) {
      console.error("Failed to compute commitment:", error);
      throw new Error("Failed to compute image commitment: " + String(error));
    }
  },

  /**
   * Generate a random Mina keypair for browser-based signing
   */
  generateKeypair: async () => {
    console.log("Generating random keypair with mina-signer...");

    try {
      const client = new Client({ network: "testnet" });
      const keypair = client.genKeys();

      console.log("Keypair generated successfully");
      return {
        privateKey: keypair.privateKey,
        publicKey: keypair.publicKey,
      };
    } catch (error) {
      console.error("Failed to generate keypair:", error);
      throw error;
    }
  },

  /**
   * Sign field elements using mina-signer (compatible with Auro Wallet signatures)
   */
  signFieldsMinaSigner: async (privateKeyBase58: string, fields: string[]) => {
    console.log("Signing fields with mina-signer...");

    try {
      const client = new Client({ network: "testnet" });

      const fieldsBigInt = fields.map((f) => BigInt(f));

      const signResult = client.signFields(fieldsBigInt, privateKeyBase58);

      console.log("Fields signed successfully");
      return {
        signature: signResult.signature,
        publicKey: signResult.publicKey,
      };
    } catch (error) {
      console.error("Failed to sign fields:", error);
      throw error;
    }
  },


  /**
   * Read contract state from a token account to verify image authenticity
   */
  readContractState: async (tokenOwnerAddress: string) => {
    console.log("Reading contract state for token owner:", tokenOwnerAddress);

    try {
      // Initialize Mina network connection
      const network = Mina.Network(
        "https://api.minascan.io/node/devnet/v1/graphql"
      );
      Mina.setActiveInstance(network);

      const zkAppAddress =
        process.env.NEXT_PUBLIC_ZKAPP_ADDRESS ||
        "B62qnsomkuMMgcU82EZUfw8FDaYvTypBKFSs1mUiSZrD66gjocfEGBv";
      const zkAppPublicKey = PublicKey.fromBase58(zkAppAddress);

      const { AuthenticityZkApp } = await import("authenticity-zkapp");
      const zkApp = new AuthenticityZkApp(zkAppPublicKey);

      // Derive the tokenId from the zkApp
      const tokenId = zkApp.deriveTokenId();
      console.log("Token ID derived:", tokenId.toString());

      const tokenOwner = PublicKey.fromBase58(tokenOwnerAddress);

      // Fetch the token account state
      await fetchAccount({ publicKey: tokenOwner, tokenId });

      // Get the account with tokenId
      const account = Mina.getAccount(tokenOwner, tokenId);

      // Extract stored values from appState
      const poseidonHash = account.zkapp?.appState?.[0];
      const creatorX = account.zkapp?.appState?.[1];
      const creatorIsOdd = account.zkapp?.appState?.[2];

      if (!poseidonHash || !creatorX || !creatorIsOdd) {
        throw new Error("No zkApp state found on blockchain");
      }

      console.log("Contract state read successfully");
      console.log("Raw contract state:", {
        poseidonHash: poseidonHash.toString(),
        creatorX: creatorX.toString(),
        creatorIsOdd: creatorIsOdd.toString(),
      });

      // Convert Fields to strings for serialization across worker boundary
      return {
        poseidonHash: poseidonHash.toString(),
        creatorX: creatorX.toString(),
        creatorIsOdd: creatorIsOdd.toString(),
        isValid: true,
      };
    } catch (error) {
      console.error("Failed to read contract state:", error);
      return {
        poseidonHash: "0",
        creatorX: "0",
        creatorIsOdd: "0",
        isValid: false,
        error: String(error),
      };
    }
  },
};

export type TouchGrassWorker = typeof api;

Comlink.expose(api);
