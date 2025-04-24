import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, SecondaryButton, ModalOverlay, ModalContent } from "../styles";

const DeleteConfirmModal = ({ isOpen, onRequestClose, onConfirm, actionLoading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Confirm Delete"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#ef4444">
        <CloseButton onClick={onRequestClose} accentColor="#ef4444" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#333333",
            marginBottom: "16px",
          }}
        >
          Confirm Delete
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
          }}
        >
          Are you sure you want to delete this medication? This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <SecondaryButton onClick={onRequestClose} aria-label="Cancel delete">
            Cancel
          </SecondaryButton>
          <Button
            style={{ backgroundColor: "#ef4444" }}
            onClick={onConfirm}
            disabled={actionLoading}
            aria-label="Confirm delete"
          >
            {actionLoading && (
              <div
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid #ffffff",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "8px",
                }}
              />
            )}
            Delete
          </Button>
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default DeleteConfirmModal;