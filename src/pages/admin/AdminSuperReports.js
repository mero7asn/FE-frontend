import React, { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './AdminSuperReports.css';

const AdminSuperReports = () => {
  const [rankingData, setRankingData] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(true);

  // Controls for customer ranking
  const [sortBy, setSortBy] = useState('revenue');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Single customer quick search phone input
  const [singleCustomerPhone, setSingleCustomerPhone] = useState('');

  // Controls for custom month report
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);

  const [downloadingReport, setDownloadingReport] = useState(false);

  const loadCustomerRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const { data } = await reportAPI.getCustomerRanking({ sortBy, search });
      setRankingData(data);
    } catch (error) {
      toast.error('Failed to load customer ranking');
    } finally {
      setLoadingRanking(false);
    }
  }, [sortBy, search]);

  useEffect(() => {
    loadCustomerRanking();
  }, [loadCustomerRanking]);

  // Download blob helper
  const triggerBlobDownload = (blob, defaultFilename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Download Sales Report (Weekly, Monthly, Yearly)
  const handleDownloadReport = async (period, extraParams = {}) => {
    setDownloadingReport(true);
    const toastId = toast.loading(`Generating ${period.toUpperCase()} Excel Sales Report…`);
    try {
      const response = await reportAPI.downloadSalesReport(period, extraParams);
      const filename = `First_Edition_Sales_Report_${period}_${Date.now()}.xlsx`;
      triggerBlobDownload(response.data, filename);

      toast.update(toastId, {
        render: `✅ ${period.toUpperCase()} Excel Report downloaded successfully!`,
        type: 'success',
        isLoading: false,
        autoClose: 3500
      });
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: 'Failed to download report. Ensure you have Super Admin permissions.',
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  // Export Customer Ranking to Excel
  const handleExportCustomerRanking = async () => {
    const toastId = toast.loading('Exporting Customer Ranking to Excel…');
    try {
      const response = await reportAPI.downloadCustomerRankingExcel();
      triggerBlobDownload(response.data, `Customer_Ranking_Report_${Date.now()}.xlsx`);

      toast.update(toastId, {
        render: '✅ Customer Ranking Excel downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3500
      });
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: 'Failed to export customer ranking.',
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    }
  };

  // Download Single Customer Excel Report
  const handleDownloadSingleCustomerReport = async (phoneStr, nameStr = 'Customer') => {
    const targetPhone = phoneStr || singleCustomerPhone;
    if (!targetPhone) {
      toast.error('Please enter or select a customer phone number');
      return;
    }
    const toastId = toast.loading(`Generating single customer report for ${nameStr} (${targetPhone})…`);
    try {
      const response = await reportAPI.downloadSingleCustomerExcel(targetPhone);
      const cleanPhone = targetPhone.replace(/[^\d]/g, '');
      const filename = `First_Edition_Customer_${cleanPhone}_${Date.now()}.xlsx`;
      triggerBlobDownload(response.data, filename);

      toast.update(toastId, {
        render: `✅ Customer report downloaded for ${nameStr}!`,
        type: 'success',
        isLoading: false,
        autoClose: 3500
      });
    } catch (error) {
      console.error(error);
      const msg = error.displayMessage || 'Failed to download customer report. Verify phone number.';
      toast.update(toastId, {
        render: msg,
        type: 'error',
        isLoading: false,
        autoClose: 4000
      });
    }
  };

  return (
    <div className="super-reports-page">
      <div className="container">
        
        {/* Header */}
        <div className="sr-header">
          <div className="sr-title-group">
            <h1>👑 Super Admin Reports & Customer Ranking</h1>
            <p className="sr-subtitle">
              Pull weekly, monthly & yearly sales reports in Excel format, and manage customer rankings by phone number.
            </p>
          </div>
          <div className="sr-badge">SUPER ADMIN ONLY</div>
        </div>

        {/* ── Section 1: Excel Sales Reports ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 className="sr-section-title" style={{ margin: 0 }}>📊 Download Excel Sales Reports</h2>
          <span style={{ fontSize: '0.8rem', background: '#FCFBF8', padding: '0.4rem 0.8rem', border: '1px solid #C8A45D', borderRadius: '20px', color: '#8E6826', fontWeight: '600' }}>
            📄 Includes 3 Sheets: General Overview | Customer Details | T-Shirts & Sizes Breakdown
          </span>
        </div>
        
        <div className="sr-reports-grid">
          
          {/* Weekly Report Card */}
          <div className="sr-report-card">
            <div>
              <div className="sr-card-icon">📅</div>
              <h3 className="sr-card-title">Weekly Sales Report</h3>
              <p className="sr-card-desc">
                Past 7 days report with 3 sheets: General data, Customer transaction details & T-shirt sales by size.
              </p>
            </div>
            <button
              className="sr-download-btn"
              onClick={() => handleDownloadReport('weekly')}
              disabled={downloadingReport}
            >
              📥 Download Weekly Report (.xlsx)
            </button>
          </div>

          {/* Monthly Report Card */}
          <div className="sr-report-card">
            <div>
              <div className="sr-card-icon">📆</div>
              <h3 className="sr-card-title">Monthly Sales Report</h3>
              <p className="sr-card-desc">
                Past 30 days complete audit containing general overview, customer names/prices, and size sales.
              </p>
            </div>
            <button
              className="sr-download-btn"
              onClick={() => handleDownloadReport('monthly')}
              disabled={downloadingReport}
            >
              📥 Download Monthly Report (.xlsx)
            </button>
          </div>

          {/* Yearly Report Card */}
          <div className="sr-report-card">
            <div>
              <div className="sr-card-icon">📊</div>
              <h3 className="sr-card-title">Yearly Sales Report</h3>
              <p className="sr-card-desc">
                Annual report with general metrics, all customer purchase details, and size inventory performance.
              </p>
            </div>
            <button
              className="sr-download-btn"
              onClick={() => handleDownloadReport('yearly')}
              disabled={downloadingReport}
            >
              📥 Download Yearly Report (.xlsx)
            </button>
          </div>

        </div>

        {/* Custom Month Selector */}
        <div className="sr-custom-box">
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Custom Month & Year Excel Report</h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#7A6F5E' }}>
              Select a specific month and year to download historical 3-sheet sales records.
            </p>
          </div>
          <div className="sr-custom-inputs">
            <select
              className="sr-select"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              className="sr-select"
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              className="sr-download-btn"
              style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
              onClick={() => handleDownloadReport('monthly', { month: customMonth, year: customYear })}
              disabled={downloadingReport}
            >
              📥 Download Custom Report
            </button>
          </div>
        </div>

        {/* ── Section 2: Single Customer Specific Report Search ── */}
        <div className="sr-custom-box" style={{ background: '#FCFBF8', borderColor: '#1A1612' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 Download Report for 1 Specific Customer
            </h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#7A6F5E' }}>
              Search by customer phone number to download an exclusive Excel report of all Tees and orders bought by that customer.
            </p>
          </div>
          <div className="sr-custom-inputs">
            <input
              type="tel"
              className="sr-select"
              placeholder="e.g. 01012345678 or +20…"
              value={singleCustomerPhone}
              onChange={(e) => setSingleCustomerPhone(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            <button
              className="sr-download-btn"
              style={{ width: 'auto', padding: '0.65rem 1.5rem', background: '#C8A45D', borderColor: '#C8A45D', color: '#FFFFFF' }}
              onClick={() => handleDownloadSingleCustomerReport(singleCustomerPhone)}
            >
              📥 Download Customer Excel
            </button>
          </div>
        </div>

        {/* ── Section 3: Customer Ranking by Phone Number ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', marginTop: '3rem' }}>
          <h2 className="sr-section-title" style={{ margin: 0 }}>
            🏆 Customer Ranking by Phone Number
          </h2>
          <button
            className="sr-download-btn"
            style={{ width: 'auto', background: '#1A1612', color: '#FFFFFF', borderColor: '#1A1612' }}
            onClick={handleExportCustomerRanking}
          >
            📥 Export All Customers Ranking (.xlsx)
          </button>
        </div>

        {/* Metrics Row */}
        {rankingData && (
          <div className="sr-metrics-row">
            <div className="sr-metric-card">
              <div className="sr-metric-icon">👥</div>
              <div className="sr-metric-info">
                <span className="sr-metric-label">Total Customers</span>
                <span className="sr-metric-val">{rankingData.totalCustomers}</span>
              </div>
            </div>

            <div className="sr-metric-card">
              <div className="sr-metric-icon">💰</div>
              <div className="sr-metric-info">
                <span className="sr-metric-label">Total Customer Spend</span>
                <span className="sr-metric-val">EGP {Number(rankingData.overallRevenue || 0).toLocaleString('en-EG')}</span>
              </div>
            </div>

            <div className="sr-metric-card">
              <div className="sr-metric-icon">🥇</div>
              <div className="sr-metric-info">
                <span className="sr-metric-label">Top Customer</span>
                <span className="sr-metric-val">{rankingData.topSpender || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search & Sort Controls */}
        <div className="sr-controls-bar">
          <input
            type="text"
            className="sr-search-input"
            placeholder="🔍 Search customer by name or phone number (+20…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="sr-sort-group">
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#7A6F5E' }}>Arrange By:</span>
            <select
              className="sr-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="revenue">Total Spent (Highest First)</option>
              <option value="ordersCount">Total Purchases Count</option>
              <option value="lastPurchase">Most Recent Purchase Date</option>
            </select>
          </div>
        </div>

        {/* Customer Ranking Table */}
        {loadingRanking ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#7A6F5E' }}>
            <div className="sp-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading customer ranking details…
          </div>
        ) : !rankingData?.customers || rankingData.customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E0D0' }}>
            <h3>No Customer Records Found</h3>
            <p style={{ color: '#7A6F5E' }}>Customer ranking will populate automatically as sales and orders are recorded.</p>
          </div>
        ) : (
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Total Spent (EGP)</th>
                  <th>Purchases</th>
                  <th>Breakdown</th>
                  <th>Last Purchase</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.customers.map((cust, index) => {
                  const rankClass = index === 0 ? 'sr-rank-top1' : index === 1 ? 'sr-rank-top2' : index === 2 ? 'sr-rank-top3' : '';
                  return (
                    <tr key={cust.phone}>
                      <td>
                        <span className={`sr-rank-badge ${rankClass}`}>{index + 1}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#1A1612' }}>{cust.name}</span>
                      </td>
                      <td>
                        <span className="sr-phone-cell">
                          <span style={{ marginRight: '4px' }}>🇪🇬</span>{cust.phone}
                        </span>
                      </td>
                      <td>
                        <span className="sr-revenue-cell">
                          EGP {Number(cust.totalRevenue).toLocaleString('en-EG')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700' }}>{cust.totalOrders} items</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', background: '#E8E0D0', borderRadius: '4px', fontWeight: '600' }}>
                            🏷️ {cust.directSalesCount} Direct
                          </span>
                          <span style={{ padding: '0.2rem 0.5rem', background: '#E3F2FD', color: '#1565C0', borderRadius: '4px', fontWeight: '600' }}>
                            🛒 {cust.onlineOrdersCount} Online
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#7A6F5E' }}>
                          {cust.lastPurchase ? new Date(cust.lastPurchase).toLocaleDateString('en-GB') : '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="sr-btn-history"
                            onClick={() => setSelectedCustomer(cust)}
                          >
                            📜 History ({cust.purchases?.length || 0})
                          </button>
                          <button
                            className="sr-btn-history"
                            style={{ borderColor: '#2E7D32', color: '#2E7D32' }}
                            onClick={() => handleDownloadSingleCustomerReport(cust.phone, cust.name)}
                            title="Download Excel Report for this customer only"
                          >
                            📥 Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <div className="sr-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="sr-modal" onClick={e => e.stopPropagation()}>
            
            <div className="sr-modal-header">
              <div>
                <h2>Customer Sales History</h2>
                <span style={{ fontSize: '0.85rem', color: '#C8A45D', fontFamily: 'monospace' }}>
                  📞 {selectedCustomer.phone}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  className="sr-download-btn"
                  style={{ width: 'auto', background: '#C8A45D', borderColor: '#C8A45D', color: '#FFFFFF', padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                  onClick={() => handleDownloadSingleCustomerReport(selectedCustomer.phone, selectedCustomer.name)}
                >
                  📥 Download Customer Excel
                </button>
                <button className="sr-modal-close" onClick={() => setSelectedCustomer(null)}>✕</button>
              </div>
            </div>

            <div className="sr-modal-body">
              {/* Summary box */}
              <div className="sr-cust-summary">
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#7A6F5E', fontWeight: '600' }}>CUSTOMER NAME</span>
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: '#14120F' }}>{selectedCustomer.name}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#7A6F5E', fontWeight: '600' }}>TOTAL REVENUE</span>
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: '#2E7D32' }}>EGP {Number(selectedCustomer.totalRevenue).toLocaleString('en-EG')}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#7A6F5E', fontWeight: '600' }}>TOTAL PURCHASES</span>
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: '#14120F' }}>{selectedCustomer.totalOrders}</span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '700' }}>Purchase Log:</h4>

              {selectedCustomer.purchases?.map((p, idx) => (
                <div key={idx} className="sr-purchase-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: p.type === 'Direct Sale' ? '#FFF8E1' : '#E3F2FD',
                        color: p.type === 'Direct Sale' ? '#8E6826' : '#1565C0'
                      }}>{p.type}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.85rem' }}>{p.refNumber}</span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#14120F' }}>{p.productName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7A6F5E', marginTop: '0.2rem' }}>
                      Size: <strong>{p.size}</strong> {p.color ? `| Color: ${p.color}` : ''} | Date: {new Date(p.date).toLocaleString('en-GB')}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#2E7D32' }}>
                    EGP {Number(p.amount).toLocaleString('en-EG')}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSuperReports;
