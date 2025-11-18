import React from 'react';

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Nuestras Características</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Característica 1</h3>
            <p className="text-gray-600">Descripción de la característica 1.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Característica 2</h3>
            <p className="text-gray-600">Descripción de la característica 2.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Característica 3</h3>
            <p className="text-gray-600">Descripción de la característica 3.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;