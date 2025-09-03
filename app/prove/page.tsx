"use client";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DragDropUpload from "../components/DragDropUpload";
import TransactionDisplay from "../components/TransactionDisplay";
import Button from "../components/Button";
import BackToHomeButton from "../components/BackToHomeButton";
import StatusMessage from "../components/StatusMessage";
import { uploadImage, checkStatus } from "../lib/backendClient";
import styles from "./prove.module.css";

export default function ProvePage() {
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    dataUrl: string;
    buffer: Uint8Array;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const [status, setStatus] = useState("Upload your image to begin");
  const [currentStep, setCurrentStep] = useState<
    "upload" | "ready" | "processing" | "confirming" | "complete"
  >("upload");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    tokenOwnerAddress: string;
    sha256Hash: string;
    transactionHash?: string;
  } | null>(null);

  const handleImageSelect = (
    file: File,
    dataUrl: string,
    buffer: Uint8Array
  ) => {
    setSelectedImage({ file, dataUrl, buffer });
    setCurrentStep("ready");
    setStatus('Image loaded. Click "Submit for Authentication" to continue.');
    setError(null);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setCurrentStep("upload");
    setStatus("Upload your image to begin");
    setError(null);
    setResult(null);
  };

  const handleSubmitAuthenticity = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setProcessing(true);
    setCurrentStep("processing");
    setError(null);

    try {
      // Initialize worker and generate keypair
      setStatus("Preparing image for authentication...");
      const AuthenticityWorkerClient = (
        await import("../AuthenticityWorkerClient")
      ).default;
      const worker = new AuthenticityWorkerClient();

      // Generate keypair silently (temporary until Auro wallet integration)
      const keypair = await worker.generateKeypair();

      // Compute commitment
      setStatus("Computing image fingerprint...");
      const commitmentResult = await worker.computeOnChainCommitmentWeb(
        selectedImage.buffer
      );
      console.log("Frontend commitment result:", {
        sha256: commitmentResult.sha256Hash,
        poseidon: commitmentResult.poseidonCommitmentString
      });

      // Sign SHA256 hash (backend expects signature on SHA256, not Poseidon)
      setStatus("Creating digital signature...");
      const signatureResult = await worker.signSHA256Hash(
        keypair.privateKeyBase58,
        commitmentResult.sha256Hash
      );
      console.log("Signature created:", {
        signature: signatureResult.signatureBase58,
        publicKey: signatureResult.publicKeyBase58
      });

      // Upload to backend
      setStatus("Uploading image to server...");
      const uploadResult = await uploadImage(
        selectedImage.file,
        keypair.publicKeyBase58,
        signatureResult.signatureBase58
      );
      console.log("Upload successful, starting to poll status...");

      //Poll status until complete
      setStatus("Submitting to blockchain...");
      await pollForCompletion(
        commitmentResult.sha256Hash,
        uploadResult.tokenOwnerAddress
      );
    } catch (error: any) {
      console.error("Authentication submission failed:", error);
      setError(error.message || "Submission failed. Please try again.");
      setStatus("Authentication submission failed");
      setCurrentStep("ready");
    } finally {
      setProcessing(false);
    }
  };

  const pollForCompletion = async (
    sha256Hash: string,
    tokenOwnerAddress: string
  ): Promise<void> => {
    const maxAttempts = 60; // 10 minutes max (10 second intervals)
    let attempts = 0;
    const startTime = Date.now();
    let transactionIdTime: number | null = null;

    const poll = async (): Promise<void> => {
      attempts++;
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      try {
        const statusResult = await checkStatus(sha256Hash);
        console.log(`[${elapsedSeconds}s] Status check:`, statusResult);

        // Track when transaction ID first appears
        if (statusResult.transactionId && !transactionIdTime) {
          transactionIdTime = Date.now();
          const timeToTxId = Math.floor((transactionIdTime - startTime) / 1000);
          console.log(
            `Transaction ID appeared after ${timeToTxId} seconds (${Math.floor(
              timeToTxId / 60
            )}m ${timeToTxId % 60}s)`
          );
          
          // Switch to confirming state when transaction hash appears
          setResult({ 
            tokenOwnerAddress, 
            sha256Hash,
            transactionHash: statusResult.transactionId
          });
          setCurrentStep("confirming");
          setStatus("Transaction submitted! Waiting for blockchain confirmation...");
        }
        console.log(
          "Transaction ID:",
          statusResult.transactionId || "Not present yet"
        );

        if (statusResult.status === "verified") {
          const totalTime = Math.floor((Date.now() - startTime) / 1000);
          console.log(
            `VERIFIED after ${totalTime} seconds (${Math.floor(
              totalTime / 60
            )}m ${totalTime % 60}s)`
          );
          setResult({ 
            tokenOwnerAddress, 
            sha256Hash,
            transactionHash: statusResult.transactionId
          });
          setCurrentStep("complete");
          setStatus(
            "Authentication complete! Your image proof is now on the blockchain."
          );
          return;
        }

        if (statusResult.status === "failed") {
          // Handle failed status properly instead of ignoring it
          const errorMsg =
            statusResult.errorMessage || "Proof generation failed";
          throw new Error(errorMsg);
        }

        if (
          statusResult.status === "pending" ||
          statusResult.status === "processing"
        ) {
          if (attempts >= maxAttempts) {
            throw new Error("Proof generation timed out. Please try again.");
          }

          // Update status message based on actual backend status
          if (statusResult.status === "pending") {
            setStatus("Queued for processing...");
          } else if (statusResult.status === "processing") {
            // Processing can mean two things:
            // 1. Generating proof (no transaction ID yet)
            // 2. Awaiting blockchain confirmation (transaction ID present)
            if (statusResult.transactionId) {
              // This case is already handled above when transaction ID first appears
              setStatus("Awaiting blockchain confirmation...");
            } else {
              setStatus("Generating proof...");
            }
          }

          // Poll again in 10 seconds
          setTimeout(poll, 10000);
          return;
        }

        throw new Error(`Unexpected status: ${statusResult.status}`);
      } catch (error: any) {
        console.error("Status polling error:", error);

        // Retry on network errors
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("ERR_NETWORK")
        ) {
          console.log("Network error, retrying in 5 seconds...");
          setTimeout(poll, 5000);
          return;
        }

        throw error;
      }
    };

    await poll();
  };

  return (
    <>
      <Head>
        <title>Prove Image Authenticity</title>
        <meta
          name="description"
          content="Upload and certify your original images on-chain"
        />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <main className={styles.proveContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Prove Image Authenticity</h1>
          <p className={styles.subtitle}>
            Upload your original image to create a permanent proof on the Mina
            blockchain
          </p>
        </div>

        <div className={styles.uploadSection}>
          <DragDropUpload
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            processing={processing}
            placeholder="Drop your image here to create proof"
          />

          {selectedImage && currentStep !== "upload" && (
            <div className={styles.imageInfo}>
              <p className={styles.infoText}>
                Image loaded: <strong>{selectedImage.file.name}</strong>
              </p>
              <p className={styles.infoText}>
                Size: {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {currentStep === "ready" && selectedImage && (
            <div className={styles.actionSection}>
              <Button
                variant="primary"
                onClick={handleSubmitAuthenticity}
                disabled={processing}
              >
                Submit for Authentication
              </Button>
            </div>
          )}

          {(processing || currentStep === "processing") && (
            <div className={styles.statusSection}>
              <StatusMessage
                type="processing"
                message={status}
                showSpinner={true}
              />
            </div>
          )}

          {error && (
            <div className={styles.errorSection}>
              <p className={styles.errorText}>{error}</p>
              {currentStep === "ready" && (
                <Button
                  onClick={handleSubmitAuthenticity}
                  disabled={processing}
                  variant="secondary"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {(currentStep === "confirming" || currentStep === "complete") && result && (
            <TransactionDisplay
              tokenOwner={result.tokenOwnerAddress}
              imageHash={result.sha256Hash}
              transactionHash={result.transactionHash}
              status={currentStep === "confirming" ? "pending" : "success"}
              title={currentStep === "confirming" ? "Transaction Submitted" : "Authentication Complete"}
              note={currentStep === "confirming" 
                ? "Your transaction is being confirmed on the Mina blockchain. This may take 2-3 minutes."
                : "Your image authenticity proof is now recorded on the Mina blockchain."}
            />
          )}
        </div>

        <BackToHomeButton />
      </main>
    </>
  );
}
