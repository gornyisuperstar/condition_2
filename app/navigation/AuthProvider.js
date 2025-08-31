import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// провайдер авторизации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        let snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            role: "user", // дефолтная роль
            createdAt: serverTimestamp(),
          });
          snap = await getDoc(userRef); // перечитываем
        }

        setUser(firebaseUser);
        setRole(snap.data()?.role || null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
