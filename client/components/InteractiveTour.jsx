import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/tour.css';

const InteractiveTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(() => localStorage.getItem('interactive_tour_completed') === '1');
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'right' });
  const [waitingElement, setWaitingElement] = useState(false);
  const pollRef = useRef(null);

  const steps = useMemo(() => ([
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Visión general del sistema con métricas en tiempo real.',
      route: '/admin',
      selector: 'button[data-tour-id="dashboard"]'
    },
    {
      id: 'usage',
      title: 'Instituciones',
      description: 'Explora el uso por institución con búsqueda, filtros y exportación.',
      route: '/admin/usage',
      selector: 'button[data-tour-id="usage"]'
    },
    {
      id: 'alerts',
      title: 'Alertas',
      description: 'Configura umbrales y notificaciones para servicios críticos.',
      route: '/admin/alerts',
      selector: 'button[data-tour-id="alerts"]'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Descarga reportes de credenciales, cumplimiento y estadísticas.',
      route: '/admin/reports',
      selector: 'button[data-tour-id="reports"]'
    },
    {
      id: 'blockchain',
      title: 'Blockchain',
      description: 'Consulta el estado de las redes y la protección de respaldo.',
      route: '/status',
      selector: '[data-tour-id="blockchain-status-title"]'
    }
  ]), []);

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const computePositions = (el) => {
    const rect = el.getBoundingClientRect();
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;
    const spaceBottom = vh - rect.bottom;
    const spaceTop = rect.top;
    if (spaceRight > 260) {
      setTooltipPos({ top: rect.top + Math.min(rect.height / 2, 200), left: rect.right + 16, placement: 'right' });
    } else if (spaceLeft > 260) {
      setTooltipPos({ top: rect.top + Math.min(rect.height / 2, 200), left: Math.max(16, rect.left - 280), placement: 'left' });
    } else if (spaceBottom > 160) {
      setTooltipPos({ top: rect.bottom + 16, left: Math.max(16, rect.left), placement: 'bottom' });
    } else {
      setTooltipPos({ top: Math.max(16, rect.top - 160), left: Math.max(16, rect.left), placement: 'top' });
    }
  };

  const trySelectElement = () => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      setWaitingElement(false);
      computePositions(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  };

  const navigateToStep = (idx) => {
    const s = steps[idx];
    if (!s) return;
    if (location.pathname !== s.route) navigate(s.route);
    setWaitingElement(true);
    setStepIndex(idx);
  };

  useEffect(() => {
    if (completed) return;
    const t = setTimeout(() => {
      if (location.pathname.startsWith('/admin')) {
        setActive(true);
        navigateToStep(0);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [location.pathname, completed]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('interactive_tour_completed');
      setCompleted(false);
      setActive(true);
      navigateToStep(0);
    };
    window.addEventListener('tour:restart', handler);
    return () => window.removeEventListener('tour:restart', handler);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollRef.current = setInterval(() => {
      if (trySelectElement()) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 200);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [active, stepIndex, location.pathname, currentStep?.selector]);

  useEffect(() => {
    const onResize = () => {
      if (!currentStep) return;
      const el = document.querySelector(currentStep.selector);
      if (el) computePositions(el);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [currentStep]);

  const handleNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < totalSteps) {
      navigateToStep(nextIdx);
    } else {
      setActive(false);
      setCompleted(true);
      localStorage.setItem('interactive_tour_completed', '1');
    }
  };

  const handlePrev = () => {
    const prevIdx = Math.max(0, stepIndex - 1);
    navigateToStep(prevIdx);
  };

  const handleSkip = () => {
    setActive(false);
  };

  if (completed) return null;
  if (!active) return null;

  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="tour-root" aria-hidden="false">
      <div className="tour-overlay" />
      {targetRect && (
        <div
          className="tour-highlight"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`
          }}
        />
      )}
      <div
        className={`tour-tooltip tour-${tooltipPos.placement}`}
        style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
      >
        <div className="tour-header">
          <div className="tour-title">{currentStep?.title}</div>
          <div className="tour-progress">
            <div className="tour-progress-bar" style={{ width: `${progress}%` }} />
            <span className="tour-progress-text">{stepIndex + 1}/{totalSteps}</span>
          </div>
        </div>
        <div className="tour-body">
          <p className="tour-description">{currentStep?.description}</p>
          {waitingElement && <p className="tour-wait">Ubicando elemento…</p>}
        </div>
        <div className="tour-actions">
          <button className="btn-secondary btn-sm" onClick={handleSkip}>Salir</button>
          <div className="tour-actions-right">
            <button className="btn-secondary btn-sm" onClick={handlePrev} disabled={stepIndex === 0}>Anterior</button>
            <button className="btn-primary btn-sm" onClick={handleNext}>{stepIndex + 1 < totalSteps ? 'Siguiente' : 'Finalizar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTour;

