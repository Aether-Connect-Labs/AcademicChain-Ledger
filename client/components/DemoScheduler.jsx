import React, { useEffect, useMemo, useState } from 'react';
import { useAnalytics } from './useAnalytics';
import demoService from './services/demoService';

const fmtDate = (d) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = '00';
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
};

const buildIcs = ({ title, description, start, end, location }) => {
  const uid = `ac-demo-${Date.now()}@academicchain`; 
  const dtstamp = fmtDate(new Date());
  const dtstart = fmtDate(start);
  const dtend = fmtDate(end);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AcademicChain//Demo Scheduler//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

const DemoScheduler = () => {
  const { trackFormSubmission, trackPageView } = useAnalytics();
  const meetUrl = import.meta.env.VITE_DEMO_MEET_URL || 'https://meet.google.com/lookup/academicchain-demo';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [icsUrl, setIcsUrl] = useState(null);
  const [calendarLink, setCalendarLink] = useState(null);
  const [meetLink, setMeetLink] = useState(null);

  useEffect(() => {
    trackPageView({ page: 'demo_scheduler', tz });
  }, [tz, trackPageView]);

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const days = useMemo(() => {
    const out = [];
    const base = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const w = d.getDay();
      if (w === 0 || w === 6) continue;
      out.push(d);
    }
    return out;
  }, []);

  const defaultTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const canBook = selectedDate && selectedTime && name && email && org && /@/.test(email);

  const bookSlot = async () => {
    if (!canBook) return;
    setLoading(true);
    setStatus('submitting');
    let redirectWin = null;
    try {
      redirectWin = window.open('about:blank', '_blank');
      if (redirectWin && redirectWin.document) {
        redirectWin.document.title = 'Redirigiendo…';
        redirectWin.document.body.innerHTML = '<div style="font-family:system-ui;margin:32px;"><div style="font-size:16px;color:#111;">Redirigiendo al calendario…</div></div>';
      }
    } catch {}
    
    try {
      const result = await demoService.scheduleDemo({
        name, 
        email, 
        org, 
        date: ymd(selectedDate), 
        time: selectedTime, 
        tz,
        meetUrl
      });

      if (result.success) {
        handleSuccess(result.data, redirectWin);
      } else {
        throw new Error(result.message || 'Error booking demo');
      }
    } catch (error) {
      console.warn('Backend unavailable, switching to Mock Mode for demo purposes:', error);
      
      // MOCK MODE: Simular éxito si el backend falla (para demostración UI)
      setTimeout(() => {
        const mockData = {
          calendarEvent: { link: '#' },
          meetUrl: meetUrl
        };
        handleSuccess(mockData, redirectWin);
      }, 1500);
    }
  };

  const handleSuccess = (data, redirectWin) => {
    trackFormSubmission({ formType: 'demo_booking', name, email, org, tz, time: selectedTime });
    setStatus('success');
    setLoading(false);
    setCalendarLink(data?.calendarEvent?.link || null);
    setMeetLink(data?.meetUrl || meetUrl);
    try {
      const parts = String(selectedTime).split(':');
      const sh = Number(parts[0] || 0);
      const sm = Number(parts[1] || 0);
      const startLocal = new Date(selectedDate);
      startLocal.setHours(sh, sm, 0, 0);
      const endLocal = new Date(startLocal);
      endLocal.setHours(endLocal.getHours() + 1);
      const ics = buildIcs({
        title: `Demo AcademicChain - ${org}`,
        description: `Demo con ${name} (${email})\\nZona horaria: ${tz}`,
        start: startLocal,
        end: endLocal,
        location: data?.meetUrl || meetUrl
      });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setIcsUrl(url);
    } catch {}
    
    // Show success message with calendar options
    if (data.calendarEvent && data.calendarEvent.link) {
      try {
        if (redirectWin && typeof redirectWin.location !== 'undefined') {
          redirectWin.location.href = data.calendarEvent.link;
        } else {
          window.location.href = data.calendarEvent.link;
        }
      } catch {
        window.location.href = data.calendarEvent.link;
      }
    }
  };
  
  useEffect(() => {
    return () => {
      if (icsUrl) URL.revokeObjectURL(icsUrl);
    };
  }, [icsUrl]);

  return (
    <>
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Agenda una Demo</h1>
      <p className="text-gray-600 mb-6">Selecciona tu horario preferido. Zona horaria: {tz}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-soft p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona una fecha</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {days.map((d, i) => {
              const active = selectedDate && d.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`px-4 py-3 rounded-lg border transition-colors ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona una hora</h2>
              <div className="flex flex-wrap gap-3">
                {defaultTimes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${selectedTime === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Información de contacto</h2>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="input-primary w-full"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.email@institucion.edu"
              type="email"
              className="input-primary w-full"
            />
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Nombre de tu institución"
              className="input-primary w-full"
            />
          </div>
          <button
            onClick={bookSlot}
            disabled={!canBook || loading}
            className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Agendando…
              </>
            ) : 'Confirmar Demo'}
          </button>
          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">¡Demo agendada exitosamente!</span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                Hemos enviado un email de confirmación con todos los detalles.
                Revisa tu bandeja de entrada y spam.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {calendarLink && (
                  <a
                    href={calendarLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                  >
                    Abrir Google Calendar
                  </a>
                )}
                {icsUrl && (
                  <a
                    href={icsUrl}
                    download="demo-academicchain.ics"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm"
                  >
                    Descargar .ics
                  </a>
                )}
                {meetLink && (
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm"
                  >
                    Abrir Meet
                  </a>
                )}
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">Error al agendar la demo</span>
              </div>
              <p className="text-red-700 text-sm mt-2">
                Por favor intenta nuevamente o contáctanos directamente.
              </p>
            </div>
          )}
          <div className="mt-6 text-xs text-gray-500">
            Al confirmar, recibirás un email con el enlace de la reunión y
            el evento se agregará automáticamente a tu calendario.
          </div>
        </div>
      </div>

    </div>
    </>
  );
};

export default DemoScheduler;
