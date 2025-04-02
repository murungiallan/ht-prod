import { db } from "../services/firebase.js";

const COLLECTION_NAME = "medications";

class Medication {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.name = data.name || "";
    this.frequency = data.frequency || "";
    this.dosage = data.dosage || "";
    this.tabletCount = data.tabletCount || 1;
    this.mealTiming = data.mealTiming || "After";
    this.nextDose = data.nextDose || "";
    this.missedDose = data.missedDose || "None";
    this.taken = data.taken || 0;
    this.category = data.category || "";
    this.refillDate = data.refillDate || null;
    this.isRecurring = data.isRecurring || false;
    this.enableNotifications = data.enableNotifications || true;
    this.notes = data.notes || "";
    this.createdAt = data.createdAt || new Date();
  }

  // Add a new medication
  static async add(medicationData) {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...medicationData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...medicationData };
    } catch (error) {
      console.error("Error adding medication: ", error);
      throw error;
    }
  }

  // Get all medications for a user
  static async getByUser(userId) {
    try {
      const medicationsQuery = db
        .collection(COLLECTION_NAME)
        .where("userId", "==", userId);

      const querySnapshot = await medicationsQuery.get();
      const medications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        medications.push({ id: doc.id, ...data });
      });

      return medications;
    } catch (error) {
      console.error("Error getting medications: ", error);
      throw error;
    }
  }

  // Update a medication
  static async update(id, data) {
    try {
      const medicationRef = db.collection(COLLECTION_NAME).doc(id);
      await medicationRef.update({
        ...data,
        updatedAt: new Date(),
      });
      return { id, ...data };
    } catch (error) {
      console.error("Error updating medication: ", error);
      throw error;
    }
  }

  // Delete a medication
  static async delete(id) {
    try {
      const medicationRef = db.collection(COLLECTION_NAME).doc(id);
      await medicationRef.delete();
      return { id };
    } catch (error) {
      console.error("Error deleting medication: ", error);
      throw error;
    }
  }

  // Update medication taken status
  static async updateTakenStatus(id, taken) {
    try {
      const medicationRef = db.collection(COLLECTION_NAME).doc(id);
      await medicationRef.update({
        taken,
        updatedAt: new Date(),
      });
      return { id, taken };
    } catch (error) {
      console.error("Error updating medication status: ", error);
      throw error;
    }
  }

  // Mark medication as missed
  static async markAsMissed(id) {
    try {
      const medicationRef = db.collection(COLLECTION_NAME).doc(id);
      await medicationRef.update({
        missedDose: "Missed",
        updatedAt: new Date(),
      });
      return { id, missedDose: "Missed" };
    } catch (error) {
      console.error("Error marking medication as missed: ", error);
      throw error;
    }
  }
}

export default Medication;