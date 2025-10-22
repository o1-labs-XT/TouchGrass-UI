import {
  Mina,
  PublicKey,
  PrivateKey,
  Signature,
  Field,
  fetchAccount
} from "o1js";
import { computeOnChainCommitmentCrossPlatform, generateECKeypairCrossPlatform } from "authenticity-zkapp/browser";
import { Secp256r1, Ecdsa, Bytes32 } from "authenticity-zkapp";
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
      const result = await computeOnChainCommitmentCrossPlatform(imageBuffer);

      console.log("Commitment computed successfully");
      return {
        sha256Hash: result.sha256,
        high128String: result.high128.toString(),
        low128String: result.low128.toString()
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
    console.log("Generating random keypair...");

    try {
      const privateKey = PrivateKey.random();
      const publicKey = privateKey.toPublicKey();

      console.log("Keypair generated successfully");
      return {
        privateKey: privateKey.toBase58(),
        publicKey: publicKey.toBase58()
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

      const signResult = client.signFields({
        fields: fields,
        privateKey: privateKeyBase58
      });

      console.log("Fields signed successfully");
      return {
        signature: signResult.signature,
        publicKey: signResult.publicKey
      };
    } catch (error) {
      console.error("Failed to sign fields:", error);
      throw error;
    }
  },

  /**
   * Generate a random ECDSA keypair for browser-based signing
   * Uses P-256 curve (same as prime256v1 in Node.js)
   */
  generateECKeypair: async () => {
    console.log("Generating ECDSA keypair...");

    try {
      const keyPair = await generateECKeypairCrossPlatform();

      console.log("ECDSA keypair generated successfully");
      return {
        privateKeyHex: keyPair.privateKeyHex,
        publicKeyXHex: keyPair.publicKeyXHex,
        publicKeyYHex: keyPair.publicKeyYHex,
        privateKeyBigInt: keyPair.privateKeyBigInt.toString(), // Serialize for Comlink
        publicKeyXBigInt: keyPair.publicKeyXBigInt.toString(),
        publicKeyYBigInt: keyPair.publicKeyYBigInt.toString(),
      };
    } catch (error) {
      console.error("Failed to generate ECDSA keypair:", error);
      throw error;
    }
  },

  /**
   * Sign an image commitment with a Mina private key
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
   * Sign a SHA256 hash with a Mina private key (for backend compatibility)
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
   * Sign a SHA256 hash with ECDSA private key
   * Matches the backend signature format (signatureR, signatureS)
   */
  signECDSA: async (privateKeyHex: string, sha256Hex: string) => {
    console.log("Signing with ECDSA...");

    try {
      // Import Bytes to create Bytes32
      const { Bytes } = await import("o1js");
      class Bytes32 extends Bytes(32) {}

      // Convert sha256 hex to Bytes32
      const hashBytes = Bytes32.fromHex(sha256Hex);

      // Convert private key hex to bigint
      const privateKeyBigInt = BigInt('0x' + privateKeyHex);

      // Create Secp256r1 scalar from private key
      const creatorKey = Secp256r1.Scalar.from(privateKeyBigInt);

      // Sign the hash using ECDSA
      const signature = Ecdsa.signHash(hashBytes, creatorKey.toBigInt());

      // Extract r and s components as hex strings (64 chars each)
      const signatureData = signature.toBigInt();
      const signatureR = signatureData.r.toString(16).padStart(64, '0');
      const signatureS = signatureData.s.toString(16).padStart(64, '0');

      console.log("ECDSA signature created successfully");
      return {
        signatureR,
        signatureS
      };
    } catch (error) {
      console.error("Failed to sign with ECDSA:", error);
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
