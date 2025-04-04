import { createContext, useState, useEffect } from "react";
import { auth } from "../firebase/config.js";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification 
} from "firebase/auth";
import { updateLastLogin, getUser, registerUser } from "../services/api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const token = await firebaseUser.getIdToken();
          
          // Update last login on the server with the token
          const userData = await updateLastLogin(token);
          setUser({
            ...userData,
            emailVerified: firebaseUser.emailVerified
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Still set basic Firebase user info even if server call fails
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      // First, create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      
      // Then register user details on your server
      const userData = await registerUser(token, email, displayName);
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      setUser({
        ...userData,
        emailVerified: firebaseUser.emailVerified
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading,
      isEmailVerified: user?.emailVerified || false
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};