const API_BASE_URL = import.meta.env.VITE_API_URL;

export const issuanceService = {
  createCredentialTemplate: (data) => {
    return {
      id: crypto.randomUUID(),
      type: data.credentialType,
      subject: {
        name: data.studentName,
        studentId: data.studentId,
        degree: data.degree,
        major: data.major,
      },
      issuer: data.institution,
      issueDate: data.issueDate,
      expirationDate: data.expirationDate,
      metadata: data.metadata || {},
    };
  },

  issueBulkCredentials: async (payload) => {
    if (API_BASE_URL) {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/university/issue-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error en emisión masiva');
      return res.json();
    }
    return { jobId: `job_${Date.now()}` };
  }
};

export default issuanceService;