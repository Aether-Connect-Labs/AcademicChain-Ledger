
export class SecurityService {
  /**
   * Generates a SHA-256 hash of the provided data object or string.
   * @param data - The data to hash (object or string).
   * @returns The hexadecimal representation of the hash.
   */
  static async generateSHA256(data: any): Promise<string> {
    const msgBuffer = new TextEncoder().encode(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypts sensitive data (mock implementation for demonstration).
   * In a real scenario, use AES-GCM with a proper key management system.
   */
  static async encryptData(data: string, key: string): Promise<string> {
    // Mock encryption for demo - implies AES-256-GCM in production
    return `encrypted_${await this.generateSHA256(data + key)}`;
  }
}
