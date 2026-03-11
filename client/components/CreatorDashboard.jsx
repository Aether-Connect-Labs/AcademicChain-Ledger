import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import CreatorIssuance from './CreatorIssuance';
import CreatorStepper from './CreatorStepper';
import { toGateway } from './utils/ipfsUtils';
import apiService from './services/apiService';
import { verificationService } from './services/verificationService';
import useAnalytics from './useAnalytics';
import { toast, Toaster } from 'react-hot-toast';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  Users, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Trash2, 
  XCircle,
  Zap,
  Shield,
  FileText,
  Briefcase,
  LayoutDashboard,
  Rocket
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CreatorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Notification Listener for "Hired" Event
  useEffect(() => {
    const handleHired = (event) => {
        const { studentName, employerName, courseName } = event.detail || {};
        
        // Play sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Success bell
        audio.play().catch(e => console.log('Audio play failed', e));

        // Show Toast
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0d0d0d] shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-white/10 border border-emerald-500/50`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-bold text-white">
                                New Hire Confirmed!
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                <span className="text-emerald-400 font-bold">{studentName}</span> hired by <span className="text-blue-400 font-bold">{employerName}</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500 font-mono">
                                Credential: {courseName}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 8000 });

        // Update stats
        setStats(prev => ({
            ...prev,
            impactoLaboral: (prev.impactoLaboral || 0) + 1,
            successRate: Math.min(100, (prev.successRate || 95) + 0.5)
        }));
    };

    const handleBatchComplete = (event) => {
        const { count } = event.detail || {};
        if (count > 0) {
            setStats(prev => ({
                ...prev,
                totalIssued: (prev.totalIssued || 0) + count
            }));
            toast.success(`Batch completed: ${count} credentials issued.`);
        }
    };

    window.addEventListener('acl:hired', handleHired);
    window.addEventListener('acl:batch-complete', handleBatchComplete);
    
    // Listen to localStorage for cross-tab events
    const handleStorage = (e) => {
        if (e.key === 'acl:event:hired') {
            const data = JSON.parse(e.newValue);
            handleHired({ detail: data });
        }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('acl:hired', handleHired);
        window.removeEventListener('acl:batch-complete', handleBatchComplete);
        window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      toast(location.state.message, { 
        icon: location.state.type === 'success' ? '✅' : 'ℹ️',
        duration: 4000 
      });
      // Clear state to prevent sticky toast
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Mock data states
  const [, setCredentials] = useState([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState('');
  const [stats, setStats] = useState({
    totalIssued: 0,
    impactoLaboral: 0,
    rankingSkills: 'Solidity, React',
    uptime: '99.9%'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const { trackCredentialOperation } = useAnalytics();
  const [creatorProfile] = useState({
    name: 'Creator Demo',
    did: 'did:hedera:testnet:z6Mk...',
    brand: 'My University',
    apiKey: 'sk_live_51M...'
  });

  const loadCreatorData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock Data
      const mockCredentials = [
        {
          studentName: 'Ana García',
          credentialType: 'Course: Digital Marketing',
          issuedAt: new Date().toISOString(),
          metadata: { mentorVerified: true },
          issuerBrand: 'Academia Demo',
          tokenId: '0.0.123456',
          serialNumber: '101'
        },
        // ... more mock data
      ];

      setCredentials(mockCredentials);
      calculateStats(mockCredentials);
      setRecentActivity(mockCredentials);
      
    } catch (err) {
      setError('Error loading creator data');
      console.error('Creator dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (credentials) => {
    // Mock stats calculation + base values to look populated
    setStats({
      totalIssued: 154,
      impactoLaboral: 42, // Mocked "Hired" count
      rankingSkills: 'Solidity #1',
      uptime: '100% (Arkhia)'
    });
  };

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Issued Credentials',
      data: [12, 19, 8, 15, 22, 18],
      backgroundColor: 'rgba(16, 185, 129, 0.2)', // Emerald-500/20
      borderColor: '#10b981', // Emerald-500
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(16, 185, 129, 0.4)',
    }]
  };

  const typeDistribution = {
    labels: ['Courses', 'Workshops', 'Bootcamps', 'Mentorships'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(245, 158, 11, 0.6)'], 
      borderColor: '#050505', // Black
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', 
          font: { size: 12, weight: 'bold', family: "'JetBrains Mono', monospace" }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace" } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
      },
      y: {
        ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace" } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [loadCreatorData]);

  const handleDelete = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No credential identifiers available.');
      return;
    }
    const ok = window.confirm('Delete this issuance from Creator portal? On-chain state is unaffected.');
    if (!ok) return;
    try {
      await apiService.deleteCredential({ tokenId: item.tokenId, serialNumber: item.serialNumber });
      setRecentActivity(prev => prev.filter(x => !(String(x.tokenId) === String(item.tokenId) && String(x.serialNumber) === String(item.serialNumber))));
      setDeletedCount(v => v + 1);
      try { await refreshGlobalStats(); } catch {}
      try {
        trackCredentialOperation({
          operation: 'delete',
          role: 'creator',
          tokenId: item.tokenId,
          serialNumber: String(item.serialNumber || ''),
          context: 'creator_recent_activity'
        });
      } catch {}
    } catch (e) {
      alert('Could not delete issuance.');
    }
  };

  const handleRevoke = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No credential identifiers available.');
      return;
    }
    const reason = window.prompt('Enter revocation reason (e.g., Superseded, Compromised):', 'Superseded') || '';
    if (!reason.trim()) return;
    try {
      await apiService.revokeCredential({ tokenId: item.tokenId, serialNumber: item.serialNumber, reason });
      
      // Update local state to reflect revocation immediately
      setRecentActivity(prev => prev.map(x => 
        (x.tokenId === item.tokenId && String(x.serialNumber) === String(item.serialNumber)) 
          ? { ...x, status: 'revoked' } 
          : x
      ));

      alert('Revocation submitted.');
      try { await refreshGlobalStats(); } catch {}
      try {
        trackCredentialOperation({
          operation: 'revoke',
          role: 'creator',
          tokenId: item.tokenId,
          serialNumber: String(item.serialNumber || ''),
          reason
        });
      } catch {}
    } catch (e) {
      alert('Error revoking. Valid API Key may be required.');
    }
  };

  const [deletedCount, setDeletedCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({ revoked: 0, deleted: 0, verified: 0, pending: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refreshGlobalStats = useCallback(async () => {
    try {
      const s = await apiService.getCredentialStats({ scope: 'creator', issuerId: creatorProfile?.did || undefined, role: 'creator' });
      if (s && s.success) {
        setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) });
      }
    } catch {}
  }, [creatorProfile?.did]);

  useEffect(() => {
    (async () => { try { await refreshGlobalStats(); } catch {} })();
  }, [refreshGlobalStats]);

  const handleRequestVerification = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No credential identifiers available.');
      return;
    }
    try {
      await apiService.requestCredentialVerification({ tokenId: item.tokenId, serialNumber: item.serialNumber, role: 'creator' });
      setRecentActivity(prev => prev.map(x => (x.tokenId === item.tokenId && String(x.serialNumber) === String(item.serialNumber)) ? { ...x, status: 'pending' } : x));
      alert('Verification request sent. Status: Pending');
      try { await refreshGlobalStats(); } catch {}
    } catch (e) {
      alert('Could not send verification request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-emerald-500/30">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'rgba(5, 5, 5, 0.95)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }
      }} />
      
      {/* Simulation Banner */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border-b border-white/5 text-emerald-400 flex justify-between items-center px-4 py-2 relative z-50 backdrop-blur-md">
        <span className="font-mono font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          SIMULATION_MODE_ACTIVE // INTERACTIVE_EXPERIENCE
        </span>
        <a href="/" className="text-[10px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-all border border-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-white flex items-center gap-2">
          <XCircle size={12} strokeWidth={1} /> EXIT_DEMO
        </a>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 p-0.5">
                    <div className="h-full w-full bg-[#050505] rounded-[10px] flex items-center justify-center">
                        <Zap size={20} className="text-emerald-500" strokeWidth={1} />
                    </div>
                </div>
                <div className="flex flex-col">
                   <h3 className="text-base font-bold text-white leading-none tracking-tight">{creatorProfile.brand}</h3>
                   <div className="flex items-center gap-2 mt-1">
                       <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">VERIFIED_ISSUER</span>
                       <span className="text-[10px] text-slate-500 font-mono">{creatorProfile.did.substring(0, 16)}...</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <Link to="/precios?tab=creators" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 border border-white/5 transition-all group">
                    <Rocket size={16} strokeWidth={1} className="group-hover:text-emerald-400 transition-colors" />
                    <span>Upgrade Plan</span>
                </Link>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[1px]">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${creatorProfile.name}&background=050505&color=fff`} 
                        alt="Profile" 
                        className="h-full w-full rounded-full object-cover border-2 border-[#050505]"
                    />
                </div>
             </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tighter mb-4">
                Creator Portal
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl font-light leading-relaxed">
                Advanced academic credential management and professional certifications with blockchain traceability.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-[#050505] bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">
                            {i}
                        </div>
                    ))}
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Students</p>
                    <p className="text-xl font-mono text-white">2,845</p>
                </div>
            </div>
        </div>

        {/* Filters & Stats Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} strokeWidth={1} />
                    <input
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/30 transition-colors placeholder:text-slate-600"
                        placeholder="Search credentials, hash, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/30 transition-colors"
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="revoked">Revoked</option>
                </select>
            </div>
            
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
                 <div className="flex items-center gap-2 min-w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-xs text-slate-400">Verified: <span className="text-white font-mono">{globalStats.verified}</span></span>
                 </div>
                 <div className="flex items-center gap-2 min-w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs text-slate-400">Pending: <span className="text-white font-mono">{globalStats.pending}</span></span>
                 </div>
                 <div className="flex items-center gap-2 min-w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-xs text-slate-400">Revoked: <span className="text-white font-mono">{globalStats.revoked}</span></span>
                 </div>
            </div>
        </div>

        {/* Real-time Flow */}
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Activity size={120} strokeWidth={0.5} />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Live Issuance Flow
                        </h3>
                        <p className="text-slate-400 text-sm max-w-md">Real-time visualization of credential dispersion across the decentralized network.</p>
                    </div>
                    <button 
                        onClick={() => {
                            const eventData = {
                                studentName: 'Student #' + Math.floor(Math.random() * 1000),
                                employerName: 'Corp #' + Math.floor(Math.random() * 100),
                                courseName: 'Blockchain Advanced'
                            };
                            window.dispatchEvent(new CustomEvent('acl:hired', { detail: eventData }));
                            localStorage.setItem('acl:event:hired', JSON.stringify(eventData));
                            setTimeout(() => localStorage.removeItem('acl:event:hired'), 100);
                        }}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Zap size={14} strokeWidth={1} /> SIMULATE_HIRE_EVENT
                    </button>
                </div>
                
                <CreatorStepper currentStep={3} />
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Issued', value: stats.totalIssued, icon: <Award size={24} strokeWidth={1} />, color: 'text-emerald-400', sub: 'Lifetime credentials' },
            { label: 'Career Impact', value: stats.impactoLaboral, icon: <Briefcase size={24} strokeWidth={1} />, color: 'text-blue-400', sub: 'Hired graduates' },
            { label: 'Top Skill', value: stats.rankingSkills, icon: <Zap size={24} strokeWidth={1} />, color: 'text-purple-400', sub: 'Highest demand' },
            { label: 'System Uptime', value: stats.uptime, icon: <Activity size={24} strokeWidth={1} />, color: 'text-pink-400', sub: 'Network status' },
          ].map((stat, idx) => (
              <div key={idx} className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">KPI_0{idx+1}</span>
                 </div>
                 <div className={`text-3xl font-black mb-1 text-white`}>{stat.value}</div>
                 <div className="text-sm text-slate-400 font-medium mb-2">{stat.label}</div>
                 <div className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${stat.color}`}>{stat.sub}</div>
              </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <BarChart3 size={20} className="text-emerald-500" strokeWidth={1} />
                Monthly Issuance
            </h3>
            <div className="h-64 w-full">
              <Bar data={monthlyData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <PieChart size={20} className="text-blue-500" strokeWidth={1} />
                Type Distribution
            </h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={typeDistribution} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Action & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <CreatorIssuance />
          </div>

          <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <Clock size={20} className="text-amber-500" strokeWidth={1} />
                Recent Activity
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {(searchQuery ? recentActivity.filter(x => {
                const q = String(searchQuery || '').toLowerCase().trim();
                const fields = [
                  String(x.studentName || '').toLowerCase(),
                  String(x.credentialType || '').toLowerCase(),
                  String(x.tokenId || x.id || '').toLowerCase()
                ];
                return fields.some(v => v.includes(q));
              }) : recentActivity).map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-[#050505] flex items-center justify-center border border-white/10 text-emerald-500 group-hover:border-emerald-500/50 transition-colors">
                    <Award size={18} strokeWidth={1} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm truncate pr-2 group-hover:text-emerald-400 transition-colors">{activity.studentName}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(activity.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{activity.credentialType}</p>
                    
                    {activity.tokenId && (
                      <div className="flex items-center gap-2 mt-3">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              String(activity.status || '').toLowerCase() === 'revoked'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : String(activity.status || '') === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {String(activity.status || '').toUpperCase()}
                         </span>
                         <div className="flex ml-auto gap-1">
                             <button onClick={() => handleRevoke(activity)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Revoke">
                                <AlertTriangle size={14} strokeWidth={1.5} />
                             </button>
                             <button onClick={() => handleDelete(activity)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors" title="Delete">
                                <Trash2 size={14} strokeWidth={1.5} />
                             </button>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {recentActivity.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <FileText size={48} strokeWidth={0.5} className="mb-4 opacity-50" />
                      <p>No recent activity found</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;