/**
 * Mock data that exactly matches Swagger API specification
 * This allows us to develop the UI without needing the backend running
 */

import type { Challenge, Chain, Submission } from './backendClient';

// Current active challenge
export const mockCurrentChallenge: Challenge = {
  id: "1",
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
    id: "2",
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
    walletAddress: "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy",
    signature: "7mXGxQKEJikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    tagline: "First touch of grass today! 🌿",
    chainPosition: 1,
    status: "complete",
    transactionId: "CkpZqGxQKEJikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-002",
    sha256Hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123457",
    walletAddress: "B62qmXzXHpNqaWpZ5VWfhgKxEhKGYHdvqL2GYXPihDevmM8MPMSKpfY",
    signature: "7mXFwPJDKhikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123457",
    tagline: "Morning dew on grass",
    chainPosition: 2,
    status: "complete",
    transactionId: "CkpYpFwPJDKhikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-003",
    sha256Hash: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef123458",
    walletAddress: "B62qnVBxSbWTxKjkUgLbdBD1KqZWYYZFKCLQ7SQxKPWFGgFYHwKpHAx",
    signature: "7mXEvOIDJgikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/c3d4e5f6789012345678901234567890abcdef1234567890abcdef123458",
    tagline: "Barefoot in the park",
    chainPosition: 3,
    status: "complete",
    transactionId: "CkpXoEvOIDJgikqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-004",
    sha256Hash: "d4e5f6789012345678901234567890abcdef1234567890abcdef123459",
    walletAddress: "B62qkYgXYkzT5fuPNhMEHk8ouiThjNNDSTMPL3mMcqpZWgAaZqXQvBK",
    signature: "7mXDuNHCIfhkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/d4e5f6789012345678901234567890abcdef1234567890abcdef123459",
    tagline: "Grass meditation session",
    chainPosition: 4,
    status: "complete",
    transactionId: "CkpWnDuNHCIfhkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-005",
    sha256Hash: "e5f6789012345678901234567890abcdef1234567890abcdef12345a",
    walletAddress: "B62qrLSPqVPZjcSFkFdaeYaYqFqxbJpZDYLBfLxPKMAdjpCKGhZDCHx",
    signature: "7mXCtMGBHegkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/e5f6789012345678901234567890abcdef1234567890abcdef12345a",
    chainPosition: 5,
    status: "complete",
    transactionId: "CkpVmCtMGBHegkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-006",
    sha256Hash: "f6789012345678901234567890abcdef1234567890abcdef12345b",
    walletAddress: "B62qpzqF5ZBh8CzgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaANK",
    signature: "7mXBsLFAGdfkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/f6789012345678901234567890abcdef1234567890abcdef12345b",
    tagline: "Sunset grass touching",
    chainPosition: 6,
    status: "complete",
    transactionId: "CkpUlBsLFAGdfkqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub-007",
    sha256Hash: "0789012345678901234567890abcdef1234567890abcdef12345c",
    walletAddress: "B62qoRzYYXZx5hgDHFkDaB4KjPZnF1b5HtPgqnYYZvCuvZqPgHaZZZ",
    signature: "7mXArKE9FcekqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    challengeId: mockCurrentChallenge.id,
    chainId: "1",
    storageKey: "images/0789012345678901234567890abcdef1234567890abcdef12345c",
    tagline: "Fresh cut grass vibes",
    chainPosition: 7,
    status: "complete",
    transactionId: "CkpTkArKE9FcekqiWZNJSbRpMxwuWYUEi5MYpD6UjLzWmLKqfSNwfx",
    retryCount: 0,
    challengeVerified: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to simulate API delay
export const simulateApiDelay = () =>
  new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));