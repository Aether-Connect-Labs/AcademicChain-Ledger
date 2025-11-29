import React, { useEffect, useMemo, useState } from 'react';
import { useAnalytics } from './useAnalytics';

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
  const calendlyUrl = import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/academicchain/demo';
  const calcomUrl = import.meta.env.VITE_CALCOM_URL;
  const meetUrl = import.meta.env.VITE_DEMO_MEET_URL || 'https://meet.google.com/lookup/academicchain-demo';
  const availabilityUrl = import.meta.env.VITE_DEMO_AVAILABILITY_URL;
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
  const bookUrl = import.meta.env.VITE_DEMO_BOOK_URL || `${API_BASE_URL}/api/contact/book`;
  const holidaysUrl = import.meta.env.VITE_DEMO_HOLIDAYS_URL;
  const regionOverride = import.meta.env.VITE_DEMO_REGION;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    trackPageView({ page: 'demo_scheduler', tz });
  }, [tz, trackPageView]);

  const [daysFromApi, setDaysFromApi] = useState([]);
  const [timesForDay, setTimesForDay] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState('');
  const [holidaysSet, setHolidaysSet] = useState(new Set());
  const region = useMemo(() => {
    if (regionOverride) return String(regionOverride).toLowerCase();
    const t = String(tz).toLowerCase();
    if (t.includes('lima')) return 'pe';
    if (t.includes('mexico')) return 'mx';
    if (t.includes('santiago') || t.includes('chile')) return 'cl';
    if (t.includes('bogota') || t.includes('colombia')) return 'co';
    if (t.includes('buenos_aires') || t.includes('argentina')) return 'ar';
    return 'intl';
  }, [tz, regionOverride]);

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const fetchAvail = async () => {
      if (!availabilityUrl) return;
      setLoadingAvail(true);
      setAvailError('');
      try {
        const res = await fetch(availabilityUrl);
        const data = await res.json();
        const list = Array.isArray(data?.days) ? data.days : [];
        const parsedDays = list.map((item) => {
          const d = new Date(item.date);
          return { date: d, slots: Array.isArray(item.slots) ? item.slots : [] };
        });
        setDaysFromApi(parsedDays);
      } catch (e) {
        setAvailError('No se pudo cargar disponibilidad');
      } finally {
        setLoadingAvail(false);
      }
    };
    fetchAvail();
  }, [availabilityUrl]);

  useEffect(() => {
    const fetchHolidays = async () => {
      if (!holidaysUrl) return;
      try {
        const res = await fetch(holidaysUrl);
        const data = await res.json();
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data?.holidays)) {
          const r = String(data?.region || '').toLowerCase();
          if (!r || r === region) list = data.holidays;
        } else if (Array.isArray(data?.regions)) {
          const item = data.regions.find((x) => {
            const code = String(x?.code || x?.region || '').toLowerCase();
            return code === region;
          });
          if (item && Array.isArray(item.holidays)) list = item.holidays;
        } else if (data?.regions && typeof data.regions === 'object') {
          const arr = data.regions[region];
          if (Array.isArray(arr)) list = arr;
        } else if (data && typeof data === 'object') {
          const arr = data[region];
          if (Array.isArray(arr)) list = arr;
        }
        setHolidaysSet(new Set(list));
      } catch {}
    };
    fetchHolidays();
  }, [holidaysUrl, region]);

  const days = useMemo(() => {
    if (daysFromApi.length > 0) {
      return daysFromApi.map((x) => x.date);
    }
    const out = [];
    const base = new Date();
    for (let i = 1; i <= 21; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const w = d.getDay();
      if (w === 0 || w === 6) continue;
      out.push(d);
    }
    return out;
  }, [daysFromApi]);

  const defaultTimes = useMemo(() => ['10:00', '12:00', '15:00', '17:00'], []);
  useEffect(() => {
    if (!selectedDate) { setTimesForDay([]); return; }
    const isHoliday = holidaysSet.has(ymd(selectedDate));
    if (isHoliday) { setTimesForDay([]); return; }
    if (daysFromApi.length > 0) {
      const dayItem = daysFromApi.find((x) => x.date.toDateString() === selectedDate.toDateString());
      if (dayItem) {
        const availableSlots = dayItem.slots.filter((s) => s.available !== false).map((s) => s.time);
        setTimesForDay(availableSlots);
        return;
      }
    }
    setTimesForDay(defaultTimes);
  }, [selectedDate, daysFromApi, holidaysSet, defaultTimes]);

  const canBook = selectedDate && selectedTime && name && email && org && /@/.test(email);

  const bookSlot = async () => {
    if (!canBook) return;
    setStatus('submitting');
    try {
      const [hh, mm] = selectedTime.split(':').map(Number);
      const startLocal = new Date(selectedDate);
      startLocal.setHours(hh, mm, 0, 0);
      const endLocal = new Date(startLocal);
      endLocal.setHours(hh + 1, mm, 0, 0);
      const title = 'Demo AcademicChain';
      const description = `Demo personalizada con ${name} (${org}).\nZona horaria: ${tz}`;
      const ics = buildIcs({ title, description, start: new Date(startLocal.toISOString()), end: new Date(endLocal.toISOString()), location: meetUrl });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'demo-academicchain.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const start = fmtDate(new Date(startLocal.toISOString()));
      const end = fmtDate(new Date(endLocal.toISOString()));
      const gcal = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description + '\n\nEnlace: ' + meetUrl)}&location=${encodeURIComponent(meetUrl)}&ctz=${encodeURIComponent(tz)}`;
      if (bookUrl) {
        try {
          await fetch(bookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, org, date: selectedDate.toISOString().slice(0,10), time: selectedTime, tz })
          });
        } catch {}
      }
      trackFormSubmission({ formType: 'demo_booking', name, email, org, tz, time: selectedTime });
      setStatus('success');
      window.open(gcal, '_blank');
    } catch (e) {
      setStatus('error');
    }
  };

  const externalUrl = calcomUrl || calendlyUrl;

  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Agenda una Demo</h1>
      <p className="text-gray-600 mb-6">Selecciona tu horario o usa el calendario integrado. Zona horaria: {tz}</p>
      {externalUrl ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
          <iframe title="Agenda Demo" src={externalUrl} className="w-full" style={{ minHeight: '720px' }}></iframe>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-soft p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {days.map((d, i) => {
                const disabled = holidaysSet.has(ymd(d));
                const active = selectedDate && d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => !disabled && setSelectedDate(d)}
                    disabled={disabled}
                    className={`px-4 py-3 rounded-lg border transition-colors ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {disabled && <span className="ml-2 text-xs text-red-600">Festivo</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                {(timesForDay.length > 0 ? timesForDay : defaultTimes).map((t) => (
                  <button key={t} disabled={!selectedDate} onClick={() => setSelectedTime(t)} className={`px-4 py-2 rounded-lg border text-sm transition-colors ${selectedTime === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'} ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>
              {selectedDate && holidaysSet.has(ymd(selectedDate)) && (
                <div className="mt-3 text-sm text-red-600">No hay reservas en días festivos.</div>
              )}
              {loadingAvail && <div className="mt-3 text-sm text-gray-500">Cargando disponibilidad…</div>}
              {availError && <div className="mt-3 text-sm text-red-600">{availError}</div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="input-primary w-full" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.email@institucion.edu" className="input-primary w-full" />
              <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Nombre de institución" className="input-primary w-full" />
            </div>
            <button onClick={bookSlot} disabled={!canBook || status === 'submitting'} className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {status === 'submitting' ? 'Agendando…' : 'Confirmar Reserva'}
            </button>
            {status === 'success' && (
              <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Reserva creada. Se abrió Google Calendar y descargaste un archivo .ics.</div>
            )}
            {status === 'error' && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">No se pudo crear la reserva.</div>
            )}
            <div className="mt-6 text-xs text-gray-500">Al confirmar, se genera un evento que puedes añadir a tu calendario y un enlace de llamada. No se requiere registro previo.</div>
          </div>
        </div>
      )}
      <div className="mt-10">
        <div className="rounded-xl border border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-900">¿Necesitas un horario especial?</div>
              <div className="text-sm text-gray-600">Contáctanos y te asignamos un slot dedicado.</div>
            </div>
            <a href={`mailto:demo@academicchain.com?subject=${encodeURIComponent('Agenda Demo')}`} className="btn-secondary">Contactar</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoScheduler;
