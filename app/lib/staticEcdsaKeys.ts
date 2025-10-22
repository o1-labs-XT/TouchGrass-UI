/**
 * Static ECDSA public key coordinates for server-side signing
 * 
 * This public key corresponds to the private key stored in ECDSA_PRIVATE_KEY
 * environment variable. All image signatures will be generated using this
 * static keypair instead of per-user generated keypairs.
 */
export const STATIC_ECDSA_PUBLIC_KEY = {
  x: 'd9e9bbfefb7b78124a1765a25b112293e02da05572f8e91a096b8f6aa9dfa013',
  y: '319e75646360183c3508a5080e910ca6c61cf7c3eaac8053f15c47d9db66fd24'
};