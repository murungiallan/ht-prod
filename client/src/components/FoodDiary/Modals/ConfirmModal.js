import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, SecondaryButton, ModalOverlay, ModalContent } from "../styles";

const ConfirmModal = ({ isOpen, onRequestClose, message, onConfirm, actionLoading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Confirm Action"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#ffca28">
        <CloseButton onClick={onRequestClose} accentColor="#ffca28" aria-label="Close modal">
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
          Confirm Action
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <SecondaryButton onClick={onRequestClose} aria-label="Cancel action">
            Cancel
          </SecondaryButton>
          <Button
            style={{ backgroundColor: "#ffca28", color: "#333333" }}
            onClick={onConfirm}
            disabled={actionLoading}
            aria-label="Confirm action"
          >
            {actionLoading && (
              <div
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid #333333",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "8px",
                }}
              />
            )}
            Confirm
          </Button>
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default ConfirmModal;