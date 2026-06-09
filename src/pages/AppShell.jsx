import React from 'react';
import { useStore } from '../store';
import TodayView from './TodayView';
import AnalyticsView from './AnalyticsView';
import HistoryView from './HistoryView';
import TaskModal from '../components/TaskModal';

const NAV = [
  { id: 'today',     icon: '⚡', label: 'Today' },
  { id: 'analytics', icon: '📊', label: 'Stats' },
  { id: 'history',   icon: '📋', label: 'History' },
];

export default function AppShell() {
  const { activeView, setActiveView, showAddTask, editingTask } = useStore();

  return (
    <div style={styles.shell}>
      {/* Main content */}
      <main style={styles.main}>
        {activeView === 'today'     && <TodayView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'history'   && <HistoryView />}
      </main>

      {/* Bottom nav */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                ...styles.navBtn,
                ...(activeView === item.id ? styles.navBtnActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {activeView === item.id && <div style={styles.navIndicator} />}
            </button>
          ))}
        </div>
      </nav>

      {/* Task modal */}
      {(showAddTask || editingTask) && <TaskModal />}
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex', flexDirection: 'column', height: '100vh', height: '100dvh',
    background: 'var(--bg)',
  },
  main: {
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
  },
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(8,12,24,0.92)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--border)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navInner: {
    display: 'flex', justifyContent: 'space-around',
    maxWidth: '500px', margin: '0 auto',
    padding: '8px 0',
  },
  navBtn: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '3px', padding: '8px 4px',
    border: 'none', background: 'none', cursor: 'pointer',
    position: 'relative', borderRadius: 'var(--r-md)',
    transition: 'all 0.2s',
  },
  navBtnActive: {},
  navIcon: { fontSize: '1.25rem', lineHeight: 1 },
  navLabel: { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-3)' },
  navIndicator: {
    position: 'absolute', bottom: '-1px',
    width: '20px', height: '2px',
    background: 'var(--accent)',
    borderRadius: '2px 2px 0 0',
  },
};
