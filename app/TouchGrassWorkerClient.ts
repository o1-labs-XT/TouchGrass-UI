import * as Comlink from "comlink";

export default class TouchGrassWorkerClient {
  worker: Worker;

  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import('./TouchGrassWorker').api>; 
  
  constructor() {
    // Initialize the worker
    const worker = new Worker(new URL('./TouchGrassWorker.ts', import.meta.url), { type: 'module' });  
    this.worker = worker;
    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(worker);
  }  

  async computeOnChainCommitmentWeb(imageBuffer: Uint8Array): Promise<{
    sha256Hash: string;
    poseidonCommitmentString: string;
  }> {
    return this.remoteApi.computeOnChainCommitmentWeb(imageBuffer);
  }

  async generateKeypair(): Promise<{
    privateKeyBase58: string;
    publicKeyBase58: string;
  }> {
    return this.remoteApi.generateKeypair();
  }

  async signCommitment(privateKeyBase58: string, commitmentString: string): Promise<{
    signatureBase58: string;
    publicKeyBase58: string;
  }> {
    return this.remoteApi.signCommitment(privateKeyBase58, commitmentString);
  }

  async signSHA256Hash(privateKeyBase58: string, sha256Hex: string): Promise<{
    signatureBase58: string;
    publicKeyBase58: string;
  }> {
    return this.remoteApi.signSHA256Hash(privateKeyBase58, sha256Hex);
  }

  async readContractState(tokenOwnerAddress: string) {
    return this.remoteApi.readContractState(tokenOwnerAddress);
  }
}