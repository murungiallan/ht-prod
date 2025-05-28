import { useState, useCallback } from 'react';

export const useModalState = () => {
  const [modals, setModals] = useState({
    showAddModal: false,
    showDetailModal: false,
    showChecklistModal: false,
    showConfirmModal: false,
    showDeleteConfirmModal: false,
    showAllRemindersModal: false,
    showReminderModal: null,
    showAddReminderPrompt: null,
    editReminderModal: null,
    showTakeModal: null,
    showUndoModal: null,
    showDeleteModal: null,
    showTakePrompt: null,
    showHelpPopup: false,
  });

  const openModal = useCallback((modalName, data = true) => {
    setModals((prev) => ({ ...prev, [modalName]: data }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: modalName.includes('Modal') ? null : false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      showAddModal: false,
      showDetailModal: false,
      showChecklistModal: false,
      showConfirmModal: false,
      showDeleteConfirmModal: false,
      showAllRemindersModal: false,
      showReminderModal: null,
      showAddReminderPrompt: null,
      editReminderModal: null,
      showTakeModal: null,
      showUndoModal: null,
      showDeleteModal: null,
      showTakePrompt: null,
      showHelpPopup: false,
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
};