const axios = require('axios');
const logger = require('../utils/logger');

class HubSpotAuth {
  constructor() {
    this.accessToken = process.env.HUBSPOT_ACCESS_TOKEN || null;
    this.refreshToken = process.env.HUBSPOT_REFRESH_TOKEN || null;
    this.clientId = process.env.HUBSPOT_CLIENT_ID || null;
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET || null;
    this.tokenExpiresAt = null;
  }

  isConfigured() {
    return !!(this.clientId && this.clientSecret && (this.accessToken || this.refreshToken));
  }

  async getAccessToken() {
    // Si tenemos token de acceso y no ha expirado, usarlo
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Si tenemos refresh token, obtener nuevo access token
    if (this.refreshToken) {
      try {
        const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken
        });

        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
        this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 1000));
        
        logger.info('HubSpot access token refreshed successfully');
        return this.accessToken;
      } catch (error) {
        logger.error('HubSpot token refresh failed:', error.response?.data || error.message);
        throw new Error('Failed to refresh HubSpot access token');
      }
    }

    // Si tenemos access token estático (sin OAuth)
    if (this.accessToken) {
      return this.accessToken;
    }

    throw new Error('HubSpot authentication not configured');
  }

  async makeAuthenticatedRequest(config) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        logger.warn('HubSpot authentication failed, attempting token refresh...');
        // Force token refresh on next request
        this.accessToken = null;
        this.tokenExpiresAt = null;
        throw error;
      }
      throw error;
    }
  }

  // Método para iniciar el flujo OAuth (para instalación)
  getOAuthRedirectUrl(redirectUri, scopes = ['crm.objects.contacts.write', 'crm.objects.deals.write']) {
    if (!this.clientId) {
      throw new Error('HubSpot client ID not configured');
    }

    const baseUrl = 'https://app.hubspot.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: Math.random().toString(36).substring(7)
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Método para intercambiar código por tokens
  async exchangeCodeForTokens(code, redirectUri) {
    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: redirectUri
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 1000));

      logger.info('HubSpot OAuth authentication completed successfully');
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('HubSpot OAuth token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }
}

module.exports = { HubSpotAuth: new HubSpotAuth() };