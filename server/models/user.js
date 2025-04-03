import { db } from "../services/firebase.js";
import { getAuth } from "firebase-admin/auth";

const COLLECTION_NAME = "users";

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || "";
    this.displayName = data.displayName || "";
    this.photoURL = data.photoURL || "";
    this.createdAt = data.createdAt || null;
    this.lastLogin = data.lastLogin || null;
    this.preferences = data.preferences || {};
  }

  // Register a new user to Firestore
  static async register(uid, email, displayName) {
    try {
      // Add user
      await db.collection(COLLECTION_NAME).doc(uid).set({
        email,
        displayName,
        photoURL: "",
        createdAt: new Date(),
        lastLogin: new Date(),
        preferences: {
          theme: "light",
          notifications: true,
        },
      });

      return {
        id: uid,
        email,
        displayName,
        photoURL: "",
      };
    } catch (error) {
      console.error("Error registering user: ", error);
      throw error;
    }
  }

  // Update last login (called after client-side sign-in)
  static async updateLastLogin(userId) {
    try {
      await db.collection(COLLECTION_NAME).doc(userId).update({
        lastLogin: new Date(),
      });

      const userDoc = await db.collection(COLLECTION_NAME).doc(userId).get();
      if (userDoc.exists) {
        return {
          id: userId,
          ...userDoc.data(),
        };
      } else {
        // Create user document if it doesn't exist yet
        const userRecord = await getAuth().getUser(userId);
        return User.register(
          userId, 
          userRecord.email, 
          userRecord.displayName || "User"
        );
      }
    } catch (error) {
      console.error("Error updating last login: ", error);
      throw error;
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await getAuth().generatePasswordResetLink(email);
      return true;
    } catch (error) {
      console.error("Error resetting password: ", error);
      throw error;
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const userDoc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (userDoc.exists) {
        return {
          id,
          ...userDoc.data(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user: ", error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(id, data) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        ...data,
        updatedAt: new Date(),
      });
      return { id, ...data };
    } catch (error) {
      console.error("Error updating profile: ", error);
      throw error;
    }
  }

  // Update user preferences
  static async updatePreferences(id, preferences) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        preferences,
        updatedAt: new Date(),
      });
      return { id, preferences };
    } catch (error) {
      console.error("Error updating preferences: ", error);
      throw error;
    }
  }
}

export default User; 