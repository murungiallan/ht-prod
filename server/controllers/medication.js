import Medication from "../models/medication.js";

class MedicationController {
  // Add a new medication
  static async addMedication(req, res) {
    try {
      const userId = req.user.uid;
      const medicationData = { ...req.body, userId };
      const newMedication = await Medication.add(medicationData);
      res.status(201).json(newMedication);
    } catch (error) {
      res.status(500).json({ error: "Failed to add medication" });
    }
  }

  // Get all medications for the user
  static async getUserMedications(req, res) {
    try {
      const userId = req.user.uid;
      const medications = await Medication.getByUser(userId);
      res.status(200).json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get medications" });
    }
  }

  // Update a medication
  static async updateMedication(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const medicationData = req.body;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === id)) {
        return res.status(404).json({ error: "Medication not found" });
      }
      const updatedMedication = await Medication.update(id, medicationData);
      res.status(200).json(updatedMedication);
    } catch (error) {
      res.status(500).json({ error: "Failed to update medication" });
    }
  }

  // Delete a medication
  static async deleteMedication(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === id)) {
        return res.status(404).json({ error: "Medication not found" });
      }
      const deletedMedication = await Medication.delete(id);
      res.status(200).json(deletedMedication);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medication" });
    }
  }

  // Update medication taken status
  static async updateTakenStatus(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const { taken } = req.body;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === id)) {
        return res.status(404).json({ error: "Medication not found" });
      }
      const updatedMedication = await Medication.updateTakenStatus(id, taken);
      res.status(200).json(updatedMedication);
    } catch (error) {
      res.status(500).json({ error: "Failed to update medication status" });
    }
  }

  // Mark medication as missed
  static async markAsMissed(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === id)) {
        return res.status(404).json({ error: "Medication not found" });
      }
      const updatedMedication = await Medication.markAsMissed(id);
      res.status(200).json(updatedMedication);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark medication as missed" });
    }
  }
}

export default MedicationController;