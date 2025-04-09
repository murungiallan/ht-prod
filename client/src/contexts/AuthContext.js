// AuthContext.js
import { createContext, useState, useEffect, useCallback } from "react";
import { auth, database } from "../firebase/config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { ref, update, onValue } from "firebase/database";
import { toast } from "react-toastify";
import localforage from "localforage";

// Local storage instance for caching tokens
const tokenStore = localforage.createInstance({
  name: "HealthTrack",
  storeName: "authTokens",
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cachedToken, setCachedToken] = useState(null);

  // Retry logic with exponential backoff for rate-limited requests
  const retryWithBackoff = useCallback(async (operation, maxAttempts = 99, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error.code === "auth/too-many-requests" || error.message.includes("Too Many Requests")) {
          if (attempt === maxAttempts) {
            throw error;
          }
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }, []);

  // Cache and retrieve Firebase ID token
  const getCachedToken = useCallback(
    async (forceRefresh = false) => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("User not authenticated");

      if (!forceRefresh && cachedToken) {
        return cachedToken;
      }

      const cached = await tokenStore.getItem(`token_${firebaseUser.uid}`);
      if (!forceRefresh && cached && cached.expiry > Date.now()) {
        setCachedToken(cached.token);
        return cached.token;
      }

      const token = await retryWithBackoff(() => firebaseUser.getIdToken(true));
      // const expiry = Date.now() + 55 * 60 * 1000;
      await tokenStore.setItem(`token_${firebaseUser.uid}`, { token/*, expiry */ });
      setCachedToken(token);
      return token;
    },
    [cachedToken, retryWithBackoff]
  );

  useEffect(() => {
    if (!user) return;

    const refreshInterval = 50 * 60 * 1000;
    const refreshToken = async () => {
      try {
        await getCachedToken(true);
        console.log("Token proactively refreshed");
      } catch (error) {
        console.error("Error proactively refreshing token:", error);
      }
    };

    const intervalId = setInterval(refreshToken, refreshInterval);
    return () => clearInterval(intervalId);
  }, [user, getCachedToken]);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        try {
          let userData = {
            id: uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName || "",
          };
  
          const fetchUserData = async (retry = true) => {
            try {
              const token = await getCachedToken();
              const response = await fetch("http://127.0.0.1:5000/api/users", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
  
              if (response.ok) {
                const mysqlUserData = await response.json();
                userData = { ...userData, ...mysqlUserData };
              } else if (response.status === 401 && retry) {
                await getCachedToken(true);
                return fetchUserData(false);
              } else {
                throw new Error("Failed to fetch user data from MySQL");
              }
            } catch (error) {
              console.error("Error fetching user from MySQL:", error);
            }
          };
  
          await fetchUserData();
  
          const userRef = ref(database, `users/${uid}`);
          onValue(
            userRef,
            async (snapshot) => {
              if (snapshot.exists()) {
                userData = { ...userData, ...snapshot.val() };
              } else {
                userData = {
                  ...userData,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || "",
                  lastLogin: new Date().toISOString(),
                };
              }
  
              // Update last login with retry logic
              const updateLastLogin = async (retry = true) => {
                try {
                  const token = await getCachedToken();
                  const response = await fetch("http://127.0.0.1:5000/api/users/last-login", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName || "",
                      lastLogin: userData.lastLogin,
                    }),
                  });
  
                  if (response.ok) {
                    const updatedUserData = await response.json();
                    userData = { ...userData, ...updatedUserData };
                  } else if (response.status === 401 && retry) {
                    await getCachedToken(true);
                    return updateLastLogin(false);
                  } else {
                    throw new Error("Failed to update last login in MySQL");
                  }
                } catch (error) {
                  console.error("Error syncing with MySQL:", error);
                }
              };
  
              await updateLastLogin();
              setUser({ ...userData, emailVerified: firebaseUser.emailVerified });
            },
            { onlyOnce: true }
          );
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            id: uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName || "",
          });
        }
      } else {
        setUser(null);
        setCachedToken(null);
        await tokenStore.clear();
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [getCachedToken, retryWithBackoff]);

  const login = async (email, password) => {
    try {
      await retryWithBackoff(() => signInWithEmailAndPassword(auth, email, password));
    } catch (error) {
      toast.error("Login failed: " + error.message);
      throw error;
    }
  };

  const register = async (username, email, password, displayName, role = "user") => {
    try {
      const userCredential = await retryWithBackoff(() =>
        createUserWithEmailAndPassword(auth, email, password)
      );
      const firebaseUser = userCredential.user;

      await retryWithBackoff(() => updateFirebaseProfile(firebaseUser, { displayName }));

      const userData = {
        username,
        email: firebaseUser.email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      await retryWithBackoff(() =>
        update(ref(database, `users/${firebaseUser.uid}`), userData)
      );

      const token = await getCachedToken();
      const response = await fetch("http://127.0.0.1:5000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          username,
          email: firebaseUser.email,
          displayName,
          password,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register user in MySQL");
      }

      const registeredUserData = await response.json();
      setUser({
        ...userData,
        ...registeredUserData,
        emailVerified: firebaseUser.emailVerified,
      });

      if (firebaseUser.email && !firebaseUser.emailVerified) {
        await retryWithBackoff(() => sendEmailVerification(firebaseUser));
        toast.info("A verification email has been sent to your email address.");
      }
    } catch (error) {
      toast.error("Registration failed: " + error.message);
      throw error;
    }
  };

  const updateProfile = async (username, email, displayName, role) => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("User not authenticated");

      await retryWithBackoff(() => updateFirebaseProfile(firebaseUser, { displayName }));

      const userData = {
        username,
        email,
        displayName,
        role,
        lastLogin: new Date().toISOString(),
      };
      await retryWithBackoff(() =>
        update(ref(database, `users/${firebaseUser.uid}`), userData)
      );

      const token = await getCachedToken();
      const response = await fetch("http://127.0.0.1:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, displayName, role }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile in MySQL");
      }

      const updatedUserData = await response.json();
      setUser({
        ...user,
        ...updatedUserData,
        emailVerified: firebaseUser.emailVerified,
      });
    } catch (error) {
      toast.error("Profile update failed: " + error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      const result = await response.json();
      toast.info(result.message);
    } catch (error) {
      toast.error("Password reset failed: " + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await retryWithBackoff(() => signOut(auth));
      setUser(null);
      setCachedToken(null);
      await tokenStore.clear();
    } catch (error) {
      toast.error("Logout failed: " + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateProfile,
        resetPassword,
        logout,
        loading,
        isEmailVerified: user?.emailVerified || false,
        getCachedToken,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};