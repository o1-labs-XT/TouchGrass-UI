import { SignClient } from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";

const web3Modal = new Web3Modal({
  walletConnectVersion: 2,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  standaloneChains: ["mina:mainnet", "mina:devnet", "zeko:testnet"],
});
