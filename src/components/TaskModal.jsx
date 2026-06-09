import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { addTask, updateTask } from '../db';

const CATEGORIES = ['work', 'business', 'church', 'personal'];
const URGENCIES  = ['critical', 'high', 'medium', 'low'];

const URGENCY_INFO = {
  critical: { label: 'Critical', color: '#ff4757', emoji: '🔴' },
  high:     { label: 'High',     color: '#ff8c42', emoji: '🟠' },
  medium:   { label: 'Medium',   color: '#f59e0b', emoji: '🟡' },
  low:      { label: 'Low',      color: '#6ee7b7', emoji: '🟢' },
};

const DEFAULT_FORM = {
  title: '', category: 'work', urgency: 'medium',
  dueDate: '', estimatedMinutes: '', notes: '',
};

export default function TaskModal() {
  const { user, editingTask, setShowAddTask, setEditingTask } = useStore();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingTask;

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        category: editingTask.category || 'work',
        urgency: editingTask.urgency || 'medium',
        dueDate: editingTask.dueDate || '',
        estimatedMinutes: editingTask.estimatedMinutes || '',
        notes: editingTask.notes || '',
      });
    }
  }, [editingTask]);

  const close = () => {
    setShowAddTask(false);
    setEditingTask(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
      };
      if (isEditing) {
        await updateTask(user.uid, editingTask.id, data);
        toast.success('Task updated');
      } else {
        await addTask(user.uid, data);
        toast.success('Task added');
      }
      close();
    } catch (err) {
      toast.error('Failed to save task');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && close()}>
      <div style={styles.modal} className="animate-slideUp">
        {/* Handle */}
        <div style={styles.handle} />

        <h2 style={styles.title}>{isEditing ? 'Edit Task' : 'New Task'}</h2>

        {/* Title */}
        <div style={styles.field}>
          <label style={styles.label}>Task Title *</label>
          <input
            autoFocus
            value={form.title}
            onChange={set('title')}
            placeholder="What needs to be done?"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Category */}
        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <div style={styles.chips}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  ...styles.chip,
                  ...(form.category === cat ? styles.chipSelected(cat) : {}),
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div style={styles.field}>
          <label style={styles.label}>Urgency</label>
          <div style={styles.chips}>
            {URGENCIES.map(urg => (
              <button
                key={urg}
                onClick={() => setForm(f => ({ ...f, urgency: urg }))}
                style={{
                  ...styles.chip,
                  ...(form.urgency === urg ? { background: URGENCY_INFO[urg].color + '22', color: URGENCY_INFO[urg].color, borderColor: URGENCY_INFO[urg].color } : {}),
                }}
              >
                {URGENCY_INFO[urg].emoji} {URGENCY_INFO[urg].label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date + Duration row */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Duration (mins)</label>
            <input
              type="number"
              value={form.estimatedMinutes}
              onChange={set('estimatedMinutes')}
              placeholder="e.g. 30"
              min="1" max="480"
              style={styles.input}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={styles.field}>
          <label style={styles.label}>Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Any additional context..."
            rows={3}
            style={{ ...styles.input, resize: 'vertical', minHeight: '72px' }}
          />
        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button onClick={close} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? <span className="animate-spin">⟳</span> : (isEditing ? '✓ Save Changes' : '+ Add Task')}
          </button>
        </div>
      </div>
    </div>
  );
}

const CAT_COLORS = {
  work: { bg: 'rgba(61,124,255,0.15)', color: '#6b9dff', border: '#3d7cff' },
  business: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '#f59e0b' },
  church: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '#a78bfa' },
  personal: { bg: 'rgba(0,229,196,0.15)', color: '#00e5c4', border: '#00e5c4' },
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  modal: {
    width: '100%', maxWidth: '500px',
    background: 'var(--bg-2)',
    borderRadius: '24px 24px 0 0',
    border: '1px solid var(--border)',
    borderBottom: 'none',
    padding: '12px 20px 32px',
    maxHeight: '90dvh',
    overflowY: 'auto',
    paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
  },
  handle: {
    width: '40px', height: '4px', borderRadius: '2px',
    background: 'var(--border)',
    margin: '0 auto 20px',
  },
  title: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem',
    marginBottom: '20px', letterSpacing: '-0.02em',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-3)', letterSpacing: '0.05em',
    textTransform: 'uppercase', marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-3)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)',
    fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.15s',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: {
    padding: '5px 12px', borderRadius: '99px',
    fontSize: '0.78rem', fontWeight: 600,
    background: 'var(--bg-3)', color: 'var(--text-2)',
    border: '1px solid var(--border)', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipSelected: (cat) => ({
    background: CAT_COLORS[cat]?.bg || 'var(--accent-glow)',
    color: CAT_COLORS[cat]?.color || 'var(--accent)',
    borderColor: CAT_COLORS[cat]?.border || 'var(--accent)',
  }),
  row: { display: 'flex', gap: '12px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '8px' },
  cancelBtn: {
    flex: 1, padding: '13px',
    background: 'var(--bg-3)', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
  },
  saveBtn: {
    flex: 2, padding: '13px',
    background: 'var(--accent)', color: 'white',
    border: 'none', borderRadius: 'var(--r-md)',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
    boxShadow: '0 4px 16px var(--accent-glow)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  },
};
