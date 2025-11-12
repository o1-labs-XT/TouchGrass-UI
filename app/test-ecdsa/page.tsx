'use client';
import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

export default function TestECDSAPage() {
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('=== Starting ECDSA Test ===');

      const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
      const worker = new TouchGrassWorkerClient();

      // Step 1: Generate ECDSA keypair
      console.log('Step 1: Generating ECDSA keypair...');
      const ecKeypair = await worker.generateECKeypair();
      console.log('ECDSA Keypair:', ecKeypair);

      // Step 2: Create a test image buffer
      console.log('Step 2: Creating test image...');
      const testImageData = new Uint8Array(1024);
      crypto.getRandomValues(testImageData);

      // Step 3: Compute hash
      console.log('Step 3: Computing hash...');
      const commitment = await worker.computeOnChainCommitmentWeb(testImageData);
      console.log('Hash result:', commitment);

      // Step 4: Sign with ECDSA
      console.log('Step 4: Signing with ECDSA...');
      const signature = await worker.signECDSA(
        ecKeypair.privateKeyHex,
        commitment.sha256Hash
      );
      console.log('ECDSA Signature:', signature);

      // Validate output format
      const validation = {
        privateKeyLength: ecKeypair.privateKeyHex.length === 64,
        publicKeyXLength: ecKeypair.publicKeyXHex.length === 64,
        publicKeyYLength: ecKeypair.publicKeyYHex.length === 64,
        signatureRLength: signature.signatureR.length === 64,
        signatureSLength: signature.signatureS.length === 64,
        allHex: [
          ecKeypair.privateKeyHex,
          ecKeypair.publicKeyXHex,
          ecKeypair.publicKeyYHex,
          signature.signatureR,
          signature.signatureS
        ].every(s => /^[0-9a-f]+$/i.test(s))
      };

      setResults({
        ecKeypair,
        commitment,
        signature,
        validation
      });

      console.log('=== Test Complete ===');
      console.log('Validation:', validation);

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ECDSA Implementation Test</h1>
      <p>This page tests the browser-safe ECDSA keypair generation and signing.</p>

      <div style={{ margin: '2rem 0' }}>
        <Card>
          <Button onClick={runTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Run ECDSA Test'}
          </Button>
        </Card>
      </div>

      {error && (
        <Card style={{ background: '#fee', border: '1px solid #c00', margin: '2rem 0' }}>
          <h3 style={{ color: '#c00' }}>Error</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>
        </Card>
      )}

      {results && (
        <Card style={{ margin: '2rem 0' }}>
          <h2>Test Results</h2>

          <h3>1. ECDSA Keypair</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '1rem' }}>
            <div><strong>Private Key:</strong> {results.ecKeypair.privateKeyHex}</div>
            <div><strong>Public Key X:</strong> {results.ecKeypair.publicKeyXHex}</div>
            <div><strong>Public Key Y:</strong> {results.ecKeypair.publicKeyYHex}</div>
          </div>

          <h3>2. Image Hash</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '1rem' }}>
            <div><strong>SHA256:</strong> {results.commitment.sha256Hash}</div>
          </div>

          <h3>3. ECDSA Signature</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '1rem' }}>
            <div><strong>R:</strong> {results.signature.signatureR}</div>
            <div><strong>S:</strong> {results.signature.signatureS}</div>
          </div>

          <h3>4. Validation</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {Object.entries(results.validation).map(([key, value]) => (
              <div key={key} style={{ color: value ? 'green' : 'red' }}>
                {key}: {String(value)}
              </div>
            ))}
          </div>

          <h3>5. Backend Format (for copy-paste testing)</h3>
          <pre style={{ background: '#f5f5f5', padding: '1rem', overflow: 'auto', fontSize: '11px' }}>
{`signatureR: ${results.signature.signatureR}
signatureS: ${results.signature.signatureS}
publicKeyX: ${results.ecKeypair.publicKeyXHex}
publicKeyY: ${results.ecKeypair.publicKeyYHex}
sha256Hash: ${results.commitment.sha256Hash}`}
          </pre>
        </Card>
      )}

      <Card style={{ margin: '2rem 0', background: '#ffffcc' }}>
        <h3>What to verify:</h3>
        <ol>
          <li>All hex strings should be 64 characters (32 bytes)</li>
          <li>All values should be valid hex (0-9, a-f)</li>
          <li>Check browser console for detailed logs</li>
          <li>Compare output format with backend test-upload.mts</li>
        </ol>
      </Card>
    </main>
  );
}
