/**
 * @module authService
 * @description Firebase Authentication helpers.
 * Wraps Firebase Auth SDK with consistent error handling and
 * standardised user profile shape.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from './firebase.js';
import { createUserProfile, getUserProfile } from './dbService.js';

// ---------------------------------------------------------------------------
// Auth state observer
// ---------------------------------------------------------------------------

/** Subscribe to auth state changes. Returns unsubscribe fn. */
export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new user with email and password.
 * Creates a Firestore profile document on success.
 */
export const registerUser = async ({ email, password, displayName, city = '' }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await createUserProfile(user.uid, {
    displayName,
    email: user.email,
    city,
    createdAt: new Date().toISOString(),
    totalFootprint: null,
    carbonGrade: null,
    streak: 0,
    points: 0,
    badges: [],
    activeActions: [],
    theme: 'system',
    avatarUrl: null,
    bio: '',
  });
  return user;
};

// ---------------------------------------------------------------------------
// Login / Logout
// ---------------------------------------------------------------------------

export const loginUser = async ({ email, password }) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

export const logoutUser = () => signOut(auth);

// ---------------------------------------------------------------------------
// Password management
// ---------------------------------------------------------------------------

export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email);

export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// ---------------------------------------------------------------------------
// Account management
// ---------------------------------------------------------------------------

export const deleteAccount = async (password) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUser(user);
};

export const getCurrentUser = () => auth.currentUser;

// ---------------------------------------------------------------------------
// User-friendly error messages
// ---------------------------------------------------------------------------

export const authErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use':   'That email is already registered. Please log in.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait a few minutes.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential':     'Incorrect email or password.',
  };
  return messages[code] || 'Something went wrong. Please try again.';
};
