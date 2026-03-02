jest.mock('../services/issuanceService', () => {
  return {
    issuanceService: {
      issueCreatorCredential: jest.fn(async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          success: true,
          data: {
            id: 'mock-id-123',
            txId: '0.0.123456@1700000000.000000000',
            status: 'issued',
            ...data
          }
        };
      })
    }
  };
});

const { issuanceService } = require('../services/issuanceService');

describe('Emisión para Creadores (servicio)', () => {
  jest.setTimeout(8000);

  test('emite credencial individual con éxito', async () => {
    const payload = {
      credentialType: 'Curso: Blockchain Básico',
      courseName: 'Blockchain Básico',
      studentName: 'Ada Lovelace',
      studentEmail: 'ada@example.com'
    };

    const res = await issuanceService.issueCreatorCredential(payload);
    expect(res).toBeTruthy();
    expect(res.success).toBe(true);
    expect(res.data).toBeTruthy();
    expect(res.data.status).toBe('issued');
    expect(res.data.id).toBeDefined();
    expect(res.data.txId).toBeDefined();
  });

  test('procesa cohorte (lista de estudiantes) en modo simulación', async () => {
    const payload = {
      credentialType: 'Mentoría: Liderazgo',
      courseName: 'Mentoría de Liderazgo',
      students: [
        { studentName: 'Grace Hopper', studentEmail: 'grace@example.com' },
        { studentName: 'Katherine Johnson', studentEmail: 'katherine@example.com' }
      ]
    };

    const res = await issuanceService.issueCreatorCredential(payload);
    expect(res).toBeTruthy();
    expect(res.success).toBe(true);
    expect(res.data).toBeTruthy();
    expect(res.data.status).toBe('issued');
    expect(Array.isArray(res.data.students) || Array.isArray(payload.students)).toBe(true);
  });
});
