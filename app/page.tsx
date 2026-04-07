'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';

interface FarmerData {
  plotNo: string;
  farmerName: string;
  idNo: string;
  balanceAmount: string;
  listNo: string;
  bankedDate: string;
  bankAccNo: string;
  bankCode: string;
}

export default function Home() {
  const [data, setData] = useState<FarmerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlot, setExpandedPlot] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [selectedListNo, setSelectedListNo] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [notifTitle, setNotifTitle] = useState('Payment Update');
  const [notifMessage, setNotifMessage] = useState('A new payment list has been uploaded.');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // Load theme from local storage
    const savedTheme = localStorage.getItem('ffp-theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    
    // Check user role from localStorage
    const savedRole = localStorage.getItem('ffp-role');
    setUserRole(savedRole);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('ffp-theme', newTheme);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message);
        }
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const sendNotification = async () => {
    setSendingNotif(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          url: '/'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Notification sent successfully!');
      } else {
        alert('Failed to send: ' + JSON.stringify(data.error));
      }
    } catch (err) {
      alert('Error sending notification');
    } finally {
      setSendingNotif(false);
    }
  };

  const formatBalance = (amount: string) => {
    if (!amount || amount === '-' || amount.trim() === '') return '0.00';

    // Remove all non-numeric characters except the decimal point
    const numericValue = amount.replace(/[^0-9.]/g, '');
    const num = parseFloat(numericValue);

    if (isNaN(num)) return amount;

    // Format with commas and 2 decimal places
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const copyPlotDetails = (row: FarmerData) => {
    const text = `
FARMER FINAL PAYMENT 2026-SC
----------------------------
Plot No: ${row.plotNo}
Farmer Name: ${row.farmerName}
ID No: ${row.idNo}
Bank Acc. No: ${row.bankAccNo}
Bank Code: ${row.bankCode}
Balance: Rs. ${formatBalance(row.balanceAmount)}
List No: ${row.listNo}
Banked Date: ${row.bankedDate}
----------------------------`.trim();

    navigator.clipboard.writeText(text);
    setCopiedId(row.plotNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const isValidPlot = item.plotNo && item.plotNo.trim() !== '' && item.plotNo !== '-';
      if (!isValidPlot) return false;

      // Filter by List No if selected (with trimming for robustness)
      if (selectedListNo && (item.listNo || '').trim() !== selectedListNo.trim()) {
        return false;
      }

      const sc = searchTerm.toLowerCase();
      return item.plotNo.toLowerCase().includes(sc) ||
        item.farmerName.toLowerCase().includes(sc);
    });
  }, [data, searchTerm, selectedListNo]);

  const uniqueListNos = useMemo(() => {
    const lists = data
      .map(item => item.listNo)
      .filter(l => l && l.trim() !== '' && l !== '-' && l !== 'null');
    const unique = Array.from(new Set(lists)).sort();

    if (!listSearchTerm) return unique;

    return unique.filter(l => l.toLowerCase().includes(listSearchTerm.toLowerCase()));
  }, [data, listSearchTerm]);

  const lastBankedInfo = useMemo(() => {
    // Look for records that have an actual banked date (not pending/placeholder)
    const validEntries = data.filter(item => {
      const isValidPlot = item.plotNo && item.plotNo.trim() !== '' && item.plotNo !== '-';
      if (!isValidPlot) return false;

      const date = (item.bankedDate || '').toLowerCase().trim();
      return date !== '' &&
        date !== 'pending' &&
        date !== '-' &&
        date !== 'nill' &&
        date !== 'minus' &&
        date !== 'cheque' &&
        date !== 'null' &&
        date !== '1899-12-30';
    });

    if (validEntries.length === 0) return null;

    // Sort to find the latest one chronologically
    const sorted = [...validEntries].sort((a, b) => {
      // Primary sort by date string (YYYY-MM-DD)
      const dateCompare = (a.bankedDate || '').localeCompare(b.bankedDate || '');
      if (dateCompare !== 0) return dateCompare;

      // Secondary sort by List No (numeric part)
      const getNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getNum(a.listNo || '') - getNum(b.listNo || '');
    });

    return sorted[sorted.length - 1];
  }, [data]);

  const stats = useMemo(() => {
    const totalFarmers = data.filter(item => item.plotNo && item.plotNo.trim() !== '' && item.plotNo !== '-').length;
    
    let totalBalance = 0;
    let pendingBalance = 0;
    let paidBalance = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let chequeCount = 0;
    let rtgsCount = 0;
    let nillCount = 0;

    data.forEach(item => {
      const isValidPlot = item.plotNo && item.plotNo.trim() !== '' && item.plotNo !== '-';
      if (!isValidPlot) return;

      // 1. Balance
      const amountStr = item.balanceAmount || '';
      const numericValue = amountStr.replace(/[^0-9.]/g, '');
      const val = parseFloat(numericValue);
      if (!isNaN(val)) totalBalance += val;

      // 2. Classification
      const listNo = (item.listNo || '').toUpperCase().trim();
      const bankedDateRaw = (item.bankedDate || '').toUpperCase().trim();
      
      const isRTGS = listNo.startsWith('RTGS');
      const isCheque = listNo === 'CHEQUE' || bankedDateRaw === 'CHEQUE';
      const isNill = listNo === 'NILL' || bankedDateRaw === 'MINUS' || bankedDateRaw === 'NILL';
      const isPending = bankedDateRaw === 'PENDING' || bankedDateRaw === '' || bankedDateRaw === '-';
      
      // Update method counts
      if (isRTGS) rtgsCount++;
      else if (isCheque) chequeCount++;
      else if (isNill) nillCount++;

      // 3. Paid vs Pending for Progress Bar
      if (isNill) {
        // Exclude Nill from Paid/Pending metrics
      } else if (isPending) {
        pendingCount++;
        if (!isNaN(val)) pendingBalance += val;
      } else {
        // If not Nill and not Pending, it's considered Paid/Complete
        paidCount++;
        if (!isNaN(val)) paidBalance += val;
      }
    });

    const trackableTotal = paidCount + pendingCount;

    return {
      totalFarmers,
      totalBalance,
      pendingBalance,
      paidBalance,
      paidCount,
      pendingCount,
      chequeCount,
      rtgsCount,
      nillCount,
      percentPaid: trackableTotal > 0 ? Math.round((paidCount / trackableTotal) * 100) : 0
    };
  }, [data]);

  const toggleExpand = (plotNo: string) => {
    setExpandedPlot(expandedPlot === plotNo ? null : plotNo);
  };

  return (
    <div style={{ height: '100dvh', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '0.75rem 1rem 0 1rem', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header Section */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '0.75rem',
          position: 'relative',
          zIndex: 10000 // Ensure header stays on top of content
        }} className="animate-fade-in page-header">
          <div style={{ flex: 1, minWidth: '0' }}>
            <h1 style={{
              fontSize: '1.85rem',
              margin: 0,
              background: 'linear-gradient(to right, var(--text-main), var(--text-muted))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              fontWeight: 900
            }}>
              Farmer Final Payment 2026-SC
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem', overflow: 'hidden' }}>
              <span style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                whiteSpace: 'nowrap'
              }}>Zone Office</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Officer Access Port</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="dropdown">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn menu-btn"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                Menu
              </button>

              <div className={`dropdown-content ${isMenuOpen ? 'show' : ''}`}>
                {userRole === 'admin' && (
                  <div
                    className="dropdown-item"
                    onClick={() => { setShowDashboard(true); setIsMenuOpen(false); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      Dashboard
                    </div>
                  </div>
                )}

                <div
                  className="dropdown-item"
                  onClick={() => setIsListExpanded(!isListExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    List Wise
                  </div>
                  <span>{isListExpanded ? '▲' : '▼'}</span>
                </div>

                {isListExpanded && (
                  <div className="dropdown-submenu custom-scrollbar">
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
                      <input
                        type="text"
                        placeholder="Search list..."
                        value={listSearchTerm}
                        onChange={(e) => setListSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div
                      className={`submenu-item ${selectedListNo === null ? 'active-filter' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListNo(null);
                        setIsMenuOpen(false);
                        setListSearchTerm('');
                      }}
                    >
                      All Payments
                    </div>
                    {uniqueListNos.map(list => (
                      <div
                        key={list}
                        className={`submenu-item ${selectedListNo === list ? 'active-filter' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListNo(list);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.5rem', // Larger tap area
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <span style={{ color: 'white', fontWeight: 600 }}>{list}</span>
                        {selectedListNo === list && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="dropdown-item"
                  onClick={() => { setShowAbout(true); setIsMenuOpen(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    About
                  </div>
                </div>

                <div
                  className="dropdown-item"
                  onClick={handleLogout}
                  style={{ color: '#f87171' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                  </div>

                  {/* Theme Switcher in Menu */}
                  <div className="theme-switcher">
                    <div 
                      className={`theme-opt ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => changeTheme('light')}
                    >
                      Light
                    </div>
                    <div 
                      className={`theme-opt ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => changeTheme('dark')}
                    >
                      Dark
                    </div>
                    <div 
                      className={`theme-opt ${theme === 'color' ? 'active' : ''}`}
                      onClick={() => changeTheme('color')}
                    >
                      Color
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="animate-fade-in" style={{ animationDelay: '0.1s', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 1rem 0.5rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', flexShrink: 0 }}>

          {/* Active Filter Badge */}
          {selectedListNo && (
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#c7d2fe',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(129, 140, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Listing:</span>
                {selectedListNo}
                <button
                  onClick={() => setSelectedListNo(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
          )}

          {/* Last Banked Info Live Animation */}
          {lastBankedInfo && (
            <div className="animate-slide-up" style={{ marginBottom: '0.4rem' }}>
              <div className="live-badge" style={{
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                flexWrap: 'nowrap',
                padding: '0.4rem 0.8rem',
                overflow: 'hidden'
              }}>
                <div className="live-dot-container" style={{ flexShrink: 0 }}>
                  <div className="live-dot-pulse"></div>
                  <div className="live-dot"></div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.8rem',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  lineHeight: '1',
                  whiteSpace: 'nowrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Last Banked:</span>
                    <span style={{
                      background: 'rgba(129, 140, 248, 0.15)',
                      color: '#a5b4fc',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      border: '1px solid rgba(129, 140, 248, 0.2)'
                    }}>{lastBankedInfo.listNo}</span>
                  </div>
                  <div style={{ width: '1px', height: '10px', background: 'var(--border)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Date:</span>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>{lastBankedInfo.bankedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar - Apple Style */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            padding: '0.3rem',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} className="search-container">
            <div style={{ padding: '0 0.85rem', color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Search by Plot No or Name..."
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                padding: '0.75rem 0.25rem',
                width: '100%',
                fontSize: '1rem',
                outline: 'none',
                paddingRight: '2.5rem',
                fontWeight: 500
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  transition: 'background 0.2s'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px', paddingBottom: '2rem' }} className="custom-scrollbar">

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ position: 'relative', width: '30px', height: '30px' }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
              {error}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%', textAlign: 'left' }}>Plot No</th>
                    <th style={{ textAlign: 'left' }}>Farmer Name</th>
                    <th style={{ width: '22%', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {searchTerm ? 'No results found.' : 'No data found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, index) => (
                      <Fragment key={index}>
                        <tr
                          onClick={() => toggleExpand(row.plotNo)}
                          style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                          className={expandedPlot === row.plotNo ? 'row-active' : ''}
                        >
                          <td style={{ fontWeight: 500, fontSize: '0.75rem', color: '#818cf8', padding: '1rem 0.5rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.plotNo}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem', padding: '1rem 0.5rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.farmerName}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '1rem' }}>
                            <span style={{
                              fontSize: '0.6rem',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              opacity: 0.8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {expandedPlot === row.plotNo ? 'CLOSE' : 'VIEW'}
                              <span style={{ fontSize: '0.8rem' }}>{expandedPlot === row.plotNo ? '▲' : '▼'}</span>
                            </span>
                          </td>
                        </tr>
                        {expandedPlot === row.plotNo && (
                          <tr style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                            <td colSpan={3} style={{ padding: '0' }}>
                              <div className="animate-fade-in detail-expansion-container" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="details-grid">

                                  {/* ID Number Card */}
                                  <div className="detail-card" style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                                    border: '1px solid rgba(99, 102, 241, 0.25)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: '#6366f1', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ID Number</span>
                                    </div>
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.idNo}</div>
                                  </div>

                                  {/* Bank Acc No Card */}
                                  <div className="detail-card" style={{
                                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                                    border: '1px solid rgba(37, 99, 235, 0.25)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: '#2563eb', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Acc. No</span>
                                    </div>
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.bankAccNo}</div>
                                  </div>

                                  {/* Bank Code Card */}
                                  <div className="detail-card" style={{
                                    background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
                                    border: '1px solid rgba(217, 119, 6, 0.25)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: '#d97706', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M3 21v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M10 10l-2 2 2 2"></path><path d="M14 14l2-2-2-2"></path></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Code</span>
                                    </div>
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.bankCode}</div>
                                  </div>

                                  {/* Balance Card */}
                                  <div className="detail-card" style={{
                                    background: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-')
                                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)'
                                      : 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(225, 29, 72, 0.1) 100%)',
                                    border: `1px solid ${row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#10b981' : '#f43f5e', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#a7f3d0' : '#fecdd3', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Balance</span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace', color: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#10b981' : '#f43f5e', marginTop: '0.2rem' }}>
                                      Rs.{formatBalance(row.balanceAmount)}
                                    </div>
                                  </div>

                                  {/* List Number Card */}
                                  <div className="detail-card" style={{
                                    background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.15) 0%, rgba(30, 41, 59, 0.1) 100%)',
                                    border: '1px solid rgba(148, 163, 184, 0.3)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: '#475569', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>List No</span>
                                    </div>
                                    <div style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>{row.listNo}</div>
                                  </div>

                                  {/* Banked Date Card */}
                                  <div className="detail-card" style={{
                                    background: row.bankedDate.toLowerCase() === 'pending'
                                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)'
                                      : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                                    border: `1px solid ${row.bankedDate.toLowerCase() === 'pending' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.35)'}`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div style={{ background: row.bankedDate.toLowerCase() === 'pending' ? '#d97706' : '#0891b2', padding: '5px', borderRadius: '8px', display: 'flex' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                      </div>
                                      <span style={{ fontSize: '0.65rem', color: row.bankedDate.toLowerCase() === 'pending' ? '#fde68a' : '#cffafe', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Banked Date</span>
                                    </div>
                                    <div style={{ color: row.bankedDate.toLowerCase() === 'pending' ? '#fbbf24' : '#22d3ee', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                                      {row.bankedDate}
                                    </div>
                                  </div>
                                </div>

                                {/* Copy Button */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPlotDetails(row);
                                    }}
                                    style={{
                                      background: copiedId === row.plotNo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                      color: copiedId === row.plotNo ? '#34d399' : '#818cf8',
                                      border: `1px solid ${copiedId === row.plotNo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                                      padding: '0.5rem 1rem',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {copiedId === row.plotNo ? (
                                      <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Details Copied!
                                      </>
                                    ) : (
                                      <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        Copy All Details
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {/* Footer */}
      <footer style={{ padding: '1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Click rows to expand details.
        </p>
      </footer>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white' }}>About Portal</h3>
              <button onClick={() => setShowAbout(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                This <strong>Farmer Final Payment Portal</strong> is designed to provide real-time access to payment details for field officers.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Version</span>
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>v2.4.0-SC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Last Update</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>2026 Season</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Access</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>Verified Only</span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', textAlign: 'center', opacity: 0.6 }}>
                © 2026 Zone Office Information Systems
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => setShowAbout(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Modal */}
      {showDashboard && (
        <div className="modal-overlay" onClick={() => setShowDashboard(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'white' }}>Quick Insights</h3>
              </div>
              <button onClick={() => setShowDashboard(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="dashboard-grid-2 dashboard-compact-gap">
              {/* Total Farmers */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Total Payment Farmers</div>
                <div className="dashboard-value-large" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{stats.totalFarmers.toLocaleString()}</div>
                <div style={{ fontSize: '0.6rem', color: '#818cf8', marginTop: '0.1rem' }}>Plot No Count</div>
              </div>

              {/* Total Balance */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Total Balance</div>
                <div className="dashboard-value-large" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>Rs. {formatBalance(stats.totalBalance.toString())}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(52, 211, 153, 0.6)', marginTop: '0.1rem' }}>All Payouts Collection</div>
              </div>
            </div>

            {/* Balance Breakdown Cards */}
            <div className="dashboard-grid-2 dashboard-compact-gap">
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Payout Complete</div>
                <div className="dashboard-value-large" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>Rs. {formatBalance(stats.paidBalance.toString())}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Pending Balance</div>
                <div className="dashboard-value-large" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ef4444' }}>Rs. {formatBalance(stats.pendingBalance.toString())}</div>
              </div>
            </div>

            <div className="dashboard-grid-3 dashboard-compact-gap">
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.1rem' }}>RTGS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>{stats.rtgsCount}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Cheque</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{stats.chequeCount}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Nill / -</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{stats.nillCount}</div>
              </div>
            </div>

            {/* Progress Bar Section */}
            <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '16px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Payment Status</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{stats.paidCount} Banked <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>/ {stats.paidCount + stats.pendingCount}</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#818cf8' }}>{stats.percentPaid}%</div>
                </div>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${stats.percentPaid}%`, height: '100%', background: 'linear-gradient(to right, #6366f1, #818cf8)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stats.paidCount} Paid</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stats.pendingCount} Pending</span>
                </div>
              </div>
            </div>

            {userRole === 'admin' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Send Push Notification
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <input 
                    type="text" 
                    placeholder="Notification Title" 
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem', color: 'white', fontSize: '0.85rem' }}
                  />
                  <textarea 
                    placeholder="Message content..." 
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem', color: 'white', fontSize: '0.85rem', minHeight: '60px', resize: 'none' }}
                  ></textarea>
                  <button 
                    onClick={sendNotification}
                    disabled={sendingNotif}
                    style={{ 
                      background: sendingNotif ? 'rgba(99, 102, 241, 0.5)' : '#6366f1', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.6rem', 
                      fontWeight: 700, 
                      cursor: sendingNotif ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {sendingNotif ? 'Sending...' : 'Broadcast to All Users'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', marginBottom: '1rem' }}>
              * Stats are calculated based on the current season data.
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: '12px' }}
              onClick={() => setShowDashboard(false)}
            >
              Back to Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
