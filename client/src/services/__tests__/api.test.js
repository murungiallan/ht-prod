import * as api from '../api';
import axios from 'axios';
import { auth, database } from '../../firebase/config';

// Mock axios
jest.mock('axios');
jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  },
  database: {
    ref: jest.fn(),
    update: jest.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Medication API', () => {
    const mockMedication = {
      medication_name: 'Test Medication',
      dosage: '100mg',
      frequency: 'daily',
      times_per_day: 1,
      times: ['08:00:00'],
      start_date: '2024-04-30',
      end_date: '2024-05-30',
    };

    test('createMedication makes correct API call', async () => {
      const mockResponse = { data: { id: 1, ...mockMedication } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await api.createMedication(mockMedication, 'mock-token');

      expect(axios.post).toHaveBeenCalledWith(
        'https://127.0.0.1:5000/api/medications/add',
        mockMedication,
        {
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('getUserMedications handles success', async () => {
      const mockResponse = { data: [mockMedication] };
      axios.get.mockResolvedValue(mockResponse);

      const result = await api.getUserMedications('mock-token');

      expect(axios.get).toHaveBeenCalledWith(
        'https://127.0.0.1:5000/api/medications/get-medications',
        {
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('updateMedicationTakenStatus handles success', async () => {
      const mockResponse = { data: { success: true } };
      axios.put.mockResolvedValue(mockResponse);

      const result = await api.updateMedicationTakenStatus(1, 0, true, 'mock-token', '2024-04-30');

      expect(axios.put).toHaveBeenCalledWith(
        'https://127.0.0.1:5000/api/medications/1/taken',
        {
          doseIndex: 0,
          taken: true,
          date: '2024-04-30',
        },
        {
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('handles API errors', async () => {
      const error = new Error('API Error');
      axios.get.mockRejectedValue(error);

      await expect(api.getUserMedications('mock-token')).rejects.toThrow('API Error');
    });

    test('handles authentication errors', async () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      axios.get.mockRejectedValue(error);

      await expect(api.getUserMedications('mock-token')).rejects.toThrow('Unauthorized');
    });
  });

  describe('Reminder API', () => {
    const mockReminder = {
      medicationId: 1,
      time: '08:00:00',
      isRecurring: true,
    };

    test('createReminder makes correct API call', async () => {
      const mockResponse = { data: { id: 1, ...mockReminder } };
      axios.post.mockResolvedValue(mockResponse);

      const result = await api.createReminder(mockReminder, 'mock-token');

      expect(axios.post).toHaveBeenCalledWith(
        'https://127.0.0.1:5000/api/reminders/add',
        mockReminder,
        {
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('updateReminderStatus handles success', async () => {
      const mockResponse = { data: { success: true } };
      axios.put.mockResolvedValue(mockResponse);

      const result = await api.updateReminderStatus(1, 'completed', 'mock-token');

      expect(axios.put).toHaveBeenCalledWith(
        'https://127.0.0.1:5000/api/reminders/1/status',
        { status: 'completed' },
        {
          headers: { Authorization: 'Bearer mock-token' },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
}); 