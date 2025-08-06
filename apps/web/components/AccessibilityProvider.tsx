import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type AccessibilityContextType = {
  fontSize: 'normal' | 'large' | 'xlarge';
  contrast: 'default' | 'high';
  reduceMotion: boolean;
  toggleFontSize: () => void;
  toggleContrast: () => void;
  toggleReduceMotion: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [contrast, setContrast] = useState<'default' | 'high'>('default');
  const [reduceMotion, setReduceMotion] = useState(false);
  const router = useRouter();

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedContrast = localStorage.getItem('contrast');
    const savedReduceMotion = localStorage.getItem('reduceMotion');

    if (savedFontSize) setFontSize(savedFontSize as any);
    if (savedContrast) setContrast(savedContrast as any);
    if (savedReduceMotion) setReduceMotion(savedReduceMotion === 'true');
  }, []);

  // Aplicar clases CSS según preferencias
  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add(`font-size-${fontSize}`);
    document.documentElement.classList.add(`contrast-${contrast}`);
    if (reduceMotion) document.documentElement.classList.add('reduce-motion');

    // Guardar preferencias
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('contrast', contrast);
    localStorage.setItem('reduceMotion', String(reduceMotion));
  }, [fontSize, contrast, reduceMotion]);

  // Manejar cambios de ruta para focus management (WCAG 2.4.3)
  useEffect(() => {
    const handleRouteChange = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  const toggleFontSize = () => {
    setFontSize(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const toggleContrast = () => {
    setContrast(prev => prev === 'default' ? 'high' : 'default');
  };

  const toggleReduceMotion = () => {
    setReduceMotion(prev => !prev);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        contrast,
        reduceMotion,
        toggleFontSize,
        toggleContrast,
        toggleReduceMotion
      }}
    >
      {children}
      <AccessibilityToolbar />
    </AccessibilityContext.Provider>
  );
};

const AccessibilityToolbar: React.FC = () => {
  const { 
    fontSize, 
    contrast, 
    reduceMotion,
    toggleFontSize, 
    toggleContrast, 
    toggleReduceMotion 
  } = useContext(AccessibilityContext)!;

  return (
    <div className="accessibility-toolbar" aria-label="Accessibility options">
      <button onClick={toggleFontSize} aria-label={`Change text size, current: ${fontSize}`}>
        Text Size: {fontSize}
      </button>
      <button onClick={toggleContrast} aria-label={`Toggle high contrast, current: ${contrast}`}>
        Contrast: {contrast}
      </button>
      <button onClick={toggleReduceMotion} aria-label={`Toggle reduced motion, current: ${reduceMotion ? 'on' : 'off'}`}>
        Motion: {reduceMotion ? 'Reduced' : 'Normal'}
      </button>
    </div>
  );
};
