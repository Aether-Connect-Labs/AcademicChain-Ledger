import { useCallback } from 'react';

export const useAnalytics = () => {
  const trackButtonClick = useCallback((data) => {
    try {
      console.debug('analytics:button_click', data);
    } catch {}
  }, []);

  const trackFormSubmission = useCallback((data) => {
    try {
      console.debug('analytics:form_submission', data);
    } catch {}
  }, []);

  const trackPageView = useCallback((data) => {
    try {
      console.debug('analytics:page_view', data);
    } catch {}
  }, []);

  const trackHederaOperation = useCallback((data) => {
    try {
      console.debug('analytics:hedera_operation', data);
    } catch {}
  }, []);

  const trackCredentialOperation = useCallback((data) => {
    try {
      console.debug('analytics:credential_operation', data);
    } catch {}
  }, []);

  return {
    trackButtonClick,
    trackFormSubmission,
    trackPageView,
    trackHederaOperation,
    trackCredentialOperation,
  };
};

export default useAnalytics;