/**
 * Backend API client utilities
 * Handles communication with the TouchGrass backend API
 */

// Simple in-memory cache for submissions
const submissionCache = new Map<string, Submission>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
console.log(process.env.NEXT_PUBLIC_USE_MOCK_API);
export const BACKEND_URL = USE_MOCK_API
  ? "/api/mock"
  : process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://authenticity-api-staging.up.railway.app/api";
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
  likeCount: number;
  status: "awaiting_review" | "rejected" | "processing" | "complete";
  transactionId?: string;
  failureReason?: string;
  retryCount: number;
  challengeVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  submissionId: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

export function getImageUrl(submissionId: string): string {
  return `${BACKEND_URL}/submissions/${submissionId}/image`;
}

// Cache utility functions
function isCacheValid(submissionId: string): boolean {
  const timestamp = cacheTimestamps.get(submissionId);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

function getCachedSubmission(submissionId: string): Submission | null {
  if (isCacheValid(submissionId)) {
    return submissionCache.get(submissionId) || null;
  }
  return null;
}

function setCachedSubmission(submission: Submission): void {
  submissionCache.set(submission.id, submission);
  cacheTimestamps.set(submission.id, Date.now());
}

export function getCachedSubmissionSync(
  submissionId: string
): Submission | null {
  return getCachedSubmission(submissionId);
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
    body: formData,
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
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all challenges (active and completed)
 */
export async function getAllChallenges(): Promise<Challenge[]> {
  const response = await fetch(`${BACKEND_URL}/challenges`);

  if (!response.ok) {
    throw new Error(`Failed to fetch challenges: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get specific challenge by ID
 */
export async function getChallenge(challengeId: string): Promise<Challenge> {
  const response = await fetch(`${BACKEND_URL}/challenges/${challengeId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Challenge not found");
    }
    throw new Error(`Failed to fetch challenge: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current challenge
 */
export async function getCurrentChallenge(): Promise<Challenge> {
  const response = await fetch(`${BACKEND_URL}/challenges/active`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch active challenges: ${response.statusText}`
    );
  }

  const challenges = await response.json();

  if (!challenges || challenges.length === 0) {
    throw new Error("No active challenges found");
  }

  return challenges[0];
}

/**
 * Get active challenges (non-throwing version)
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/challenges/active`);

    if (!response.ok) {
      return [];
    }

    const challenges = await response.json();
    return challenges || [];
  } catch (err) {
    console.error("Failed to fetch active challenges:", err);
    return [];
  }
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
 * Get chains for a specific challenge
 */
export async function getChainsByChallenge(
  challengeId: string
): Promise<Chain[]> {
  const response = await fetch(
    `${BACKEND_URL}/chains?challengeId=${challengeId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch chains: ${response.statusText}`);
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
export async function getSubmissionsByChain(
  chainId: string
): Promise<Submission[]> {
  const response = await fetch(`${BACKEND_URL}/submissions?chainId=${chainId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch submissions: ${response.statusText}`);
  }

  const submissions = await response.json();

  // Cache all submissions for faster access later
  submissions.forEach((submission: Submission) => {
    setCachedSubmission(submission);
  });

  return submissions;
}

/**
 * Get single submission with cache support
 */
export async function getSubmission(submissionId: string): Promise<Submission> {
  // Check cache first
  const cached = getCachedSubmission(submissionId);
  if (cached) {
    // Return cached data immediately, but still fetch fresh data in background
    fetchSubmissionFresh(submissionId).catch(() => {
      // Silently handle background refresh errors
    });
    return cached;
  }

  // No cache, fetch fresh data
  return fetchSubmissionFresh(submissionId);
}

/**
 * Fetch submission from API and update cache
 */
async function fetchSubmissionFresh(submissionId: string): Promise<Submission> {
  const response = await fetch(`${BACKEND_URL}/submissions/${submissionId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch submission: ${response.statusText}`);
  }

  const submission = await response.json();
  setCachedSubmission(submission);
  return submission;
}

/**
 * Like a submission
 */
export async function likeSubmission(
  submissionId: string,
  walletAddress: string
): Promise<Like> {
  const response = await fetch(`${BACKEND_URL}/submissions/${submissionId}/likes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || errorData.error || `Failed to like submission: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Unlike a submission
 */
export async function unlikeSubmission(
  submissionId: string,
  walletAddress: string
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/submissions/${submissionId}/likes/${encodeURIComponent(walletAddress)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || errorData.error || `Failed to unlike submission: ${response.statusText}`
    );
  }
}

/**
 * Get like count for a submission
 */
export async function getLikeCount(
  submissionId: string
): Promise<{ submissionId: string; count: number }> {
  const response = await fetch(`${BACKEND_URL}/submissions/${submissionId}/likes/count`);

  if (!response.ok) {
    throw new Error(`Failed to get like count: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if user has liked a submission
 */
export async function checkUserLiked(
  submissionId: string,
  walletAddress: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/submissions/${submissionId}/likes`);

  if (!response.ok) {
    throw new Error(`Failed to check if user liked: ${response.statusText}`);
  }

  const likes: Like[] = await response.json();
  return likes.some((like) => like.walletAddress === walletAddress);
}
