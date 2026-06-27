import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Sync to Firestore
        const userRef = doc(db, 'users', fUser.uid);
        const userDoc = await getDoc(userRef);
        const userData: User = {
          userId: fUser.uid,
          displayName: fUser.displayName || 'Anonymous',
          photoURL: fUser.photoURL || '',
        };

        if (!userDoc.exists()) {
          await setDoc(userRef, userData);
        } else {
          // Could optionally update photo and display name
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Error de dominio no autorizado. Por favor, añade este dominio en la consola de Firebase -> Authentication -> Settings -> Authorized domains.");
      } else {
        alert("Ocurrió un error al iniciar sesión: " + error.message);
      }
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const isAdmin = firebaseUser?.email === 'josea.t.pm00@gmail.com';

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAdmin, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
