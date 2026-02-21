import React from 'react';
import { API_BASE_URL } from '../services/config';

const LinkedInButton = ({ credential }) => {
  if (!credential) return null;

  const meta = credential.metadata || {};
  const attrs = meta.attributes || [];
  
  const getAttr = (type) => attrs.find(a => a.trait_type === type)?.value || '';
  
  // Extract Data
  const certName = getAttr('Degree') || 'Certificación Académica';
  // Use a default organization ID or try to find it. For now, we can use a placeholder or the university name.
  // LinkedIn requires a numeric organization ID for the logo to appear correctly, otherwise it just shows the name.
  // We'll assume the University Name is passed, but LinkedIn URL parameter is `organizationId` (numeric) or `organizationName`.
  // The user prompt example uses `organizationId`. We might not have this, so we'll try to use `name` parameter if ID is missing.
  // Actually, the prompt says: `organizationId={{TU_ID_ORG}}`. We should probably store this in the credential or university profile.
  // For now, I'll use a generic one or empty to let user fill it, or try to map it.
  // Let's assume we use the name for now if ID is missing.
  
  
  const dateStr = attrs.find(a => a.display_type === 'date')?.value;
  let issueYear = new Date().getFullYear();
  let issueMonth = new Date().getMonth() + 1;
  
  if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          issueYear = d.getFullYear();
          issueMonth = d.getMonth() + 1;
      }
  }

  // IPFS / Filecoin Link
  const ipfsURI = credential.ipfsURI || '';
  const cid = ipfsURI.replace('ipfs://', '');
  const certUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`; // Use Lighthouse gateway for permanence
  
  // Construct URL
  // Note: LinkedIn parameters: name, organizationId (or organizationName?), issueYear, issueMonth, certUrl, certId
  // 'startTask=CERTIFICATION_NAME' triggers the add to profile flow.
  
  // LinkedIn officially supports: name, organizationId, issueYear, issueMonth, expirationYear, expirationMonth, certUrl, certId
  // If we don't have organizationId (numeric), the user has to type the name.
  
  const linkedInUrl = new URL('https://www.linkedin.com/profile/add');
  linkedInUrl.searchParams.append('startTask', 'CERTIFICATION_NAME');
  linkedInUrl.searchParams.append('name', certName);
  // linkedInUrl.searchParams.append('organizationName', universityName); // This parameter is sometimes supported, sometimes not.
  // We'll use organizationId if we had it, but for now we skip it or use a known one.
  linkedInUrl.searchParams.append('issueYear', issueYear);
  linkedInUrl.searchParams.append('issueMonth', issueMonth);
  linkedInUrl.searchParams.append('certUrl', certUrl);
  linkedInUrl.searchParams.append('certId', cid); // Using CID as Certificate ID

  const handleClick = async () => {
      // Track the click
      try {
          await fetch(`${API_BASE_URL}/api/v1/credentials/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tokenId: credential.tokenId,
                  serialNumber: credential.serialNumber,
                  platform: 'linkedin'
              })
          });
      } catch (e) {
          console.error('Failed to track LinkedIn share', e);
      }
      
      // Open LinkedIn
      window.open(linkedInUrl.toString(), '_blank');
  };

  return (
    <button 
        onClick={handleClick}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006396] text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md"
    >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
        Añadir a mi perfil de LinkedIn
    </button>
  );
};

export default LinkedInButton;
