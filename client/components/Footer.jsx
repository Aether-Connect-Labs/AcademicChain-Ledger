import React from 'react';
import { Link } from 'react-router-dom';
import { toGateway } from './utils/ipfsUtils';

const Footer = () => {
  const termsUrl = toGateway('ipfs://bafkreifivywo2ecfysgunkbqgrwmut2eyddkgpmvdrceai5tu2dbwpc6ta');
  const privacyUrl = toGateway('ipfs://bafkreidtamxbd5icphwjs3szittynegs7jq3yrqd7vjboat3uzgnbgposu');

  return (
    <footer
      className="bg-gray-800 text-white py-8"
      data-testid="footer"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-lg font-bold tracking-wide text-white">Aether Connect Labs | Innovation Laboratory</h2>
            <p className="text-xs text-gray-400 mt-1">© 2026 All rights reserved. Powered by AcademicChain Ledger Technology</p>
          </div>
          <nav aria-label="Footer navigation" data-testid="footer-nav">
            <ul className="flex space-x-4">
              <li>
                <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="footer-terms">
                  Terms
                </a>
              </li>
              <li>
                <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="footer-privacy">
                  Privacy
                </a>
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
