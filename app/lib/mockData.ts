/**
 * Mock data that exactly matches Swagger API specification
 * This allows us to develop the UI without needing the backend running
 */

import type { Challenge, Chain, Submission } from './backendClient';

// Current active challenge
export const mockCurrentChallenge: Challenge = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Touch Grass Challenge",
  description: "Take a selfie of yourself touching grass in nature. Get outside and connect with nature! 🌱",
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  participantCount: 42,
  chainCount: 1,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
};

// All challenges
export const mockChallenges: Challenge[] = [
  mockCurrentChallenge,
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Sunrise Photography",
    description: "Capture the beauty of sunrise from your location",
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    participantCount: 127,
    chainCount: 3,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// The single chain for MVP (ID = "1")
export const mockChain: Chain = {
  id: "1",
  name: "TouchGrass Chain",
  challengeId: mockCurrentChallenge.id,
  length: 7,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
};

// Mock submissions for the chain
export const mockSubmissions: Submission[] = [
  {
    id: "sub-001",
    sha256Hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    tokenOwnerAddress: "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy",
    userWalletAddress: "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=1",
    tagline: "First touch of grass today! 🌿",
    chainPosition: 1,
    status: "verified",
    transactionId: "CkpZqGxQKEJikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-002",
    sha256Hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123457",
    tokenOwnerAddress: "B62qmXzXHpNqaWpZ5VWfhgKxEhKGYHdvqL2GYXPihDevmM8MPMSKpfY",
    userWalletAddress: "B62qmXzXHpNqaWpZ5VWfhgKxEhKGYHdvqL2GYXPihDevmM8MPMSKpfY",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=2",
    tagline: "Morning dew on grass",
    chainPosition: 2,
    status: "verified",
    transactionId: "CkpYpFwPJDKhikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-003",
    sha256Hash: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef123458",
    tokenOwnerAddress: "B62qnVBxSbWTxKjkUgLbdBD1KqZWYYZFKCLQ7SQxKPWFGgFYHwKpHAx",
    userWalletAddress: "B62qnVBxSbWTxKjkUgLbdBD1KqZWYYZFKCLQ7SQxKPWFGgFYHwKpHAx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=3",
    tagline: "Barefoot in the park",
    chainPosition: 3,
    status: "verified",
    transactionId: "CkpXoEvOIDJgikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-004",
    sha256Hash: "d4e5f6789012345678901234567890abcdef1234567890abcdef123459",
    tokenOwnerAddress: "B62qkYgXYkzT5fuPNhMEHk8ouiThjNNDSTMPL3mMcqpZWgAaZqXQvBK",
    userWalletAddress: "B62qkYgXYkzT5fuPNhMEHk8ouiThjNNDSTMPL3mMcqpZWgAaZqXQvBK",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=4",
    tagline: "Grass meditation session",
    chainPosition: 4,
    status: "verified",
    transactionId: "CkpWnDuNHCIfhkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-005",
    sha256Hash: "e5f6789012345678901234567890abcdef1234567890abcdef12345a",
    tokenOwnerAddress: "B62qrLSPqVPZjcSFkFdaeYaYqFqxbJpZDYLBfLxPKMAdjpCKGhZDCHx",
    userWalletAddress: "B62qrLSPqVPZjcSFkFdaeYaYqFqxbJpZDYLBfLxPKMAdjpCKGhZDCHx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=5",
    chainPosition: 5,
    status: "verified",
    transactionId: "CkpVmCtMGBHegkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-006",
    sha256Hash: "f6789012345678901234567890abcdef1234567890abcdef12345b",
    tokenOwnerAddress: "B62qpzqF5ZBh8CzgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaANK",
    userWalletAddress: "B62qpzqF5ZBh8CzgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaANK",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=6",
    tagline: "Sunset grass touching",
    chainPosition: 6,
    status: "verified",
    transactionId: "CkpUlBsLFAGdfkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-007",
    sha256Hash: "0789012345678901234567890abcdef1234567890abcdef12345c",
    tokenOwnerAddress: "B62qoRzYYXZx5hgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaZZZ",
    userWalletAddress: "B62qoRzYYXZx5hgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaZZZ",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    imageUrl: "https://picsum.photos/400/400?random=7",
    tagline: "Fresh cut grass vibes",
    chainPosition: 7,
    status: "verified",
    transactionId: "CkpTkArKE9FcekqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to simulate API delay
export const simulateApiDelay = () =>
  new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));