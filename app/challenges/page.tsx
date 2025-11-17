'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllChallenges, getActiveChallenges, getChainsByChallenge } from '../lib/backendClient';
import type { Challenge, Chain } from '../lib/backendClient';
import GrassyButton from '../components/GrassyButton';
import SubmissionCard from '../components/SubmissionCard';
import StatBox from '../components/StatBox';
import styles from './challenges.module.css';

export default function ChallengesPage() {
  const router = useRouter();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [challengeChains, setChallengeChains] = useState<Map<string, Chain | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        setLoading(true);
        setError(null);

        // Get all challenges and categorize them
        const allChallenges = await getAllChallenges();
        const now = new Date();

        const active: Challenge[] = [];
        const completed: Challenge[] = [];

        allChallenges.forEach(challenge => {
          const endTime = new Date(challenge.endTime);
          if (endTime > now) {
            active.push(challenge);
          } else {
            completed.push(challenge);
          }
        });

        setActiveChallenges(active);
        setCompletedChallenges(completed);

        const chainsMap = new Map<string, Chain | null>();
        await Promise.all(
          active.map(async (challenge) => {
            try {
              const chains = await getChainsByChallenge(challenge.id);
              chainsMap.set(challenge.id, chains.length > 0 ? chains[0] : null);
            } catch {
              chainsMap.set(challenge.id, null);
            }
          })
        );
        setChallengeChains(chainsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, []);

  if (loading) {
    return (
      <main className={styles.loading}>
        <p>Loading challenges...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.error}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <GrassyButton variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </GrassyButton>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>TouchGrass Challenges</h1>
          <p className={styles.subtitle}>Join photo challenges and connect with nature!</p>
        </header>

        {/* Active Challenges Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Active Challenges
            {activeChallenges.length > 0 && (
              <span className={styles.count}>({activeChallenges.length})</span>
            )}
          </h2>
          
          {activeChallenges.length === 0 ? (
            <SubmissionCard centered className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>No Active Challenges</h3>
              <p>Check back soon for new challenges! Previous challenges are available below.</p>
            </SubmissionCard>
          ) : (
            <div className={styles.challengesGrid}>
              {activeChallenges.map((challenge) => {
                const chain = challengeChains.get(challenge.id);
                return (
                  <SubmissionCard
                    key={challenge.id}
                    className={styles.challengeCard}
                  >
                    <div className={styles.challengeIcon}>🌱</div>
                    <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                    <p className={styles.challengeDescription}>{challenge.description}</p>

                    <div className={styles.statsGrid}>
                      <StatBox value={challenge.participantCount} label="Participants" />
                      <StatBox value={challenge.chainCount} label="Chains" />
                    </div>

                    <div className={styles.challengeStatus}>
                      <p className={styles.activeStatus}>
                        🟢 Active until {new Date(challenge.endTime).toLocaleDateString()}
                      </p>
                    </div>

                    <div className={styles.buttonGroup}>
                      <GrassyButton
                        variant="primary"
                        size="short"
                        onClick={() => router.push(`/submit?chainId=${chain?.id || "1"}`)}
                      >
                        Join Challenge
                      </GrassyButton>

                      {chain && (
                        <GrassyButton
                          variant="secondary"
                          size="short"
                          onClick={() => router.push(`/chain/${chain.id}`)}
                        >
                          View Chain
                        </GrassyButton>
                      )}
                    </div>
                  </SubmissionCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Challenges Section */}
        {completedChallenges.length > 0 && (
          <section className={styles.section}>
            <button
              className={styles.sectionToggle}
              onClick={() => setShowCompleted(!showCompleted)}
              aria-expanded={showCompleted}
            >
              <h2 className={styles.sectionTitle}>
                Previous Challenges
                <span className={styles.count}>({completedChallenges.length})</span>
              </h2>
              <span className={`${styles.toggleIcon} ${showCompleted ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            
            {showCompleted && (
              <div className={styles.challengesGrid}>
                {completedChallenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challenge/${challenge.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <SubmissionCard
                      className={`${styles.challengeCard} ${styles.completedCard} ${styles.clickable}`}
                    >
                      <div className={styles.challengeIcon}>✅</div>
                      <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                      <p className={styles.challengeDescription}>{challenge.description}</p>

                      <div className={styles.statsGrid}>
                        <StatBox value={challenge.participantCount} label="Participants" />
                        <StatBox value={challenge.chainCount} label="Chains" />
                      </div>

                      <div className={styles.challengeStatus}>
                        <p className={styles.completedStatus}>
                          ✅ Completed on {new Date(challenge.endTime).toLocaleDateString()}
                        </p>
                      </div>
                    </SubmissionCard>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}