import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [orgCode, setOrgCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setRole(null);
          setOrgCode(null);
          return;
        }

        const ref = doc(db, "users", firebaseUser.uid);
        let snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            email: firebaseUser.email ?? "",
            role: "user",
            orgCode: null,
            createdAt: serverTimestamp(),
          });
          snap = await getDoc(ref);
        }

        const data = snap.data() || {};
        setUser(firebaseUser);
        setRole(data.role ?? "user");
        setOrgCode(data.orgCode ?? null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, orgCode, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
