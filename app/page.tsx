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
Balance: Rs. ${formatBalance(row.balanceAmount)}
List No: ${row.listNo}
Banked Date: ${row.bankedDate}
----------------------------`.trim();

    navigator.clipboard.writeText(text);
    setCopiedId(row.plotNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.plotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const lastBankedInfo = useMemo(() => {
    // Look for records that have an actual banked date (not pending/placeholder)
    const validEntries = [...data].filter(item => {
      const date = (item.bankedDate || '').toLowerCase().trim();
      return date !== '' && 
             date !== 'pending' && 
             date !== '-' && 
             date !== 'nill' && 
             date !== 'minus' &&
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
      
      <div style={{ padding: '1rem 1rem 0 1rem', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Header Section */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '1rem'
      }} className="animate-fade-in">
        <div style={{ minWidth: '200px', flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Farmer Final Payment 2026-SC
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Zone Office - Field Officer Access Port</p>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="btn" 
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          Logout
        </button>
      </header>
    </div>

      {/* Main Content */}
      <main className="animate-fade-in" style={{ animationDelay: '0.1s', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 1rem 1rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
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

          {/* Search Bar */}
          <div className="glass" style={{ padding: '0.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{ padding: '0 0.75rem', color: 'var(--text-muted)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-main)', 
                padding: '0.6rem 0.25rem', 
                width: '100%', 
                fontSize: '0.95rem',
                outline: 'none',
                paddingRight: '2.5rem'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  width: '22px',
                  height: '22px',
                  borderRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  zIndex: 10
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
                  <th style={{ width: '40%' }}>Plot No</th>
                  <th>Farmer Name</th>
                  <th style={{ width: '30px' }}></th>
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
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 600, color: '#6366f1', wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden' }}>{row.plotNo}</td>
                        <td style={{ fontWeight: 500, wordBreak: 'break-word', maxWidth: '0', overflow: 'hidden' }}>{row.farmerName}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                            {expandedPlot === row.plotNo ? '▲' : '▼'}
                          </span>
                        </td>
                      </tr>
                      {expandedPlot === row.plotNo && (
                        <tr style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                          <td colSpan={3} style={{ padding: '0' }}>
                            <div className="animate-fade-in" style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                
                                {/* ID Number Card */}
                                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" style={{ minWidth: '11px', flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span style={{ fontSize: '0.6rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>ID Number</span>
                                  </div>
                                  <div style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 500, wordBreak: 'break-all' }}>{row.idNo}</div>
                                </div>

                                {/* Balance Card */}
                                <div style={{ background: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '12px', border: `1px solid ${row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#34d399' : '#f87171'} strokeWidth="2.5" style={{ minWidth: '11px', flexShrink: 0 }}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    <span style={{ fontSize: '0.6rem', color: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#34d399' : '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>Balance</span>
                                  </div>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? '#10b981' : '#ef4444' }}>
                                    Rs.{formatBalance(row.balanceAmount)}
                                  </div>
                                </div>

                                {/* List Number Card */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ minWidth: '11px', flexShrink: 0 }}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>List No</span>
                                  </div>
                                  <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>{row.listNo}</div>
                                </div>

                                {/* Banked Date Card */}
                                <div style={{ background: row.bankedDate.toLowerCase() === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(56, 189, 248, 0.05)', padding: '0.75rem', borderRadius: '12px', border: `1px solid ${row.bankedDate.toLowerCase() === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)'}`, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={row.bankedDate.toLowerCase() === 'pending' ? '#fbbf24' : '#38bdf8'} strokeWidth="2.5" style={{ minWidth: '11px', flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <span style={{ fontSize: '0.6rem', color: row.bankedDate.toLowerCase() === 'pending' ? '#fbbf24' : '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>Banked Date</span>
                                  </div>
                                  <div style={{ color: row.bankedDate.toLowerCase() === 'pending' ? '#fbbf24' : '#38bdf8', fontWeight: 700, fontSize: '0.8rem' }}>
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
