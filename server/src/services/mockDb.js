// Simulación de Base de Datos en Memoria (Singleton)
// En producción, esto sería MongoDB, PostgreSQL, etc.

class MockDatabase {
    constructor() {
        this.students = new Map();
        console.log("[MockDB] Base de datos en memoria inicializada");
    }

    saveStudent(studentId, data) {
        if (!studentId) return null;
        
        const timestamp = new Date().toISOString();
        const newRecord = {
            studentId,
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        this.students.set(studentId, newRecord);
        console.log(`[MockDB] Estudiante guardado: ${studentId}`, newRecord);
        return newRecord;
    }

    getStudent(studentId) {
        return this.students.get(studentId) || null;
    }

    updateStudentStatus(studentId, status, extraData = {}) {
        const student = this.students.get(studentId);
        if (!student) return null;
        const updatedStudent = {
            ...student,
            status,
            ...extraData,
            updatedAt: new Date().toISOString()
        };
        this.students.set(studentId, updatedStudent);
        return updatedStudent;
    }

    getAllStudents() {
        return Array.from(this.students.values());
    }
}

// Exportar una única instancia (Singleton)
const mockDb = new MockDatabase();
module.exports = mockDb;
