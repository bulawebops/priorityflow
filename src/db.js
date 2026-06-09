import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  getDocs, setDoc, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

// Collections
const tasksCol = (uid) => collection(db, 'users', uid, 'tasks');
const historyCol = (uid) => collection(db, 'users', uid, 'history');
const analyticsDoc = (uid) => doc(db, 'users', uid, 'meta', 'analytics');

// ── Tasks ──────────────────────────────────────────────

export function subscribeTasks(uid, callback) {
  const q = query(tasksCol(uid), orderBy('manualOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(tasks);
  });
}

export async function addTask(uid, task) {
  const existing = await getDocs(tasksCol(uid));
  const maxOrder = existing.docs.reduce((max, d) => Math.max(max, d.data().manualOrder ?? 0), 0);
  return addDoc(tasksCol(uid), {
    ...task,
    manualOrder: maxOrder + 1,
    completed: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(uid, taskId, updates) {
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(uid, taskId) {
  return deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}

export async function completeTask(uid, task) {
  const completedAt = new Date();
  await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
    completed: true,
    completedAt: Timestamp.fromDate(completedAt),
    updatedAt: serverTimestamp(),
  });
  // Archive to history
  await addDoc(historyCol(uid), {
    ...task,
    completedAt: Timestamp.fromDate(completedAt),
    dateKey: format(completedAt, 'yyyy-MM-dd'),
  });
}

export async function uncompleteTask(uid, taskId) {
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    completed: false,
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function reorderTasks(uid, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    updateDoc(doc(db, 'users', uid, 'tasks', id), { manualOrder: index })
  );
  return Promise.all(updates);
}

// ── History ────────────────────────────────────────────

export function subscribeHistory(uid, callback) {
  const q = query(historyCol(uid), orderBy('completedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(history);
  });
}
