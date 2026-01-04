import { API_BASE_URL, getAuthHeaders, handleResponse } from './config';

export default class AdminAPI {
  static reportUrl(path) {
    return `${API_BASE_URL}${path}`;
  }

  static async getPendingInstitutions() {
    const res = await fetch(`${API_BASE_URL}/api/admin/pending-institutions`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async approveInstitution(userId) {
    const res = await fetch(`${API_BASE_URL}/api/admin/approve-institution/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async rejectInstitution(userId) {
    const res = await fetch(`${API_BASE_URL}/api/admin/reject-institution/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getApprovedInstitutions() {
    const res = await fetch(`${API_BASE_URL}/api/universities/catalog`);
    return handleResponse(res);
  }

  static async getInstitutionsStats() {
    const res = await fetch(`${API_BASE_URL}/api/admin/institutions/stats`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getBookings() {
    const res = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async updateBookingStatus(id, status) {
    const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  }

  static async getUsageByInstitution() {
    const res = await fetch(`${API_BASE_URL}/api/admin/usage/by-institution`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getHederaBalance() {
    const res = await fetch(`${API_BASE_URL}/api/admin/hedera/balance`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getXrpBalance() {
    const res = await fetch(`${API_BASE_URL}/api/admin/xrp/balance`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getXrpStatus() {
    const res = await fetch(`${API_BASE_URL}/api/admin/xrp/status`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getBillingConsumption() {
    const res = await fetch(`${API_BASE_URL}/api/admin/billing/consumption`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getAlertsConfig() {
    const res = await fetch(`${API_BASE_URL}/api/admin/alerts/config`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async setAlertsConfig(payload) {
    const res = await fetch(`${API_BASE_URL}/api/admin/alerts/config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  static async getSystemStatus() {
    const res = await fetch(`${API_BASE_URL}/api/admin/system-status`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getVerificationStatus() {
    const res = await fetch(`${API_BASE_URL}/api/verification/status`);
    return handleResponse(res);
  }

  static async getAlgorandStatus() {
    const res = await fetch(`${API_BASE_URL}/api/admin/algorand/status`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getBackupStats() {
    const res = await fetch(`${API_BASE_URL}/api/admin/backup-stats`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }

  static async getRate(params = '') {
    const res = await fetch(`${API_BASE_URL}/api/admin/rate${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }

  static async setRate(payload) {
    const res = await fetch(`${API_BASE_URL}/api/admin/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  static async deleteRate() {
    const res = await fetch(`${API_BASE_URL}/api/admin/rate`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }

  static async getMetrics() {
    const res = await fetch(`${API_BASE_URL}/api/metrics/json`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }

  static async sendConnectionMetrics(payload) {
    // This endpoint might not return JSON or might not need handleResponse strictly if fire-and-forget,
    // but better to be consistent.
    const res = await fetch(`${API_BASE_URL}/metrics/connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    // The original code swallowed errors for this one.
    // handleResponse throws on error, which is fine if we catch it in the component.
    return handleResponse(res);
  }

  static async generatePartnerKey(partnerName, universityId) {
    const res = await fetch(`${API_BASE_URL}/api/partner/generate-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ partnerName, universityId }),
    });
    return handleResponse(res);
  }
}
