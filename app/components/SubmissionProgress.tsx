"use client";
import React from "react";
import styles from "./SubmissionProgress.module.css";

interface SubmissionProgressProps {
  status: "awaiting_review" | "rejected" | "processing" | "complete";
  transactionId?: string;
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  failed: boolean;
  link?: string;
}

export default function SubmissionProgress({
  status,
  transactionId
}: SubmissionProgressProps) {
  const getProgressSteps = (): ProgressStep[] => {
    const isRejected = status === "rejected";
    const isProcessing = status === "processing";
    const isComplete = status === "complete";
    const hasTransaction = Boolean(transactionId);

    const network = process.env.NEXT_PUBLIC_MINA_NETWORK === "mainnet" ? "mainnet" : "devnet";
    return [
      {
        id: "admin_review",
        label: "Admin Review",
        description: "Submission reviewed by administrators",
        completed: !isRejected && (isProcessing || isComplete),
        current: status === "awaiting_review",
        failed: isRejected
      },
      {
        id: "proof_creation",
        label: "Proof Created",
        description: "Zero-knowledge proof generated for submission",
        completed: isComplete || (isProcessing && hasTransaction),
        current: isProcessing && !hasTransaction,
        failed: false
      },
      {
        id: "blockchain_tx",
        label: "Blockchain Transaction",
        description: "Transaction submitted to Mina Protocol",
        completed: isComplete && hasTransaction,
        current: isProcessing && hasTransaction && !isComplete,
        failed: false,
        link: transactionId
          ? `https://minascan.io/${network}/tx/${transactionId}`
          : undefined
      },
      {
        id: "complete",
        label: "Complete",
        description: "Submission verified and finalized on blockchain",
        completed: isComplete,
        current: false,
        failed: false
      }
    ];
  };

  const steps = getProgressSteps();

  const StepIcon = ({ step }: { step: ProgressStep }) => {
    if (step.failed) {
      return (
        <svg
          className={`${styles.stepIcon} ${styles.failed}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }

    if (step.completed) {
      return (
        <svg
          className={`${styles.stepIcon} ${styles.completed}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      );
    }

    if (step.current) {
      return (
        <div className={`${styles.stepIcon} ${styles.current}`}>
          <div className={styles.spinner}></div>
        </div>
      );
    }

    return (
      <div className={`${styles.stepIcon} ${styles.pending}`}>
        <div className={styles.dot}></div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Progress Timeline</h3>
      <div className={styles.progressTrack}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.step}>
            <div className={styles.stepHeader}>
              <StepIcon step={step} />
              {index < steps.length - 1 && (
                <div
                  className={`${styles.connector} ${
                    step.completed || step.failed
                      ? styles.connectorCompleted
                      : styles.connectorPending
                  }`}
                />
              )}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepLabel}>
                {step.link ? (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.stepLink}
                  >
                    {step.label}
                    <svg
                      className={styles.externalIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15,3 21,3 21,9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : (
                  step.label
                )}
              </div>
              <div className={styles.stepDescription}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
