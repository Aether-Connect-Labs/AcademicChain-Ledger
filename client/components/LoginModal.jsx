import React, { useEffect, useRef } from 'react';

const LoginModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const firstFocusable = modalRef.current.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative"
        tabIndex="-1"
      >
        <div className="p-6">
          <h2 id="login-modal-title" className="text-2xl font-bold mb-4">
            Login to Your Account
          </h2>
          <form>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-required="true"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-required="true"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </form>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;