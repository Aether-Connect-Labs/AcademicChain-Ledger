import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer
      className="bg-gray-800 text-white py-8"
      data-testid="footer"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-bold">Company Name</h2>
            <p>© 2023 All rights reserved.</p>
          </div>
          <nav aria-label="Footer navigation" data-testid="footer-nav">
            <ul className="flex space-x-4">
              <li>
                <Link to="/developers/docs" className="hover:underline" data-testid="footer-terms">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/developers/docs" className="hover:underline" data-testid="footer-privacy">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/agenda" className="hover:underline" data-testid="footer-contact">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
