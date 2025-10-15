'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllChallenges, getActiveChallenges, getChainsByChallenge } from '../lib/backendClient';
import type { Challenge } from '../lib/backendClient';
import Button from '../components/Button';
import Card from '../components/Card';
import StatBox from '../components/StatBox';
import styles from './challenges.module.css';

export default function ChallengesPage() {
  const router = useRouter();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, []);

  const handleChallengeClick = (challengeId: string) => {
    router.push(`/challenge/${challengeId}`);
  };

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
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
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
            🌟 Active Challenges
            {activeChallenges.length > 0 && (
              <span className={styles.count}>({activeChallenges.length})</span>
            )}
          </h2>
          
          {activeChallenges.length === 0 ? (
            <Card centered className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>No Active Challenges</h3>
              <p>Check back soon for new challenges! Previous challenges are available below.</p>
            </Card>
          ) : (
            <div className={styles.challengesGrid}>
              {activeChallenges.map((challenge) => (
                <Card 
                  key={challenge.id} 
                  className={styles.challengeCard}
                  onClick={() => handleChallengeClick(challenge.id)}
                >
                  <div className={styles.challengeIcon}>🌱</div>
                  <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                  <p className={styles.challengeDescription}>{challenge.description}</p>
                  
                  <div className={styles.statsGrid}>
                    <StatBox value={challenge.participantCount} label="Participants" />
                    <StatBox value={challenge.chainCount} label="Chains" />
                  </div>
                  
                  <div className={styles.challengeMeta}>
                    <p className={styles.timeRemaining}>
                      Ends: {new Date(challenge.endTime).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
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
                📚 Previous Challenges
                <span className={styles.count}>({completedChallenges.length})</span>
              </h2>
              <span className={`${styles.toggleIcon} ${showCompleted ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            
            {showCompleted && (
              <div className={styles.challengesGrid}>
                {completedChallenges.map((challenge) => (
                  <Card 
                    key={challenge.id} 
                    className={`${styles.challengeCard} ${styles.completedCard}`}
                    onClick={() => handleChallengeClick(challenge.id)}
                  >
                    <div className={styles.challengeIcon}>✅</div>
                    <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                    <p className={styles.challengeDescription}>{challenge.description}</p>
                    
                    <div className={styles.statsGrid}>
                      <StatBox value={challenge.participantCount} label="Participants" />
                      <StatBox value={challenge.chainCount} label="Chains" />
                    </div>
                    
                    <div className={styles.challengeMeta}>
                      <p className={styles.completedDate}>
                        Completed: {new Date(challenge.endTime).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}