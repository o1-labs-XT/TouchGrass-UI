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

const setupEventListeners = (client: WalletConnectClient) => {
  console.log("Setting up event listeners...");

  client.on("session_event", (event: SessionEvent) => {
    console.log("Session event:", event);
    const eventName = event.params.event.name;
    const eventData = event.params.event.data;

    if (eventName === "accountsChanged") {
      console.log("Accounts changed:", eventData);
      window.dispatchEvent(
        new CustomEvent("accountsChanged", { detail: eventData })
      );
    } else if (eventName === "chainChanged") {
      console.log("Chain changed:", eventData);
      window.dispatchEvent(
        new CustomEvent("chainChanged", { detail: eventData })
      );
    }
  });

  client.on("session_update", (event: any) => {
    console.log("Session updated:", event);
    window.dispatchEvent(new CustomEvent("sessionUpdated", { detail: event }));
  });

  client.on("session_delete", (event: any) => {
    console.log("Session disconnected:", event);
    window.dispatchEvent(new CustomEvent("sessionDeleted"));
  });

  client.on("session_request_sent", (event: any) => {
    console.log("Session request sent:", event);
    if (
      [
        "mina_sendPayment",
        "mina_sendStakeDelegation",
        "mina_sendTransaction",
        "mina_signMessage",
        "mina_sign_JsonMessage",
        "mina_signFields",
        "mina_createNullifier",
      ].includes(event?.request?.method)
    ) {
      const deepLink = `aurowallet://`;
      console.log("Auro Wallet Deep Link for request:", deepLink);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        openDeepLink(deepLink);
      }
    }
  });
};

export const initWalletConnect = async (): Promise<WalletConnectClient> => {
  try {
    console.log("Initializing WalletConnect...");

    const client = await SignClient.init({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
      metadata: {
        name: "TouchGrass",
        description: "Photo authenticity challenges",
        url: typeof window !== "undefined" ? window.location.origin : "",
        icons: [typeof window !== "undefined" ? window.location.origin + "/icon-512.png" : ""],
      },
      logger: "warn",
    });

    const existingSessions = client.session.getAll();
    if (existingSessions.length > 0) {
      console.log("Using cached session:", existingSessions[0]);
      setupEventListeners(client);
      return client;
    }

    const connectParams = {
      requiredNamespaces: {
        mina: {
          chains: ["mina:mainnet", "mina:devnet", "zeko:testnet"],
          methods: [
            "mina_sendPayment",
            "mina_sendStakeDelegation",
            "mina_sendTransaction",
            "mina_signMessage",
            "mina_sign_JsonMessage",
            "mina_signFields",
            "mina_createNullifier",
            "mina_verifyMessage",
            "mina_verify_JsonMessage",
            "mina_verifyFields",
            "wallet_info",
          ],
          events: ["accountsChanged", "chainChanged"],
        },
      },
    };

    const { uri, approval } = await client.connect(connectParams);

    if (uri) {
      const scheme = "com.android.chrome";
      const deepLink = `aurowallet://wc?uri=${encodeURIComponent(uri)}&scheme=${encodeURIComponent(scheme)}`;
      console.log("Auro Wallet Deep Link:", deepLink);

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        openDeepLink(deepLink);
      } else {
        web3Modal.openModal({ uri });
      }
    }

    const session = await approval();
    console.log("New session established:", JSON.stringify(session, null, 2));
    web3Modal.closeModal();

    setupEventListeners(client);
    return client;
  } catch (error) {
    console.error("WalletConnect initialization failed:", error);
    throw error;
  }
};

export const getCurrentSession = (client: WalletConnectClient) => {
  const sessions = client.session.getAll();
  return sessions.length > 0 ? sessions[0] : null;
};
