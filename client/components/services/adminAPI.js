export default class AdminAPI {
  static base() {
    const base = import.meta.env?.VITE_API_URL || '';
    return base ? base.replace(/\/$/, '') : '';
  }

  static authHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async getPendingInstitutions() {
    const res = await fetch(`${this.base()}/api/admin/pending-institutions`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async approveInstitution(userId) {
    const res = await fetch(`${this.base()}/api/admin/approve-institution/${userId}`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async rejectInstitution(userId) {
    const res = await fetch(`${this.base()}/api/admin/reject-institution/${userId}`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async getApprovedInstitutions() {
    const res = await fetch(`${this.base()}/api/universities/catalog`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async getInstitutionsStats() {
    const res = await fetch(`${this.base()}/api/admin/institutions/stats`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}
