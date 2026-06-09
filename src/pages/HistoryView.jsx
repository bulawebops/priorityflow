import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store';

const CAT_COLORS = {
  work: '#3d7cff', business: '#f59e0b', church: '#a78bfa', personal: '#00e5c4',
};
const URG_COLORS = {
  critical: '#ff4757', high: '#ff8c42', medium: '#f59e0b', low: '#6ee7b7',
};

export default function HistoryView() {
  const { history } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const grouped = useMemo(() => {
    const filtered = history.filter(h => {
      const matchSearch = !search || h.title?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' || h.category === catFilter;
      return matchSearch && matchCat;
    });

    const groups = {};
    filtered.forEach(task => {
      const key = task.dateKey || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30); // show last 30 days
  }, [history, search, catFilter]);

  const formatDate = (key) => {
    try {
      const d = parseISO(key);
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      if (key === today) return 'Today';
      if (key === yesterday) return 'Yesterday';
      return format(d, 'EEEE, MMM d');
    } catch { return key; }
  };

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.heading}>History</h1>
        <p style={styles.sub}>{history.length} tasks completed</p>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={styles.searchInput}
          />
        </div>

        {/* Category filter */}
        <div style={styles.filterRow}>
          {['all', 'work', 'business', 'church', 'personal'].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                ...styles.chip,
                ...(catFilter === cat ? { background: 'var(--accent-glow)', color: 'var(--accent-light)', borderColor: 'var(--accent)' } : {}),
              }}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div style={styles.content}>
        {grouped.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <p style={{ color: 'var(--text-2)', textAlign: 'center' }}>
              {history.length === 0
                ? 'Your completed tasks will appear here.'
                : 'No results match your search.'}
            </p>
          </div>
        )}

        {grouped.map(([dateKey, tasks]) => (
          <div key={dateKey} style={styles.group} className="animate-fadeIn">
            <div style={styles.groupHeader}>
              <span style={styles.groupDate}>{formatDate(dateKey)}</span>
              <span style={styles.groupCount}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
            </div>
            {tasks.map(task => (
              <HistoryCard key={task.id} task={task} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ task }) {
  const completedTime = task.completedAt?.toDate
    ? format(task.completedAt.toDate(), 'h:mm a')
    : '';

  return (
    <div style={styles.card}>
      <div style={{ ...styles.check, background: CAT_COLORS[task.category] || '#3d7cff' }}>✓</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.cardTitle}>{task.title}</div>
        <div style={styles.cardMeta}>
          <span className={`cat-pill cat-${task.category}`}>{task.category}</span>
          <span style={{ ...styles.metaText, color: URG_COLORS[task.urgency] }}>
            {task.urgency}
          </span>
          {task.estimatedMinutes && (
            <span style={styles.metaText}>⏱ {task.estimatedMinutes}m</span>
          )}
          {completedTime && (
            <span style={styles.metaText}>✓ {completedTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: '100%', background: 'var(--bg)' },
  header: {
    padding: '20px 16px 0',
    paddingTop: 'calc(20px + var(--safe-top))',
    background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
  },
  heading: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
    letterSpacing: '-0.03em',
  },
  sub: { color: 'var(--text-2)', fontSize: '0.85rem', marginTop: '2px', marginBottom: '12px' },

  searchWrap: {
    position: 'relative', marginBottom: '12px',
  },
  searchIcon: {
    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
    fontSize: '0.875rem', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '9px 12px 9px 36px',
    background: 'var(--bg-3)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', color: 'var(--text)',
    fontSize: '0.875rem', outline: 'none',
  },

  filterRow: {
    display: 'flex', gap: '6px', overflowX: 'auto',
    paddingBottom: '12px', scrollbarWidth: 'none',
  },
  chip: {
    flexShrink: 0, padding: '4px 12px', borderRadius: '99px',
    fontSize: '0.75rem', fontWeight: 600,
    background: 'var(--bg-3)', color: 'var(--text-2)',
    border: '1px solid var(--border)', cursor: 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },

  content: { padding: '16px' },

  group: { marginBottom: '20px' },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '8px',
  },
  groupDate: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
    color: 'var(--text)',
  },
  groupCount: {
    fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500,
  },

  card: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', padding: '10px 12px',
    marginBottom: '6px',
  },
  check: {
    width: '24px', height: '24px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', color: 'white', flexShrink: 0, fontWeight: 700,
  },
  cardTitle: {
    fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)',
    marginBottom: '4px', lineHeight: 1.3,
  },
  cardMeta: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
  },
  metaText: { fontSize: '0.72rem', color: 'var(--text-3)' },
  empty: { padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
};
