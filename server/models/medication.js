import db from "../config/db.js";

class Medication {
  static safeParseJSON(jsonString, defaultValue = []) {
    if (!jsonString || jsonString === "") {
      return defaultValue;
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error parsing JSON: ${jsonString}`, error.message);
      return defaultValue;
    }
  }

  static async add(medicationData) {
    const { userId, medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = medicationData;
    const query = `
      INSERT INTO medications (user_id, medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      userId,
      medication_name,
      dosage,
      frequency,
      times_per_day,
      JSON.stringify(times || []),
      JSON.stringify(doses || []),
      start_date,
      end_date,
      notes || null,
    ];
    try {
      const [result] = await db.query(query, values);
      return { id: result.insertId, ...medicationData };
    } catch (error) {
      console.error("Database error in Medication.add:", error.message, error.sqlMessage);
      throw new Error(`Failed to add medication to database: ${error.message}`);
    }
  }

  static async getByUser(userId) {
    const query = `
      SELECT * FROM medications
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows.map((row) => ({
      ...row,
      times: this.safeParseJSON(row.times, []),
      doses: this.safeParseJSON(row.doses, []),
    }));
  }

  static async update(id, updatedData) {
    const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = updatedData;
    const query = `
      UPDATE medications
      SET medication_name = ?, dosage = ?, frequency = ?, times_per_day = ?, times = ?, doses = ?, start_date = ?, end_date = ?, notes = ?
      WHERE id = ?
    `;
    const values = [
      medication_name,
      dosage,
      frequency,
      times_per_day,
      JSON.stringify(times || []),
      JSON.stringify(doses || []),
      start_date,
      end_date,
      notes || null,
      id,
    ];
    await db.query(query, values);
    return { id: parseInt(id), ...updatedData };
  }

  static async delete(id) {
    const query = `
      DELETE FROM medications
      WHERE id = ?
    `;
    await db.query(query, [id]);
    return true;
  }

  static async updateTakenStatus(id, doseIndex, taken) {
    const [rows] = await db.query("SELECT doses FROM medications WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new Error("Medication not found");
    }
    const doses = this.safeParseJSON(rows[0].doses, []);
    doses[doseIndex] = {
      ...doses[doseIndex],
      taken,
      missed: taken ? doses[doseIndex].missed : false,
    };
    const query = `
      UPDATE medications
      SET doses = ?
      WHERE id = ?
    `;
    await db.query(query, [JSON.stringify(doses), id]);
    return { id: parseInt(id), doses };
  }

  static async markAsMissed(id, doseIndex, missed) {
    const [rows] = await db.query("SELECT doses FROM medications WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new Error("Medication not found");
    }
    const doses = this.safeParseJSON(rows[0].doses, []);
    doses[doseIndex] = {
      ...doses[doseIndex],
      missed,
      taken: missed ? doses[doseIndex].taken : false,
    };
    const query = `
      UPDATE medications
      SET doses = ?
      WHERE id = ?
    `;
    await db.query(query, [JSON.stringify(doses), id]);
    return { id: parseInt(id), doses };
  }
}

export default Medication;