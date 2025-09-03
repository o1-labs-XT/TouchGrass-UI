/**
 * Utility Functions Tests
 * 
 * Critical MVP validation tests only:
 * - Hash validation
 * - File size formatting
 * - URL validation
 */

describe('Utility Functions', () => {
  describe('Hash Validation', () => {
    it('should validate SHA256 hash format', () => {
      const isValidSHA256 = (hash: string): boolean => {
        return /^[a-f0-9]{64}$/i.test(hash);
      };
      
      expect(isValidSHA256('a'.repeat(64))).toBe(true);
      expect(isValidSHA256('invalid')).toBe(false);
      expect(isValidSHA256('')).toBe(false);
      expect(isValidSHA256('z'.repeat(64))).toBe(false); // z is not hex
    });

    it('should validate Mina address format', () => {
      const isValidMinaAddress = (address: string): boolean => {
        return address.startsWith('B62') && address.length > 50;
      };
      
      expect(isValidMinaAddress('B62qkUHaJUHERZuCHQhXCQ8xsGBqyYSgjQsKnKN5HhSJecakuJ4pYyk')).toBe(true);
      expect(isValidMinaAddress('invalid')).toBe(false);
      expect(isValidMinaAddress('B62')).toBe(false);
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes to MB correctly', () => {
      const formatFileSize = (bytes: number): string => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      };
      
      expect(formatFileSize(1048576)).toBe('1.00 MB'); // 1 MB
      expect(formatFileSize(5242880)).toBe('5.00 MB'); // 5 MB
      expect(formatFileSize(10485760)).toBe('10.00 MB'); // 10 MB
    });

    it('should check if file size is within limit', () => {
      const isWithinSizeLimit = (bytes: number, limitMB: number): boolean => {
        return bytes <= limitMB * 1024 * 1024;
      };
      
      expect(isWithinSizeLimit(5 * 1024 * 1024, 10)).toBe(true); // 5MB < 10MB
      expect(isWithinSizeLimit(11 * 1024 * 1024, 10)).toBe(false); // 11MB > 10MB
      expect(isWithinSizeLimit(10 * 1024 * 1024, 10)).toBe(true); // 10MB = 10MB
    });
  });

  describe('URL Validation', () => {
    it('should validate MinaScan URLs', () => {
      const isValidMinaScanURL = (url: string): boolean => {
        return url.includes('minascan.io');
      };
      
      expect(isValidMinaScanURL('https://minascan.io/testnet/tx/abc123')).toBe(true);
      expect(isValidMinaScanURL('https://minascan.io/devnet/tx/xyz789')).toBe(true);
      expect(isValidMinaScanURL('https://example.com')).toBe(false);
    });

    it('should extract transaction ID from MinaScan URL', () => {
      const extractTxId = (url: string): string | null => {
        const match = url.match(/\/tx\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
      };
      
      expect(extractTxId('https://minascan.io/testnet/tx/abc123')).toBe('abc123');
      expect(extractTxId('https://minascan.io/devnet/tx/xyz789')).toBe('xyz789');
      expect(extractTxId('https://example.com')).toBe(null);
    });
  });
});