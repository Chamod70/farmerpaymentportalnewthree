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

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.plotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const toggleExpand = (plotNo: string) => {
    setExpandedPlot(expandedPlot === plotNo ? null : plotNo);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
            FARMER FINAL PAYMENT 2026-SC
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

      {/* Main Content */}
      <main className="animate-fade-in" style={{ animationDelay: '0.1s', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
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
                        <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                          <td colSpan={3} style={{ padding: '0' }}>
                            <div className="animate-fade-in grid-mobile-1" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                <div className="input-label" style={{ marginBottom: '0.15rem', fontSize: '0.7rem' }}>ID Number</div>
                                <div style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.85rem' }}>{row.idNo}</div>
                              </div>
                              <div>
                                <div className="input-label" style={{ marginBottom: '0.15rem', fontSize: '0.7rem' }}>Balance Amount</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: row.balanceAmount === 'Rs. 0' || !row.balanceAmount.includes('-') ? 'var(--success)' : 'var(--danger)' }}>
                                  Rs. {formatBalance(row.balanceAmount)}
                                </div>
                              </div>
                              <div>
                                <div className="input-label" style={{ marginBottom: '0.15rem', fontSize: '0.7rem' }}>List Number</div>
                                <div>
                                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    {row.listNo}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="input-label" style={{ marginBottom: '0.15rem', fontSize: '0.7rem' }}>Banked Date</div>
                                <div>
                                  {row.bankedDate.toLowerCase() === 'pending' ? (
                                    <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.7rem' }}>Pending</span>
                                  ) : (
                                    <span className="status-pill status-success" style={{ fontSize: '0.7rem' }}>{row.bankedDate}</span>
                                  )}
                                </div>
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
      </main>
      
      {/* Footer */}
      <footer style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          Click rows to expand details.
        </p>
      </footer>
    </div>
  );
}
