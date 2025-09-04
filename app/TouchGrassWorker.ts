import {
  Mina,
  PublicKey,
  PrivateKey,
  Signature,
  Field,
  fetchAccount
} from "o1js";
import { computeOnChainCommitmentCrossPlatform } from "authenticity-zkapp/browser";
import * as Comlink from "comlink";

export const api = {
  /**
   * Computes the on-chain commitment using the official zkapp implementation
   * Returns both SHA256 hash (for API calls) and Poseidon commitment (for on-chain verification)
   * Adapted from authenticity-zkapp v0.1.3 computeOnChainCommitmentCrossPlatform
   */
  async computeOnChainCommitmentWeb(imageBuffer: Uint8Array): Promise<{
    sha256Hash: string;
    poseidonCommitmentString: string;
  }> {
    console.log("Computing commitment using authenticity-zkapp...");

    try {
      const result = await computeOnChainCommitmentCrossPlatform(imageBuffer);

      console.log("Commitment computed successfully");
      return {
        sha256Hash: result.sha256,
        poseidonCommitmentString: result.poseidon.toString()
      };
    } catch (error) {
      console.error("Failed to compute commitment:", error);
      throw new Error("Failed to compute image commitment: " + String(error));
    }
  },

  /**
   * Generate a random keypair for browser-based signing
   */
  generateKeypair: async () => {
    console.log("Generating random keypair...");

    try {
      const privateKey = PrivateKey.random();
      const publicKey = privateKey.toPublicKey();

      console.log("Keypair generated successfully");
      return {
        privateKeyBase58: privateKey.toBase58(),
        publicKeyBase58: publicKey.toBase58()
      };
    } catch (error) {
      console.error("Failed to generate keypair:", error);
      throw error;
    }
  },

  /**
   * Sign an image commitment with a private key
   */
  signCommitment: async (
    privateKeyBase58: string,
    commitmentString: string
  ) => {
    console.log("Signing commitment...");

    try {
      // Reconstruct objects from serializable strings
      const privateKey = PrivateKey.fromBase58(privateKeyBase58);
      const publicKey = privateKey.toPublicKey();
      const commitment = Field(commitmentString);

      const signature = Signature.create(privateKey, [commitment]);

      console.log("Commitment signed successfully");
      return {
        signatureBase58: signature.toBase58(),
        publicKeyBase58: publicKey.toBase58()
      };
    } catch (error) {
      console.error("Failed to sign commitment:", error);
      throw error;
    }
  },

  /**
   * Sign a SHA256 hash with a private key (for backend compatibility)
   */
  signSHA256Hash: async (privateKeyBase58: string, sha256Hex: string) => {
    console.log("Signing SHA256 hash...");

    try {
      // Import Bytes to create Bytes32
      const { Bytes } = await import("o1js");
      class Bytes32 extends Bytes(32) {}

      const privateKey = PrivateKey.fromBase58(privateKeyBase58);
      const publicKey = privateKey.toPublicKey();

      // Convert SHA256 hex string to Bytes32 representation
      // This matches what the backend expects for signature validation
      const commitment = Bytes32.fromHex(sha256Hex);

      // The backend's verifySignature expects this format
      const signature = Signature.create(privateKey, commitment.toFields());

      console.log("SHA256 hash signed successfully");
      return {
        signatureBase58: signature.toBase58(),
        publicKeyBase58: publicKey.toBase58()
      };
    } catch (error) {
      console.error("Failed to sign SHA256 hash:", error);
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
        creatorIsOdd: creatorIsOdd.toString()
      });

      // Convert Fields to strings for serialization across worker boundary
      return {
        poseidonHash: poseidonHash.toString(),
        creatorX: creatorX.toString(),
        creatorIsOdd: creatorIsOdd.toString(),
        isValid: true
      };
    } catch (error) {
      console.error("Failed to read contract state:", error);
      return {
        poseidonHash: "0",
        creatorX: "0",
        creatorIsOdd: "0",
        isValid: false,
        error: String(error)
      };
    }
  }
};

export type TouchGrassWorker = typeof api;

Comlink.expose(api);
