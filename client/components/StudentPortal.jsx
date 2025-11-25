import React from 'react';
import StudentCredentials from './StudentCredentials.jsx';

const StudentPortal = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Portal del Alumno</h1>
      <StudentCredentials />
    </div>
  );
};

export default StudentPortal;