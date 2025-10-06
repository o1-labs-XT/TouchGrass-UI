/**
 * Backend API client utilities
 * Handles communication with the TouchGrass backend API
 */

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const BACKEND_URL = USE_MOCK_API
  ? '/api/mock'
  : (process.env.NEXT_PUBLIC_BACKEND_URL || "https://authenticity-api-staging.up.railway.app/api");
console.log("Backend URL:", BACKEND_URL, "Mock mode:", USE_MOCK_API);

export interface UploadResponse {
  tokenOwnerAddress: string;
  sha256Hash?: string;
  status: "pending" | "duplicate";
}

export interface StatusResponse {
  status: "pending" | "processing" | "verified" | "failed";
  tokenOwnerAddress: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface TokenOwnerResponse {
  tokenOwnerAddress?: string;
  status?: "pending" | "verified";
  found: boolean;
}

// TouchGrass Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  chainCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chain {
  id: string;
  name: string;
  challengeId: string;
  length: number;
  createdAt: string;
  lastActivityAt: string;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  sha256Hash: string;
  walletAddress: string;
  signature: string;
  challengeId: string;
  chainId: string;
  storageKey: string;
  tagline?: string;
  chainPosition: number;
  status: "uploading" | "uploaded" | "proving" | "publishing" | "verified" | "failed";
  transactionId?: string;
  failureReason?: string;
  retryCount: number;
  challengeVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getImageUrl(submissionId: string): string {
  return `${BACKEND_URL}/submissions/${submissionId}/image`;
}

/**
 * Upload an image with signature for authentication
 */
export async function uploadImage(
  file: File,
  publicKey: string,
  signature: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("publicKey", publicKey);
  formData.append("signature", signature);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || errorData.error || "Upload failed"
    );
  }

  const data = await response.json();

  // Validate response has expected format
  if (!data.tokenOwnerAddress) {
    throw new Error("Invalid response from backend: missing tokenOwnerAddress");
  }

  return data;
}

/**
 * Check the status of a proof generation
 */
export async function checkStatus(sha256Hash: string): Promise<StatusResponse> {
  // Basic client-side validation
  if (!/^[a-fA-F0-9]{64}$/.test(sha256Hash)) {
    throw new Error("Invalid SHA256 hash format");
  }

  const response = await fetch(`${BACKEND_URL}/api/status/${sha256Hash}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Image not found in authenticity system");
    }
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || errorData.error || "Status check failed"
    );
  }

  const data = await response.json();

  // Validate response format
  if (!data.status || !data.tokenOwnerAddress) {
    throw new Error("Invalid response from backend");
  }

  if (!["pending", "processing", "verified", "failed"].includes(data.status)) {
    throw new Error(`Invalid status value from backend: ${data.status}`);
  }

  return data;
}

/**
 * Get token owner address for verification
 */
export async function getTokenOwner(
  sha256Hash: string
): Promise<TokenOwnerResponse> {
  // Basic client-side validation
  if (!/^[a-fA-F0-9]{64}$/.test(sha256Hash)) {
    throw new Error("Invalid SHA256 hash format");
  }

  const response = await fetch(`${BACKEND_URL}/api/token-owner/${sha256Hash}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message ||
        errorData.error ||
        "Failed to lookup token owner"
    );
  }

  const data = await response.json();

  return data;
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get current challenge
 */
export async function getCurrentChallenge(): Promise<Challenge> {
  const response = await fetch(`${BACKEND_URL}/challenges/current`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch current challenge: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get chain details
 */
export async function getChain(chainId: string): Promise<Chain> {
  const response = await fetch(`${BACKEND_URL}/chains/${chainId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Chain not found");
    }
    throw new Error(`Failed to fetch chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all submissions
 */
export async function getSubmissions(): Promise<Submission[]> {
  const response = await fetch(`${BACKEND_URL}/submissions`);

  if (!response.ok) {
    throw new Error(`Failed to fetch submissions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get submissions filtered by chain ID
 */
export async function getSubmissionsByChain(chainId: string): Promise<Submission[]> {
  const response = await fetch(`${BACKEND_URL}/submissions?chainId=${chainId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch submissions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get single submission
 */
export async function getSubmission(submissionId: string): Promise<Submission> {
  const response = await fetch(`${BACKEND_URL}/submissions/${submissionId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch submission: ${response.statusText}`);
  }

  return response.json();
}
