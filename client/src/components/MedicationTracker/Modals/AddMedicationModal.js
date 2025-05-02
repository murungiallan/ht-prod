import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent, Input } from "../styles";
import { searchDrugsByName, getDrugDetails } from "../../../services/api";
import { toast } from 'react-hot-toast';

const AddMedicationModal = ({
  isOpen,
  onRequestClose,
  name,
  setName,
  frequency,
  setFrequency,
  dosage,
  setDosage,
  timesPerDay,
  setTimesPerDay,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  notes,
  setNotes,
  handleAddMedication,
  actionLoading,
  onMedicationAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [doseTimes, setDoseTimes] = useState([]);
  const [selectedDrugInfo, setSelectedDrugInfo] = useState(null);
  const [selectedDrugId, setSelectedDrugId] = useState(null);
  
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Initialize doseTimes based on timesPerDay
  useEffect(() => {
    const count = parseInt(timesPerDay) || 1;
    
    setDoseTimes(
      Array.from({ length: count }, (_, i) => {
        let defaultTime = "08:00";
        let defaultPeriod = "Morning";
        
        if (count >= 2) {
          if (i === 1) {
            defaultTime = "12:00";
            defaultPeriod = "Afternoon";
          } else if (i === 2) {
            defaultTime = "18:00";
            defaultPeriod = "Evening";
          } else if (i >= 3) {
            defaultTime = "20:00";
            defaultPeriod = "Evening";
          }
        }
        
        return {
          time: defaultTime,
          period: defaultPeriod,
        };
      })
    );
  }, [timesPerDay]);
  
  // Set up debounced search
  useEffect(() => {
    setName(searchTerm);
    
    if (!searchTerm || searchTerm.length < 2) {
      setFilteredDrugs([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchDrugsByName(searchTerm);
        setFilteredDrugs(results);
        setShowDropdown(results.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Error during drug search:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, setName]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredDrugs.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredDrugs.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleDrugSelect(filteredDrugs[highlightedIndex]);
    } else if (e.key === "Enter" && highlightedIndex === -1 && filteredDrugs.length > 0) {
      e.preventDefault();
      handleDrugSelect(filteredDrugs[0]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };
  
  // Handle drug selection and populate related fields
  const handleDrugSelect = async (drug) => {
    setName(drug.displayName);
    setSearchTerm(drug.displayName);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSelectedDrugId(drug.id);
    
    try {
      setIsSearching(true);
      const drugInfo = await getDrugDetails(drug.id, drug.displayName);
      setSelectedDrugInfo(drugInfo);
      
      if (drugInfo.dosages && drugInfo.dosages.length > 0) {
        setDosage(drugInfo.dosages[0]);
      } else if (drug.dosage && drug.dosage !== "Not specified") {
        setDosage(drug.dosage);
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error("Error fetching drug details:", error);
      if (drug.dosage && drug.dosage !== "Not specified") {
        setDosage(drug.dosage);
      }
      setIsSearching(false);
    }
  };
  
  // Handle dose time changes
  const handleDoseTimeChange = (index, field, value) => {
    const newDoseTimes = [...doseTimes];
    newDoseTimes[index] = { ...newDoseTimes[index], [field]: value };
    
    if (field === "time") {
      const [hours] = value.split(":").map(Number);
      if (hours >= 5 && hours < 12) {
        newDoseTimes[index].period = "Morning";
      } else if (hours >= 12 && hours < 17) {
        newDoseTimes[index].period = "Afternoon";
      } else {
        newDoseTimes[index].period = "Evening";
      }
    }
    
    setDoseTimes(newDoseTimes);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newMedication = await handleAddMedication(e, doseTimes);
      if (selectedDrugInfo) {
        onMedicationAdded({ ...newMedication, drugInfo: selectedDrugInfo });
      } else if (selectedDrugId) {
        try {
          const drugInfo = await getDrugDetails(selectedDrugId, name);
          onMedicationAdded({ ...newMedication, drugInfo });
        } catch (error) {
          console.error("Error fetching drug info after adding:", error);
          onMedicationAdded({
            ...newMedication,
            drugInfo: { 
              interactions: [], 
              dosages: [], 
              usage: "", 
              description: "Failed to fetch details" 
            }
          });
        }
      } else {
        onMedicationAdded({
          ...newMedication,
          drugInfo: { 
            interactions: [], 
            dosages: [], 
            usage: "Please follow your doctor's instructions", 
            description: "No details available" 
          }
        });
      }
    } catch (error) {
      console.error("Error adding medication:", error);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Render loading indicator in dropdown
  const renderDropdownContent = () => {
    if (isSearching) {
      return (
        <li
          style={{
            padding: "8px",
            fontSize: "0.875rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          Searching...
        </li>
      );
    }
    
    if (filteredDrugs.length === 0) {
      return (
        <li
          style={{
            padding: "8px",
            fontSize: "0.875rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          No medications found
        </li>
      );
    }
    
    return filteredDrugs.map((drug, index) => (
      <li
        key={drug.id}
        onClick={() => handleDrugSelect(drug)}
        style={{
          padding: "8px",
          fontSize: "0.875rem",
          color: "#333333",
          cursor: "pointer",
          backgroundColor: highlightedIndex === index ? "#f5f5f5" : "white",
        }}
        onMouseEnter={() => setHighlightedIndex(index)}
        onMouseLeave={() => setHighlightedIndex(-1)}
      >
        <div>
          <strong>{drug.displayName}</strong>
          {drug.dosage && drug.dosage !== "Not specified" && (
            <span style={{ color: "#666", marginLeft: "4px" }}>({drug.dosage})</span>
          )}
        </div>
        {drug.type === "SCD" && (
          <div style={{ fontSize: "0.75rem", color: "#28a745" }}>
            Clinical Drug Form
          </div>
        )}
      </li>
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Add Medication"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper width="50vw" borderColor="#28a745">
        <CloseButton onClick={onRequestClose} accentColor="#28a745" aria-label="Close modal">
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
          Add New Medication
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px", position: "relative" }} ref={dropdownRef}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Medication Name
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a medication..."
              required
              autoComplete="off"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
              }}
            />
            {showDropdown && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {renderDropdownContent()}
              </ul>
            )}
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Dosage
            </label>
            <Input
              type="text"
              value={dosage || ""}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 500 mg"
              required
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
              }}
            />
            {selectedDrugInfo && selectedDrugInfo.dosages && selectedDrugInfo.dosages.length > 1 && (
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "#666" }}>Common dosages: </span>
                {selectedDrugInfo.dosages.slice(0, 3).map((dose, i) => (
                  <span 
                    key={i}
                    onClick={() => setDosage(dose)}
                    style={{ 
                      fontSize: "0.75rem", 
                      color: "#28a745", 
                      marginRight: "8px",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {dose}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Frequency
            </label>
            <select
              value={frequency || "daily"}
              onChange={(e) => setFrequency(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Times Per Day
            </label>
            <Input
              type="number"
              value={timesPerDay || 1}
              onChange={(e) => setTimesPerDay(e.target.value ? Number(e.target.value) : 1)}
              min="1"
              required
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          
          {doseTimes.map((dose, index) => (
            <div key={index} style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#333333",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Dose {index + 1} Time
              </label>
              <Input
                type="time"
                value={dose.time}
                onChange={(e) => handleDoseTimeChange(index, "time", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "0.875rem",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#666",
                  marginTop: "4px",
                }}
              >
                This dose is scheduled for: {dose.period}
              </p>
            </div>
          ))}
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Start Date
            </label>
            <Input
              type="date"
              value={startDate || ""}
              onChange={(e) => setStartDate(e.target.value || "")}
              required
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              End Date
            </label>
            <Input
              type="date"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value || "")}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
              }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666",
                marginTop: "4px",
              }}
            >
              Leave blank for ongoing medications
            </p>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Notes
            </label>
            <textarea
              value={notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={actionLoading || isSearching}
            style={{
              opacity: actionLoading || isSearching ? 0.7 : 1
            }}
          >
            {actionLoading ? "Adding..." : "Add Medication"}
          </Button>
        </form>
      </ModalContentWrapper>
    </Modal>
  );
};

export default AddMedicationModal;