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
};

export type TouchGrassWorker = typeof api;

Comlink.expose(api);
