/**
 * Static ECDSA public key coordinates for server-side signing
 *
 * This public key corresponds to the private key stored in ECDSA_PRIVATE_KEY
 * environment variable. All image signatures will be generated using this
 * static keypair instead of per-user generated keypairs.
 */
export const STATIC_ECDSA_PUBLIC_KEY = {
  x: "0e43b3c5e43030ab054cebadca1c6f8817cdccbd6fbefde18eb00287eabd1f12",
  y: "75181cef858c48cdaa6b54066748b05cacf20027001634cfa3d48d165ed5d93a",
};
