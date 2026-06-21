/**
 * @module dbService
 * @description Firestore database service for CarbonZero.
 * All data operations go through this module.
 * Security is enforced at the Firestore rules level.
 */
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, query, orderBy, limit, getDocs,
  serverTimestamp, arrayUnion, increment,
} from 'firebase/firestore';
import { db } from './firebase.js';

// ---------------------------------------------------------------------------
// User Profiles
// ---------------------------------------------------------------------------

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, updates) => {
  await updateDoc(doc(db, 'users', uid), { ...updates, updatedAt: serverTimestamp() });
};

// ---------------------------------------------------------------------------
// Carbon Footprint
// ---------------------------------------------------------------------------

export const saveFootprintToDb = async (uid, footprintData) => {
  // Save latest to user profile doc (denormalized for fast reads)
  await updateDoc(doc(db, 'users', uid), {
    totalFootprint: footprintData.totalMonthly,
    carbonGrade:    footprintData.grade,
    lastCalculated: serverTimestamp(),
    updatedAt:      serverTimestamp(),
  });
  // Also append to subcollection history
  await addDoc(collection(db, 'users', uid, 'footprintHistory'), {
    ...footprintData,
    recordedAt: serverTimestamp(),
  });
};

export const getFootprintHistory = async (uid) => {
  const q = query(
    collection(db, 'users', uid, 'footprintHistory'),
    orderBy('recordedAt', 'desc'),
    limit(12)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ---------------------------------------------------------------------------
// User Actions (plan tracking)
// ---------------------------------------------------------------------------

export const saveUserActionsToDb = async (uid, actionIds) => {
  await updateDoc(doc(db, 'users', uid), {
    activeActions: actionIds,
    updatedAt: serverTimestamp(),
  });
};

// ---------------------------------------------------------------------------
// Points and Badges
// ---------------------------------------------------------------------------

export const addPointsToDb = async (uid, points) => {
  await updateDoc(doc(db, 'users', uid), {
    points: increment(points),
    updatedAt: serverTimestamp(),
  });
};

export const awardBadgeToDb = async (uid, badgeId) => {
  await updateDoc(doc(db, 'users', uid), {
    badges: arrayUnion(badgeId),
    updatedAt: serverTimestamp(),
  });
};

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

export const updateStreakInDb = async (uid, streak) => {
  await updateDoc(doc(db, 'users', uid), {
    streak,
    lastStreakDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// ---------------------------------------------------------------------------
// Leaderboard (public profiles)
// ---------------------------------------------------------------------------

export const getLeaderboard = async (limitCount = 20) => {
  const q = query(
    collection(db, 'users'),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const { displayName, city, points, totalFootprint, carbonGrade, badges } = d.data();
    return { id: d.id, displayName, city, points, totalFootprint, carbonGrade, badges };
  });
};
