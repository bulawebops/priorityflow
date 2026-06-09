import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { useStore } from '../store';

const CAT_COLORS = {
  work: '#3d7cff', business: '#f59e0b', church: '#a78bfa', personal: '#00e5c4',
};
const URG_COLORS = {
  critical: '#ff4757', high: '#ff8c42', medium: '#f59e0b', low: '#6ee7b7',
};

export default function AnalyticsView() {
  const { history, tasks } = useStore();

  const stats = useMemo(() => {
    const completed = history.length;
    const today = format(new Date(), 'yyyy-MM-dd');
    const completedToday = history.filter(h => h.dateKey === today).length;
    const pending = tasks.filter(t => !t.completed).length;

    // Last 7 days daily counts
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      const count = history.filter(h => h.dateKey === key).length;
      return { day: format(d, 'EEE'), count, key };
    });

    // By category
    const byCategory = Object.entries(
      history.reduce((acc, h) => {
        acc[h.category] = (acc[h.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    // By urgency
    const byUrgency = Object.entries(
      history.reduce((acc, h) => {
        acc[h.urgency] = (acc[h.urgency] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    // Avg duration
    const withDuration = history.filter(h => h.estimatedMinutes);
    const avgDuration = withDuration.length
      ? Math.round(withDuration.reduce((s, h) => s + h.estimatedMinutes, 0) / withDuration.length)
      : 0;

    // Best day
    const bestDay = days.reduce((max, d) => d.count > (max?.count ?? -1) ? d : max, null);

    return { completed, completedToday, pending, days, byCategory, byUrgency, avgDuration, bestDay };
  }, [history, tasks]);

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.heading}>Analytics</h1>
        <p style={styles.sub}>Your productivity at a glance</p>
      </header>

      <div style={styles.content}>
        {/* KPI cards */}
        <div style={styles.kpiGrid} className="stagger">
          <KpiCard label="Completed Today" value={stats.completedToday} icon="✅" accent="#00e5c4" />
          <KpiCard label="Total Completed" value={stats.completed} icon="🏆" accent="#3d7cff" />
          <KpiCard label="Pending" value={stats.pending} icon="⏳" accent="#f59e0b" />
          <KpiCard label="Avg Duration" value={stats.avgDuration ? `${stats.avgDuration}m` : '—'} icon="⏱" accent="#a78bfa" />
        </div>

        {/* 7-day chart */}
        <div style={styles.chartCard} className="animate-fadeIn">
          <h3 style={styles.chartTitle}>Tasks Completed – Last 7 Days</h3>
          {stats.completed === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.days} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#8b96b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b96b0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#131b33', border: '1px solid #1a2340', borderRadius: '8px', color: '#e8edf8', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(61,124,255,0.08)' }}
                />
                <Bar dataKey="count" fill="#3d7cff" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        {stats.byCategory.length > 0 && (
          <div style={styles.chartCard} className="animate-fadeIn">
            <h3 style={styles.chartTitle}>By Category</h3>
            <div style={styles.pieRow}>
              <ResponsiveContainer width="50%" height={140}>
                <PieChart>
                  <Pie data={stats.byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {stats.byCategory.map((entry) => (
                      <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#3d7cff'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#131b33', border: '1px solid #1a2340', borderRadius: '8px', color: '#e8edf8', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.legend}>
                {stats.byCategory.map(({ name, value }) => (
                  <div key={name} style={styles.legendItem}>
                    <div style={{ ...styles.legendDot, background: CAT_COLORS[name] || '#3d7cff' }} />
                    <span style={styles.legendName}>{name}</span>
                    <span style={styles.legendVal}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Urgency breakdown */}
        {stats.byUrgency.length > 0 && (
          <div style={styles.chartCard} className="animate-fadeIn">
            <h3 style={styles.chartTitle}>By Urgency</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.byUrgency.sort((a, b) => b.value - a.value).map(({ name, value }) => {
                const max = Math.max(...stats.byUrgency.map(u => u.value));
                return (
                  <div key={name} style={styles.urgRow}>
                    <span style={{ ...styles.urgLabel, color: URG_COLORS[name] }}>{name}</span>
                    <div style={styles.urgBarWrap}>
                      <div style={{
                        ...styles.urgBar,
                        width: `${(value / max) * 100}%`,
                        background: URG_COLORS[name],
                      }} />
                    </div>
                    <span style={styles.urgCount}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📊</div>
            <p style={{ color: 'var(--text-2)', textAlign: 'center' }}>
              Complete some tasks to see your analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, accent }) {
  return (
    <div style={{ ...styles.kpi, borderTop: `3px solid ${accent}` }}>
      <div style={styles.kpiIcon}>{icon}</div>
      <div style={{ ...styles.kpiValue, color: accent }}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>No data yet</p>
    </div>
  );
}

const styles = {
  root: { minHeight: '100%', background: 'var(--bg)' },
  header: {
    padding: '20px 16px 16px',
    paddingTop: 'calc(20px + var(--safe-top))',
    background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
  },
  heading: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
    letterSpacing: '-0.03em',
  },
  sub: { color: 'var(--text-2)', fontSize: '0.85rem', marginTop: '2px' },
  content: { padding: '16px' },

  kpiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  kpi: {
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', padding: '16px 14px',
  },
  kpiIcon: { fontSize: '1.25rem', marginBottom: '8px' },
  kpiValue: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 },
  kpiLabel: { fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px', fontWeight: 500 },

  chartCard: {
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '12px',
  },
  chartTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
    marginBottom: '14px', color: 'var(--text-2)',
  },
  pieRow: { display: 'flex', alignItems: 'center' },
  legend: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  legendName: { flex: 1, fontSize: '0.8rem', color: 'var(--text-2)', textTransform: 'capitalize' },
  legendVal: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' },

  urgRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  urgLabel: { width: '64px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  urgBarWrap: { flex: 1, height: '8px', background: 'var(--bg-4)', borderRadius: '4px', overflow: 'hidden' },
  urgBar: { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' },
  urgCount: { width: '24px', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 700 },

  emptyState: { padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
};
