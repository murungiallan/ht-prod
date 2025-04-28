import styled from "styled-components";

// Theme object for variables
export const theme = {
  colors: {
    primary: "#1a73e8",
    secondary: "#f5f5f5",
    background: "rgba(255, 255, 255, 0.9)",
    text: "#333333",
    textLight: "#666666",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    border: "#e0e0e0",
    shadow: "rgba(0, 0, 0, 0.1)",
    overlay: "rgba(0, 0, 0, 0.6)",
    purple: "#6f42c1",
    yellow: "#ffca28",
    red: "#dc3545",
    teal: "#20c997",
    orange: "#fd7e14",
    pink: "#e83e8c",
    indigo: "#6610f2",
    lime: "#84cc16",
    cyan: "#0dcaf0",
  },
  spacing: {
    small: "8px",
    medium: "16px",
    large: "24px",
  },
};

export const Section = styled.div`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.large};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${theme.colors.shadow};
  border: 1px solid ${theme.colors.border};
  width: 100%;

  @media (max-width: 640px) {
    padding: ${theme.spacing.medium};
  }
`;

export const Button = styled.button`
  padding: ${theme.spacing.small} ${theme.spacing.medium};
  border-radius: 8px;
  font-size: .875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.5s ease-in-out, transform 0.2s ease;
  border: none;
  background-color: ${theme.colors.primary};
  color: white;

  &:hover {
    background-color: darken(${theme.colors.primary}, 10%);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    // box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled(Button)`
  background-color: ${theme.colors.secondary};
  color: ${theme.colors.text};
  border: 1px solid ${theme.colors.border};

  &:hover {
    background-color: #e8e8e8;
    border-color: transparent;
  }
`;

export const DangerButton = styled(Button)`
  background-color: ${theme.colors.danger};
  color: white;

  &:hover {
    background-color: darken(${theme.colors.danger}, 10%);
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: ${theme.spacing.medium};
  right: ${theme.spacing.medium};
  background-color: ${theme.colors.secondary};
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: ${theme.colors.textLight};
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: #e8e8e8;
    color: ${(props) => props.accentColor || theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${(props) => `rgba(${props.accentColor || theme.colors.primary}, 0.3)`};
  }
`;

export const Input = styled.input`
  width: 100%;
  background-color: #fff;
  padding: ${theme.spacing.small};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  
  color: ${theme.colors.text};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  background-color: #fff;
  padding: ${theme.spacing.small};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  
  color: ${theme.colors.text};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  background-color: #fff;
  padding: ${theme.spacing.small};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  color: ${theme.colors.text};
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
  }
`;

export const ModalOverlay = {
  backgroundColor: theme.colors.overlay,
  zIndex: 1000,
  transition: "opacity 0.3s ease-in-out",
  cursor: "pointer",
  ":hover": {
    opacity: 0.8,
  },
};

export const ModalContent = {
  background: "transparent",
  border: "none",
  borderRadius: "1rem",
  padding: 0,
  top: "50%",
  left: "50%",
  right: "auto",
  bottom: "auto",
  transform: "translate(-50%, -50%)",
  overflow: "hidden",
  width: "auto",
  height: "auto",
  minWidth: "90vw",
  maxHeight: "90vh",
};

export const ModalContentWrapper = styled.div`
  background-color: ${theme.colors.background};
  color: ${theme.colors.text};
  width: 90%;
  max-width: ${(props) => props.maxwidth || "28rem"};
  max-height: 90vh;
  margin: 0 auto;
  border-radius: 12px;
  padding: ${theme.spacing.large};
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Hide scrollbar*/
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  
  box-shadow: 0 8px 24px ${theme.colors.shadow};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.3s ease;

  @media (max-width: 640px) {
    padding: ${theme.spacing.medium};
    width: 95%;
    max-width: 95%;
  }
`;