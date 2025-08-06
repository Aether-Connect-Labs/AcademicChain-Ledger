import { injectable } from 'inversify';
import axios from 'axios';

@injectable()
export class LinkedInService {
  private readonly apiUrl = 'https://api.linkedin.com/v2';
  private accessToken: string;

  constructor() {
    this.accessToken = ''; // Initialize with empty string, will be refreshed
    this.refreshToken(); // Call refreshToken to get an initial token
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        })
      );
      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error("Error refreshing LinkedIn token:", error);
      throw error;
    }
  }

  async verifyCredential(profileId: string, credentialId: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/profileCertifications/${profileId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: { q: credentialId }
      });
      
      return response.data.elements.length > 0;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.accessToken = await this.refreshToken();
        return this.verifyCredential(profileId, credentialId);
      }
      throw error;
    }
  }

  async addCredentialToProfile(profileId: string, credentialData: any): Promise<void> {
    const payload = {
      authority: process.env.ACADEMICCHAIN_URN!,
      name: {
        localized: {
          en_US: credentialData.title,
        },
        preferredLocale: {
          country: 'US',
          language: 'en',
        },
      },
      licenseNumber: credentialData.id,
      startDate: {
        year: credentialData.issueYear,
        month: credentialData.issueMonth,
      },
    };

    try {
      await axios.post(
        `${this.apiUrl}/profileCertifications`,
        payload,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.accessToken = await this.refreshToken();
        await axios.post(
          `${this.apiUrl}/profileCertifications`,
          payload,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
      } else {
        throw error;
      }
    }
  }
}