interface ChallengePageProps {
  params: {
    id: string;
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  return (
    <main>
      <h1>Challenge Page</h1>
      <p>Challenge ID: {params.id}</p>
    </main>
  );
}