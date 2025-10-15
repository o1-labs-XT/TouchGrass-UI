import { SignClient } from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";

const web3Modal = new Web3Modal({
  walletConnectVersion: 2,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  standaloneChains: ["mina:mainnet", "mina:devnet", "zeko:testnet"],
});

export interface WalletConnectClient extends InstanceType<typeof SignClient> {
  session: InstanceType<typeof SignClient>["session"];
}

interface SessionEventParams {
  event: { name: string; data: any };
  chainId: string;
}

interface SessionEvent {
  id: number;
  topic: string;
  params: SessionEventParams;
}

const openDeepLink = (deepLink: string) => {
  const link = document.createElement("a");
  link.href = deepLink;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getCurrentSession = (client: WalletConnectClient) => {
  const sessions = client.session.getAll();
  return sessions.length > 0 ? sessions[0] : null;
};
