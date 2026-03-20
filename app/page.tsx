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
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

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
      
      const sc = searchTerm.toLowerCase();
      return item.plotNo.toLowerCase().includes(sc) ||
             item.farmerName.toLowerCase().includes(sc);
    });
  }, [data, searchTerm]);

  const lastBankedInfo = useMemo(() => {
    // Look for records that have an actual banked date (not pending/placeholder)
    const validEntries = [...data].filter(item => {
      const isValidPlot = item.plotNo && item.plotNo.trim() !== '' && item.plotNo !== '-';
      if (!isValidPlot) return false;

      const date = (item.bankedDate || '').toLowerCase().trim();
      return date !== '' && 
             date !== 'pending' && 
             date !== '-' && 
             date !== 'nill' && 
             date !== 'minus' &&
             date !== 'cheque' &&
             date !== 'null';
    });
    
    // Return the last one in the list (assuming chronological order in the sheet)
    return validEntries.length > 0 ? validEntries[validEntries.length - 1] : null;
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
        gap: '0.75rem'
      }} className="animate-fade-in">
        <div style={{ minWidth: '240px', flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.85rem', 
            fontWeight: 800, 
            margin: 0, 
            background: 'linear-gradient(to right, #ffffff, #94a3b8)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Farmer Final Payment 2026-SC
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <span style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: '#818cf8', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '6px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>Zone Office</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Field Officer Access Port</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="btn" 
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem 1rem' }}
        >
          Logout
        </button>
      </header>
    </div>

      {/* Main Content */}
      <main className="animate-fade-in" style={{ animationDelay: '0.1s', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 1rem 0.5rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Farmer Records</h2>
            <div style={{ 
              background: 'rgba(56, 189, 248, 0.1)', 
              border: '1px solid rgba(56, 189, 248, 0.3)', 
              color: '#7dd3fc', 
              padding: '0.4rem 0.75rem', 
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%', display: 'inline-block' }}></span>
              Read-Only
            </div>
          </div>

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
                  <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }}></div>
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
            background: 'rgba(30, 41, 59, 0.3)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.3rem', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} className="search-container">
            <div style={{ padding: '0 0.85rem', color: '#94a3b8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search by Plot No or Name..." 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#f8fafc', 
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
                        <td style={{ fontWeight: 600, fontSize: '0.85rem', padding: '1rem 0.5rem', color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.farmerName}</td>
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
                                    <span style={{ fontSize: '0.65rem', color: '#c7d2fe', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ID Number</span>
                                  </div>
                                  <div style={{ fontFamily: 'monospace', color: '#f8fafc', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.idNo}</div>
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
                                    <span style={{ fontSize: '0.65rem', color: '#bfdbfe', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Acc. No</span>
                                  </div>
                                  <div style={{ fontFamily: 'monospace', color: '#f8fafc', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.bankAccNo}</div>
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
                                    <span style={{ fontSize: '0.65rem', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bank Code</span>
                                  </div>
                                  <div style={{ fontFamily: 'monospace', color: '#f8fafc', fontSize: '1rem', fontWeight: 800, wordBreak: 'break-all', marginTop: '0.2rem' }}>{row.bankCode}</div>
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
                                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>List No</span>
                                  </div>
                                  <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>{row.listNo}</div>
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
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
          Click rows to expand details.
        </p>
      </footer>
    </div>
  );
}
