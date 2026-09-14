import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import './AdminAnalytics.css';
import { egyptGeoJSON } from './egypt-governorates';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── All 27 Egyptian Governorates ──────────────────────────────────────────
const ALL_GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Luxor', 'Aswan', 'Asyut',
  'Beheira', 'Beni Suef', 'Dakahlia', 'Damietta', 'Faiyum',
  'Gharbia', 'Ismailia', 'Kafr El Sheikh', 'Matruh', 'Minya',
  'Monufia', 'New Valley', 'North Sinai', 'Port Said', 'Qalyubia',
  'Qena', 'Red Sea', 'Sharqia', 'Sohag', 'South Sinai', 'Suez'
];

// ─── Horizontal Bar Chart ───────────────────────────────────────────────────
const BarChart = ({ data, color, maxCount }) => {
  if (!data || data.length === 0) {
    return <div className="aa-empty">No data for this period</div>;
  }
  const max = maxCount || Math.max(...data.map(d => d.count), 1);
  return (
    <div className="aa-barchart">
      {data.map((item, i) => (
        <div className="aa-bar-row" key={item.governorate}>
          <span className="aa-bar-label">{item.governorate}</span>
          <div className="aa-bar-track">
            <div
              className="aa-bar-fill"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: color,
                animationDelay: `${i * 40}ms`
              }}
            />
          </div>
          <span className="aa-bar-value">{item.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Sparkline Trend Chart ──────────────────────────────────────────────────
const SparkLine = ({ data, color }) => {
  if (!data || data.length < 2) return <div className="aa-empty">Not enough data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 600, H = 120, PAD = 10;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.count / max) * (H - PAD * 2));
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${PAD + (W - PAD * 2)},${H - PAD} L ${PAD},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="aa-sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
        const y = H - PAD - ((d.count / max) * (H - PAD * 2));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
};

const GeoJSONUpdater = ({ activeMetric, visitorData, clickData }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [map, activeMetric, visitorData, clickData]);
  return null;
};

const EgyptMap = ({ visitorData, clickData, activeMetric }) => {
  const mapRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const source = activeMetric === 'visitors' ? visitorData : clickData;
  const max = source.reduce((m, d) => Math.max(m, d.count), 1);

  const dataMap = useMemo(() => {
    const map = {};
    source.forEach(d => { map[d.governorate] = d.count; });
    return map;
  }, [source]);

  const getColor = useCallback((govId) => {
    const count = dataMap[govId] || 0;
    if (count === 0) return '#e8d6b9';
    const intensity = count / max;
    if (activeMetric === 'visitors') {
      return `hsl(35, 40%, ${30 + intensity * 50}%)`;
    } else {
      return `hsl(120, 35%, ${30 + intensity * 40}%)`;
    }
  }, [dataMap, max, activeMetric]);

  const styleFeature = useCallback((feature) => ({
    fillColor: getColor(feature.properties.gov_id),
    weight: 1,
    opacity: 1,
    color: '#C8A45D',
    dashArray: '2',
    fillOpacity: 0.7
  }), [getColor]);

  const onEachFeature = useCallback((feature, layer) => {
    const govId = feature.properties.gov_id;
    layer.on({
      mouseover: () => setHovered(govId),
      mouseout: () => setHovered(null)
    });
  }, [setHovered]);

  const legendGradient = activeMetric === 'visitors' 
    ? 'linear-gradient(to right, #e8d6b9, #c8a45d)' 
    : 'linear-gradient(to right, #a8d8a8, #4caf50)';

  return (
    <div className="aa-map-wrap">
      <div className="aa-map-legend">
        <span className="aa-legend-label">Low</span>
        <div className="aa-legend-bar" style={{ background: legendGradient }} />
        <span className="aa-legend-label">High</span>
      </div>
      <div className="aa-map-container">
        <MapContainer
          center={[27.0, 31.0]}
          zoom={5}
          style={{ height: '400px', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            opacity={0.6}
          />
          <GeoJSON
            key={activeMetric}
            data={egyptGeoJSON}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
          <GeoJSONUpdater activeMetric={activeMetric} visitorData={visitorData} clickData={clickData} />
        </MapContainer>
      </div>
      {hovered && (
        <div className="aa-map-tooltip">
          <strong>{hovered}</strong>
          <span>
            {activeMetric === 'visitors' ? '👁 Visitors: ' : '🛒 Order Clicks: '}
            {dataMap[hovered]?.toLocaleString() || '0'}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard Component ───────────────────────────────────────────────
const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [activeMetric, setActiveMetric] = useState('visitors');
  const [tableSort, setTableSort] = useState('visitors');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: summary } = await analyticsAPI.getSummary(period);
      setData(summary);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const tableData = ALL_GOVERNORATES.map(gov => {
    const visitors = data?.visitorsByGovernorate?.find(d => d.governorate === gov)?.count || 0;
    const clicks   = data?.orderClicksByGovernorate?.find(d => d.governorate === gov)?.count || 0;
    const rate     = visitors > 0 ? ((clicks / visitors) * 100).toFixed(1) : '0.0';
    return { governorate: gov, visitors, clicks, rate };
  }).filter(r => r.visitors > 0 || r.clicks > 0)
    .sort((a, b) => tableSort === 'visitors' ? b.visitors - a.visitors : tableSort === 'clicks' ? b.clicks - a.clicks : parseFloat(b.rate) - parseFloat(a.rate));

  return (
    <div className="aa-page">
      <div className="container">

        {/* ── Header ── */}
        <div className="aa-header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p className="aa-subtitle">Visitor & order activity by Egyptian Governorate</p>
          </div>
          <div className="aa-header-actions">
            <div className="aa-period-tabs">
              {[7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  className={`aa-period-btn ${period === d ? 'active' : ''}`}
                  onClick={() => setPeriod(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Link to="/admin" className="btn btn-outline aa-back-btn">← Back</Link>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading analytics…</div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="aa-kpi-row">
              <div className="aa-kpi-card aa-kpi-gold">
                <div className="aa-kpi-icon">👁</div>
                <div className="aa-kpi-body">
                  <span className="aa-kpi-label">Total Visitors</span>
                  <span className="aa-kpi-value">{data?.totalVisitors?.toLocaleString() || 0}</span>
                  <span className="aa-kpi-sub">Last {period} days</span>
                </div>
              </div>
              <div className="aa-kpi-card aa-kpi-green">
                <div className="aa-kpi-icon">🛒</div>
                <div className="aa-kpi-body">
                  <span className="aa-kpi-label">Order Now Clicks</span>
                  <span className="aa-kpi-value">{data?.totalClicks?.toLocaleString() || 0}</span>
                  <span className="aa-kpi-sub">Last {period} days</span>
                </div>
              </div>
              <div className="aa-kpi-card aa-kpi-blue">
                <div className="aa-kpi-icon">📈</div>
                <div className="aa-kpi-body">
                  <span className="aa-kpi-label">Conversion Rate</span>
                  <span className="aa-kpi-value">{data?.conversionRate || '0.0'}%</span>
                  <span className="aa-kpi-sub">Clicks ÷ Visitors</span>
                </div>
              </div>
              <div className="aa-kpi-card aa-kpi-purple">
                <div className="aa-kpi-icon">🏆</div>
                <div className="aa-kpi-body">
                  <span className="aa-kpi-label">Top Governorate</span>
                  <span className="aa-kpi-value aa-kpi-gov">{data?.topGovernorate || '—'}</span>
                  <span className="aa-kpi-sub">By visitor count</span>
                </div>
              </div>
            </div>

            {/* ── Egypt Map + Bar Charts ── */}
            <div className="aa-main-grid">

              {/* Map Panel */}
              <div className="aa-panel aa-map-panel">
                <div className="aa-panel-header">
                  <h3>Egypt Heatmap</h3>
                  <div className="aa-metric-tabs">
                    <button
                      className={`aa-metric-btn ${activeMetric === 'visitors' ? 'active' : ''}`}
                      onClick={() => setActiveMetric('visitors')}
                    >
                      Visitors
                    </button>
                    <button
                      className={`aa-metric-btn ${activeMetric === 'clicks' ? 'active' : ''}`}
                      onClick={() => setActiveMetric('clicks')}
                    >
                      Order Clicks
                    </button>
                  </div>
                </div>
                <EgyptMap
                  visitorData={data?.visitorsByGovernorate || []}
                  clickData={data?.orderClicksByGovernorate || []}
                  activeMetric={activeMetric}
                />
              </div>

              {/* Charts Column */}
              <div className="aa-charts-col">

                {/* Visitors chart */}
                <div className="aa-panel">
                  <div className="aa-panel-header">
                    <h3>👁 Visitors by Governorate</h3>
                    <span className="aa-panel-badge aa-badge-gold">Top {Math.min(10, data?.visitorsByGovernorate?.length || 0)}</span>
                  </div>
                  <BarChart
                    data={(data?.visitorsByGovernorate || []).slice(0, 10)}
                    color="linear-gradient(90deg, #8E6826, #C8A45D)"
                    maxCount={data?.visitorsByGovernorate?.[0]?.count || 1}
                  />
                </div>

                {/* Order clicks chart */}
                <div className="aa-panel">
                  <div className="aa-panel-header">
                    <h3>🛒 Order Clicks by Governorate</h3>
                    <span className="aa-panel-badge aa-badge-green">Top {Math.min(10, data?.orderClicksByGovernorate?.length || 0)}</span>
                  </div>
                  <BarChart
                    data={(data?.orderClicksByGovernorate || []).slice(0, 10)}
                    color="linear-gradient(90deg, #2E7D32, #4CAF50)"
                    maxCount={data?.orderClicksByGovernorate?.[0]?.count || 1}
                  />
                </div>

              </div>
            </div>

            {/* ── Trend Charts ── */}
            <div className="aa-trend-grid">
              <div className="aa-panel">
                <div className="aa-panel-header">
                  <h3>Visitor Trend — Last {period} Days</h3>
                </div>
                <SparkLine data={data?.dailyVisitors || []} color="#C8A45D" />
                <div className="aa-trend-labels">
                  {data?.dailyVisitors?.length > 0 && (
                    <>
                      <span>{data.dailyVisitors[0]?.date}</span>
                      <span>{data.dailyVisitors[data.dailyVisitors.length - 1]?.date}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="aa-panel">
                <div className="aa-panel-header">
                  <h3>Order Click Trend — Last {period} Days</h3>
                </div>
                <SparkLine data={data?.dailyClicks || []} color="#4CAF50" />
                <div className="aa-trend-labels">
                  {data?.dailyClicks?.length > 0 && (
                    <>
                      <span>{data.dailyClicks[0]?.date}</span>
                      <span>{data.dailyClicks[data.dailyClicks.length - 1]?.date}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Full Governorate Table ── */}
            <div className="aa-panel aa-table-panel">
              <div className="aa-panel-header">
                <h3>Full Governorate Breakdown</h3>
                <span className="aa-panel-badge aa-badge-gold">{tableData.length} active</span>
              </div>
              {tableData.length === 0 ? (
                <div className="aa-empty">No data recorded yet. Events will appear here as visitors browse the site.</div>
              ) : (
                <div className="aa-table-wrap">
                  <table className="aa-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Governorate</th>
                        <th
                          className={`aa-sortable ${tableSort === 'visitors' ? 'active-sort' : ''}`}
                          onClick={() => setTableSort('visitors')}
                        >
                          Visitors {tableSort === 'visitors' ? '▼' : ''}
                        </th>
                        <th
                          className={`aa-sortable ${tableSort === 'clicks' ? 'active-sort' : ''}`}
                          onClick={() => setTableSort('clicks')}
                        >
                          Order Clicks {tableSort === 'clicks' ? '▼' : ''}
                        </th>
                        <th
                          className={`aa-sortable ${tableSort === 'rate' ? 'active-sort' : ''}`}
                          onClick={() => setTableSort('rate')}
                        >
                          Conv. Rate {tableSort === 'rate' ? '▼' : ''}
                        </th>
                        <th>Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => {
                        const maxV = tableData[0]?.visitors || 1;
                        return (
                          <tr key={row.governorate} className={i === 0 ? 'aa-top-row' : ''}>
                            <td className="aa-rank">{i + 1}</td>
                            <td className="aa-gov-name">
                              {i === 0 && <span className="aa-crown">🏆 </span>}
                              {row.governorate}
                            </td>
                            <td className="aa-num">{row.visitors.toLocaleString()}</td>
                            <td className="aa-num aa-clicks">{row.clicks.toLocaleString()}</td>
                            <td className="aa-num">
                              <span className={`aa-rate-badge ${parseFloat(row.rate) > 5 ? 'aa-rate-high' : ''}`}>
                                {row.rate}%
                              </span>
                            </td>
                            <td>
                              <div className="aa-mini-bar">
                                <div
                                  className="aa-mini-fill aa-mini-visitors"
                                  style={{ width: `${(row.visitors / maxV) * 100}%` }}
                                />
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

          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
