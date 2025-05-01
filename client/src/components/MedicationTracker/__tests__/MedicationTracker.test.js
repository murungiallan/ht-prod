import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import { SocketContext } from '../../../contexts/SocketContext';
import MedicationTracker from '../../MedicationTracker/MedicationTracker';
import * as api from '../../../services/api';

// Mock the API calls
jest.mock('../../../services/api', () => ({
  getUserMedications: jest.fn(),
  createMedication: jest.fn(),
  updateMedicationTakenStatus: jest.fn(),
  markMedicationAsMissed: jest.fn(),
  getUserReminders: jest.fn(),
  createReminder: jest.fn(),
  updateReminderStatus: jest.fn(),
  deleteReminder: jest.fn(),
  updateReminder: jest.fn(),
}));

// Mock Firebase auth
jest.mock('../../../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  },
}));

// Mock Socket.IO
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
};

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
};

const mockMedications = [
  {
    id: 1,
    medication_name: 'Test Medication',
    dosage: '100mg',
    frequency: 'daily',
    times_per_day: 1,
    times: ['08:00:00'],
    doses: {
      '2024-04-30': [
        {
          time: '08:00:00',
          taken: false,
          missed: false,
          takenAt: null,
        },
      ],
    },
    start_date: '2024-04-30',
    end_date: '2024-05-30',
    notes: 'Test notes',
  },
];

const mockReminders = [
  {
    id: 1,
    medicationId: 1,
    time: '08:00:00',
    isRecurring: true,
    status: 'pending',
  },
];

describe('MedicationTracker', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    api.getUserMedications.mockResolvedValue(mockMedications);
    api.getUserReminders.mockResolvedValue(mockReminders);
  });

  const renderMedicationTracker = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, logout: jest.fn() }}>
        <SocketContext.Provider value={{ socket: mockSocket }}>
          <MedicationTracker />
        </SocketContext.Provider>
      </AuthContext.Provider>
    );
  };

  test('renders loading state initially', () => {
    renderMedicationTracker();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('fetches medications and reminders on mount', async () => {
    renderMedicationTracker();
    
    await waitFor(() => {
      expect(api.getUserMedications).toHaveBeenCalledWith('mock-token');
      expect(api.getUserReminders).toHaveBeenCalledWith('mock-token');
    });
  });

  test('handles medication creation', async () => {
    const newMedication = {
      medication_name: 'New Medication',
      dosage: '50mg',
      frequency: 'daily',
      times_per_day: 1,
      times: ['09:00:00'],
      start_date: '2024-04-30',
      end_date: '2024-05-30',
    };

    api.createMedication.mockResolvedValue({ id: 2, ...newMedication });

    renderMedicationTracker();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open add medication modal
    fireEvent.click(screen.getByText('Add Medication'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Medication Name'), {
      target: { value: newMedication.medication_name },
    });
    fireEvent.change(screen.getByLabelText('Dosage'), {
      target: { value: newMedication.dosage },
    });

    // Submit form
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(api.createMedication).toHaveBeenCalledWith(
        expect.objectContaining(newMedication),
        'mock-token'
      );
    });
  });

  test('handles medication status update', async () => {
    api.updateMedicationTakenStatus.mockResolvedValue({ success: true });

    renderMedicationTracker();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Find and click the take medication button
    const takeButton = screen.getByTestId('take-medication-1-0');
    fireEvent.click(takeButton);

    await waitFor(() => {
      expect(api.updateMedicationTakenStatus).toHaveBeenCalledWith(
        1,
        0,
        true,
        'mock-token',
        expect.any(String)
      );
    });
  });

  test('handles error states', async () => {
    const error = new Error('API Error');
    api.getUserMedications.mockRejectedValue(error);

    renderMedicationTracker();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch medications')).toBeInTheDocument();
    });
  });

  test('handles session expiration', async () => {
    const error = new Error('Unauthorized - ID token expired');
    error.code = 'auth/id-token-expired';
    api.getUserMedications.mockRejectedValue(error);

    const mockLogout = jest.fn();
    const mockNavigate = jest.fn();

    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <SocketContext.Provider value={{ socket: mockSocket }}>
          <MedicationTracker />
        </SocketContext.Provider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
}); 