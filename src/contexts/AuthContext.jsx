import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)   // { uid, email, nickname }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch nickname from Firestore
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const nickname = snap.exists() ? snap.data().nickname : firebaseUser.displayName || ''
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, nickname })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Register new user
  async function register(email, password, nickname) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: nickname })
    await setDoc(doc(db, 'users', cred.user.uid), { nickname, email, createdAt: Date.now() })
    setUser({ uid: cred.user.uid, email, nickname })
    return cred.user
  }

  // Login existing user – also fetch nickname
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    const nickname = snap.exists() ? snap.data().nickname : ''
    setUser({ uid: cred.user.uid, email, nickname })
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  async function updateNickname(nickname) {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { nickname })
    await updateProfile(auth.currentUser, { displayName: nickname })
    setUser(u => ({ ...u, nickname }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateNickname }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
