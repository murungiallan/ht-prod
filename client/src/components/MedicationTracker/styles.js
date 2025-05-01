import styled, { ThemeProvider } from "styled-components";

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
    xs: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xl: "32px",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
};

// Export ThemeProvider for use in App.js
export { ThemeProvider };

export const Section = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.large};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  border: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.large};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${({ theme }) => theme.colors.shadow};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.medium};
    margin-bottom: ${({ theme }) => theme.spacing.medium};
  }
`;

export const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.small};
  min-height: 36px;
  min-width: 64px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}33;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.813rem;
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.small};
  }
`;

export const SecondaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background-color: #e8e8e8;
    border-color: ${({ theme }) => theme.colors.border};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.secondary}66;
  }
`;

export const DangerButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.danger};
  color: white;

  &:hover {
    background-color: ${({ theme }) => theme.colors.danger}dd;
  }

  &:focus {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.danger}33;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.medium};
  right: ${({ theme }) => theme.spacing.medium};
  background-color: ${({ theme }) => theme.colors.secondary};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e8e8e8;
    color: ${({ accentColor, theme }) => accentColor || theme.colors.primary};
    transform: rotate(90deg);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ accentColor, theme }) => (accentColor ? `${accentColor}33` : `${theme.colors.primary}33`)};
  }
`;

export const Input = styled.input`
  width: 100%;
  background-color: #fff;
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-height: 36px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}99;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}22;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.small};
  }
`;

export const Select = styled.select`
  width: 100%;
  background-color: #fff;
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-height: 36px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.small} center;
  background-size: 16px;
  padding-right: ${({ theme }) => theme.spacing.xl};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}99;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}22;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.small};
    padding-right: ${({ theme }) => theme.spacing.large};
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  background-color: #fff;
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  resize: vertical;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-height: 80px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}99;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}22;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.small};
  }
`;

export const ModalOverlay = {
  backgroundColor: theme.colors.overlay,
  zIndex: 1000,
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  transition: "opacity 0.3s ease-in-out",
};

export const ModalContent = {
  background: theme.colors.background,
  border: "none",
  borderRadius: "16px",
  padding: 0,
  position: "relative",
  minWidth: "30vw",
  // maxWidth: "600px",
  maxHeight: "95vh",
  marginBottom: "1rem",
  marginRight: "1rem",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  "@media (max-width: 640px)": {
    width: "100%",
    margin: theme.spacing.small,
    maxHeight: "85vh",
  },
};

export const ModalContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ theme }) => theme.spacing.large};
  position: relative;

  // Hide scrollbar for Chrome, Safari, and Opera
  &::-webkit-scrollbar {
    display: none;
  }

  // Hide scrollbar for Firefox
  scrollbar-width: none;

  // Hide scrollbar for IE and Edge
  -ms-overflow-style: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.medium};
    max-height: 85vh;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    margin: 0 0 ${({ theme }) => theme.spacing.medium} 0;
    word-break: break-word;
  }

  p {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textLight};
    margin: 0 0 ${({ theme }) => theme.spacing.medium} 0;
    line-height: 1.5;
    word-wrap: break-word;
  }

  .modal-actions {
    display: flex;
    gap: ${({ theme }) => theme.spacing.small};
    margin-top: ${({ theme }) => theme.spacing.large};
    justify-content: flex-end;
    flex-wrap: wrap;
    position: sticky;
    bottom: 0;
    background-color: ${({ theme }) => theme.colors.background};
    padding-top: ${({ theme }) => theme.spacing.medium};
    border-top: 1px solid ${({ theme }) => theme.colors.border};

    @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
      flex-direction: column;
      width: 100%;

      button {
        width: 100%;
      }
    }
  }

  .modal-list {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.small};
    margin: ${({ theme }) => theme.spacing.medium} 0;
    overflow-y: auto;
    max-height: 50vh;
    padding-right: ${({ theme }) => theme.spacing.small};

    /* Custom scrollbar for modal-list */
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.border} transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.colors.border};
      border-radius: 2px;
    }
  }

  .modal-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({ theme }) => theme.spacing.small};
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.small};

    @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
      flex-direction: column;
      align-items: flex-start;
    }

    &:hover {
      background-color: #e8e8e8;
    }
  }

  .modal-time {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.small};
    flex-wrap: wrap;
    word-break: break-word;
    min-width: 120px;
  }

  .modal-medication-name {
    font-weight: 500;
    word-break: break-word;
    max-width: 100%;
  }

  .modal-dosage {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textLight};
    word-break: break-word;
    max-width: 100%;
  }

  .modal-buttons {
    display: grid;
    grid-template-columns: repeat(3, minmax(40px, 1fr));
    gap: ${({ theme }) => theme.spacing.small};
    justify-items: right;
    align-items: center;
    max-width: 200px;

    @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
      grid-template-columns: repeat(3, 1fr); // Keep 3 columns on mobile, but adjust spacing
      gap: ${({ theme }) => theme.spacing.xs};
    }

    button, p {
      color: #1a73e8;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      transition: color 0.2s ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;

      &:hover {
        color: #0d5bd1;
        background-color: ${({ theme }) => theme.colors.secondary};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    button:nth-child(2), p:nth-child(1) {
      color: ${({ theme }) => theme.colors.success}; // "Sent!" or Edit button
      &:hover {
        color: darken(${({ theme }) => theme.colors.success}, 10%);
        background-color: ${({ theme }) => theme.colors.secondary};
      }
    }

    button:nth-child(3) {
      color: ${({ theme }) => theme.colors.danger}; // Delete button
      &:hover {
        color: darken(${({ theme }) => theme.colors.danger}, 10%);
        background-color: ${({ theme }) => theme.colors.secondary};
      }
    }
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.large};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.large};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.medium};
  }
`;

export const Card = styled(Section)`
  padding: ${({ theme }) => theme.spacing.medium};
  margin-bottom: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid transparent;
  margin-bottom: ${({ theme }) => theme.spacing.large};

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: white;

    th,
    td {
      padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
      text-align: left;
    }

    th {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.text};
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background-color: ${({ theme }) => theme.colors.secondary}66;
    }
  }
`;

export const TimeOfDaySection = styled.div`
  flex: 2;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.large};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin-left: ${({ theme }) => theme.spacing.large};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 0;
    margin-top: ${({ theme }) => theme.spacing.large};
    flex: 1;
  }
`;

export const CalendarSection = styled.div`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.large};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  border: 1px solid ${({ theme }) => theme.colors.border};

  .calendar-container {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex: 1;
  }
`;