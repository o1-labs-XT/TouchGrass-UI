/**
 * Backend API client utilities
 * Handles communication with the authenticity backend, including response format conversions
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL environment variable is required");
}
console.log("Backend URL:", BACKEND_URL);

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

  // Backend returns {found: false} for non-existent images
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
