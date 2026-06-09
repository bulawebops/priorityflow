import React, { useState, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { auth } from '../firebase';
import { useStore } from '../store';
import { completeTask, uncompleteTask, deleteTask, reorderTasks } from '../db';
import { rulesPrioritize, aiPrioritize } from '../prioritize';

const CATEGORIES = ['all', 'work', 'business', 'church', 'personal'];

export default function TodayView() {
  const { user, tasks, setTasks, setShowAddTask, setEditingTask, filterCategory, setFilterCategory } = useStore();
  const [showCompleted, setShowCompleted] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const activeTasks = useMemo(() =>
    tasks.filter(t => !t.completed && (filterCategory === 'all' || t.category === filterCategory)),
    [tasks, filterCategory]
  );

  const completedTasks = useMemo(() =>
    tasks.filter(t => t.completed && (filterCategory === 'all' || t.category === filterCategory)),
    [tasks, filterCategory]
  );

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex = activeTasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    // Merge with completed tasks
    const newTasks = [...reordered, ...completedTasks];
    setTasks(newTasks);
    await reorderTasks(user.uid, reordered.map(t => t.id));
    toast.success('Order saved');
  };

  const handleAutoSort = async () => {
    const sorted = rulesPrioritize(tasks);
    const newTasks = [...sorted, ...completedTasks];
    setTasks(newTasks);
    await reorderTasks(user.uid, sorted.map(t => t.id));
    toast.success('Tasks prioritized by rules');
  };

  const handleAiSort = async () => {
    setAiLoading(true);
    try {
      const sorted = await aiPrioritize(activeTasks);
      const newTasks = [...sorted, ...completedTasks];
      setTasks(newTasks);
      await reorderTasks(user.uid, sorted.map(t => t.id));
      toast.success('AI prioritization applied');
    } catch (err) {
      toast.error('AI prioritization failed');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      await completeTask(user.uid, task);
      toast.success('Task completed! 🎉');
    } catch (err) {
      toast.error('Failed to complete task');
    }
  };

  const handleUncomplete = async (taskId) => {
    await uncompleteTask(user.uid, taskId);
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(user.uid, taskId);
    toast.success('Task deleted');
  };

  const today = format(new Date(), 'EEEE, MMM d');
  const progress = tasks.length ? Math.round((completedTasks.length / tasks.filter(t => filterCategory === 'all' || t.category === filterCategory).length) * 100) : 0;

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.dateLabel}>{today}</p>
            <h1 style={styles.heading}>Today's Flow</h1>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => signOut(auth)} style={styles.avatarBtn} title="Sign out">
              {user?.photoURL
                ? <img src={user.photoURL} alt="" style={styles.avatar} referrerPolicy="no-referrer" />
                : <span style={styles.avatarFallback}>{user?.displayName?.[0] ?? '?'}</span>
              }
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <span style={styles.progressLabel}>{progress}% done · {completedTasks.length}/{activeTasks.length + completedTasks.length} tasks</span>
          </div>
        )}

        {/* Category filter */}
        <div style={styles.filterRow}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                ...styles.filterChip,
                ...(filterCategory === cat ? styles.filterChipActive : {}),
              }}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Action row */}
        <div style={styles.actionRow}>
          <button onClick={handleAutoSort} style={styles.actionBtn} title="Auto-prioritize">
            ⚡ Auto
          </button>
          <button
            onClick={handleAiSort}
            disabled={aiLoading}
            style={{ ...styles.actionBtn, ...styles.aiBtn }}
          >
            {aiLoading
              ? <><span className="animate-spin">⟳</span> AI…</>
              : '🤖 AI Sort'}
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            style={{ ...styles.actionBtn, ...styles.addBtn }}
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* Task list */}
      <div style={styles.listWrap}>
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <EmptyState onAdd={() => setShowAddTask(true)} />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="stagger">
              {activeTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleComplete(task)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  isDragging={activeId === task.id}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && (
              <TaskCard
                task={activeTasks.find(t => t.id === activeId)}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>

        {/* Completed section */}
        {completedTasks.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={() => setShowCompleted(v => !v)}
              style={styles.completedToggle}
            >
              <span>✓ Completed ({completedTasks.length})</span>
              <span>{showCompleted ? '▲' : '▼'}</span>
            </button>
            {showCompleted && (
              <div className="stagger" style={{ marginTop: '8px' }}>
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUncomplete={() => handleUncomplete(task.id)}
                    onDelete={() => handleDelete(task.id)}
                    completed
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onComplete, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isSorting } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        onComplete={onComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

function TaskCard({ task, onComplete, onEdit, onDelete, onUncomplete, dragHandleProps, completed, isOverlay }) {
  const [showMenu, setShowMenu] = useState(false);
  if (!task) return null;

  const urgencyColors = {
    critical: '#ff4757', high: '#ff8c42', medium: '#f59e0b', low: '#6ee7b7'
  };
  const catColor = {
    work: '#3d7cff', business: '#f59e0b', church: '#a78bfa', personal: '#00e5c4'
  }[task.category] || '#3d7cff';

  return (
    <div
      style={{
        ...styles.card,
        ...(completed ? styles.cardCompleted : {}),
        ...(isOverlay ? styles.cardOverlay : {}),
        borderLeft: `3px solid ${urgencyColors[task.urgency] || '#3d7cff'}`,
      }}
    >
      {/* Drag handle */}
      {!completed && dragHandleProps && (
        <div {...dragHandleProps} style={styles.dragHandle}>⋮⋮</div>
      )}

      {/* Checkbox */}
      <button
        onClick={completed ? onUncomplete : onComplete}
        style={{
          ...styles.checkbox,
          ...(completed ? styles.checkboxDone : {}),
        }}
      >
        {completed && '✓'}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.cardTitle}
          className={completed ? '' : ''}
          data-done={completed}
        >
          <span style={{ textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.5 : 1 }}>
            {task.title}
          </span>
        </div>

        <div style={styles.cardMeta}>
          <span className={`cat-pill cat-${task.category}`}>{task.category}</span>
          <div className={`urg-dot urg-${task.urgency}`} />
          <span style={styles.metaText}>{task.urgency}</span>
          {task.estimatedMinutes && (
            <span style={styles.metaText}>⏱ {task.estimatedMinutes}m</span>
          )}
          {task.dueDate && (
            <span style={{ ...styles.metaText, color: 'var(--urg-medium)' }}>
              📅 {task.dueDate}
            </span>
          )}
        </div>

        {task.aiReason && (
          <p style={styles.aiReason}>🤖 {task.aiReason}</p>
        )}

        {task.notes && (
          <p style={styles.notes}>{task.notes}</p>
        )}
      </div>

      {/* Actions */}
      {!completed && (
        <div style={styles.cardActions}>
          <button onClick={onEdit} style={styles.iconBtn} title="Edit">✏️</button>
          <button onClick={onDelete} style={styles.iconBtn} title="Delete">🗑</button>
        </div>
      )}
      {completed && onDelete && (
        <button onClick={onDelete} style={styles.iconBtn} title="Delete">🗑</button>
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={styles.empty} className="animate-fadeIn">
      <div style={styles.emptyIcon}>⚡</div>
      <h3 style={styles.emptyTitle}>Ready to flow?</h3>
      <p style={styles.emptyText}>Add your first task and let PriorityFlow help you tackle your day.</p>
      <button onClick={onAdd} style={styles.emptyBtn}>+ Add Your First Task</button>
    </div>
  );
}

const styles = {
  root: { minHeight: '100%', background: 'var(--bg)' },
  header: {
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border)',
    padding: '16px 16px 0',
    position: 'sticky', top: 0, zIndex: 50,
    paddingTop: 'calc(16px + var(--safe-top))',
  },
  headerTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '12px',
  },
  dateLabel: { fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '2px', fontWeight: 500 },
  heading: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
    letterSpacing: '-0.03em', color: 'var(--text)',
  },
  headerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  avatarBtn: {
    width: '38px', height: '38px', borderRadius: '50%',
    overflow: 'hidden', border: '2px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: 'var(--bg-3)',
    transition: 'border-color 0.2s',
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: { fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' },

  progressWrap: {
    position: 'relative', height: '4px',
    background: 'var(--bg-4)', borderRadius: '2px',
    marginBottom: '4px', overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute', left: 0, top: 0, height: '100%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
    borderRadius: '2px', transition: 'width 0.4s ease',
  },
  progressLabel: {
    display: 'block', fontSize: '0.7rem', color: 'var(--text-3)',
    marginBottom: '10px', marginTop: '4px',
  },

  filterRow: {
    display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px',
    scrollbarWidth: 'none',
  },
  filterChip: {
    flexShrink: 0, padding: '4px 12px', borderRadius: '99px',
    fontSize: '0.75rem', fontWeight: 600,
    background: 'var(--bg-3)', color: 'var(--text-2)',
    border: '1px solid var(--border)', cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  filterChipActive: {
    background: 'var(--accent-glow)', color: 'var(--accent-light)',
    borderColor: 'var(--accent)',
  },

  actionRow: {
    display: 'flex', gap: '8px', paddingBottom: '14px',
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  actionBtn: {
    flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--r-sm)',
    fontSize: '0.8rem', fontWeight: 600,
    background: 'var(--bg-3)', color: 'var(--text-2)',
    border: '1px solid var(--border)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '5px',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  aiBtn: { color: 'var(--accent-2)', borderColor: 'var(--accent-2-glow)' },
  addBtn: {
    marginLeft: 'auto',
    background: 'var(--accent)', color: 'white',
    border: 'none', boxShadow: '0 2px 12px var(--accent-glow)',
  },

  listWrap: { padding: '12px 16px 24px' },

  card: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    padding: '12px 12px 12px 10px',
    marginBottom: '8px',
    transition: 'all 0.2s',
    position: 'relative',
    cursor: 'default',
  },
  cardCompleted: {
    opacity: 0.6, borderLeft: '3px solid var(--text-3) !important',
  },
  cardOverlay: {
    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
    transform: 'scale(1.02)',
    zIndex: 9999,
  },
  dragHandle: {
    color: 'var(--text-3)', fontSize: '0.9rem', cursor: 'grab',
    padding: '2px 2px', lineHeight: 1, letterSpacing: '-2px',
    flexShrink: 0, alignSelf: 'center', userSelect: 'none',
  },
  checkbox: {
    width: '22px', height: '22px', borderRadius: '6px',
    border: '2px solid var(--border)',
    background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: '0.75rem', color: 'white',
    transition: 'all 0.15s',
  },
  checkboxDone: {
    background: 'var(--accent-2)', borderColor: 'var(--accent-2)',
  },
  cardTitle: {
    fontWeight: 500, fontSize: '0.9rem', color: 'var(--text)',
    marginBottom: '6px', lineHeight: 1.4,
  },
  cardMeta: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
  },
  metaText: { fontSize: '0.72rem', color: 'var(--text-3)' },
  aiReason: {
    marginTop: '6px', fontSize: '0.75rem', color: 'var(--accent-2)',
    fontStyle: 'italic', lineHeight: 1.4,
    padding: '4px 8px', background: 'var(--accent-2-glow)',
    borderRadius: 'var(--r-sm)',
  },
  notes: {
    marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-2)',
    lineHeight: 1.4, overflow: 'hidden',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },
  cardActions: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 },
  iconBtn: {
    padding: '4px 6px', fontSize: '0.875rem', cursor: 'pointer',
    border: 'none', background: 'none', opacity: 0.5,
    transition: 'opacity 0.15s',
  },

  completedToggle: {
    width: '100%', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '10px 12px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', cursor: 'pointer',
    fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600,
  },

  empty: {
    textAlign: 'center', padding: '48px 24px',
  },
  emptyIcon: {
    fontSize: '3rem', marginBottom: '16px',
    filter: 'drop-shadow(0 0 20px rgba(61,124,255,0.5))',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '1.3rem', marginBottom: '8px',
  },
  emptyText: { color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: '24px' },
  emptyBtn: {
    padding: '12px 24px',
    background: 'var(--accent)', color: 'white',
    border: 'none', borderRadius: 'var(--r-md)',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
    boxShadow: '0 4px 20px var(--accent-glow)',
  },
};
