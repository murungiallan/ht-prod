

const mockDrugData = [
    { id: 1, name: "Acetaminophen" },
    { id: 2, name: "Amoxicillin" },
    { id: 3, name: "Atorvastatin" },
    { id: 4, name: "Lisinopril" },
    { id: 5, name: "Metformin" },
    { id: 6, name: "Simvastatin" },
    { id: 7, name: "Levothyroxine" },
    { id: 8, name: "Metoprolol" },
    { id: 9, name: "Amlodipine" },
    { id: 10, name: "Albuterol" },
  ];

  // Fetch medications for the user
  useEffect(() => {
    const fetchMedications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await auth.currentUser.getIdToken(true);
        const userMedications = await getUserMedications(token);
        setMedications(userMedications);
      } catch (err) {
        console.error("Error fetching medications:", err);
        if (err.response?.status === 401) {
          try {
            const newToken = await auth.currentUser.getIdToken(true);
            const userMedications = await getUserMedications(newToken);
            setMedications(userMedications);
          } catch (refreshErr) {
            toast.error("Session expired. Please log in again.");
            logout();
            navigate("/login");
            console.error("Error refreshing token:", refreshErr);
          }
        } else {
          toast.error("Failed to load medications");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchMedications();
  }, [user]);

  // Load mock drug data
  useEffect(() => {
    setDrugList(mockDrugData);
    setFilteredDrugs(mockDrugData);
  }, []);

  // Mock drug info when a medication is selected
  useEffect(() => {
    const fetchMockDrugInfo = async () => {
      if (!selectedMedication) return;
      
      setDrugInfoLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock drug interactions and usage info
        const mockInteractions = [
          "May interact with blood thinners, increasing risk of bleeding.",
          "Can interact with certain antidepressants. Monitor for side effects.",
          "Avoid grapefruit juice while taking this medication."
        ];
        
        const mockUsage = "Take as directed by your healthcare provider. May be taken with or without food. Store at room temperature away from moisture and heat.";
        
        setDrugInfo({ 
          interactions: mockInteractions, 
          usage: mockUsage 
        });
      } catch (err) {
        console.error("Error fetching drug info:", err);
        setDrugInfo({ 
          interactions: [], 
          usage: "Information not available." 
        });
      } finally {
        setDrugInfoLoading(false);
      }
    };
    
    if (showDetailModal && selectedMedication) {
      fetchMockDrugInfo();
    }
  }, [showDetailModal, selectedMedication]);

  // Helper function to determine if a dose is due, taken or missed based on time
  const getDoseStatus = (med, doseIndex) => {
    if (!med || !med.doses || !med.doses[doseIndex]) {
      return { isTaken: false, isMissed: false, isTimeToTake: false, hasPassed: false };
    }
  
    const dose = med.doses[doseIndex];
    const isTaken = dose.taken || false;
    const isMissed = dose.missed || false;
  
    // Check if the dose time has passed
    const doseTime = dose.time;
    const [hours, minutes] = doseTime.split(':').map(Number);
  
    const doseDateTime = new Date(selectedDate);
    doseDateTime.setHours(hours, minutes, 0);
  
    const now = new Date();
    const hasPassed = doseDateTime < now;
  
    // Determine if it's time to take the medication (within 1 hour before or after scheduled time)
    const oneHourInMs = 60 * 60 * 1000;
    const isTimeToTake = Math.abs(doseDateTime - now) <= oneHourInMs;
  
    return { isTaken, isMissed, isTimeToTake, hasPassed };
  };

  // Filter drugs based on user input
  const handleDrugSearch = (value) => {
    setName(value);
    if (value.trim() === "") {
      setFilteredDrugs(drugList);
      setShowDropdown(false);
    } else {
      const filtered = drugList.filter((drug) =>
        drug.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDrugs(filtered);
      setShowDropdown(true);
    }
  };

  const calculateTimes = (timesPerDay) => {
    const times = [];
    
    if (timesPerDay === "1") {
      times.push("08:00:00");
    } else if (timesPerDay === "2") {
      times.push("08:00:00");
      times.push("20:00:00");
    } else if (timesPerDay === "3") {
      times.push("08:00:00");
      times.push("14:00:00");
      times.push("20:00:00");
    }
    
    return times;
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to add a medication");
      logout();
      navigate("/login");
      return;
    }
    if (!name || !frequency || !dosage || !timesPerDay || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setActionLoading(true);
    
    try {
      const token = await auth.currentUser.getIdToken(true);
      const formattedStartDate = moment(startDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
      const formattedEndDate = moment(endDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
      const calculatedTimes = calculateTimes(timesPerDay);
      
      const newMedication = {
        medication_name: name,
        frequency: frequency.toLowerCase(),
        dosage,
        times_per_day: parseInt(timesPerDay),
        times: calculatedTimes,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        notes: notes || null,
        doses: calculatedTimes.map((time) => ({
          time,
          taken: false,
          missed: false,
        })),
      };
      
      const createdMedication = await createMedication(newMedication, token);
      setMedications((prev) => [createdMedication, ...prev]);
      
      // Reset form
      setName("");
      setFrequency("daily");
      setDosage("");
      setTimesPerDay("1");
      setStartDate("");
      setEndDate("");
      setNotes("");
      setShowAddModal(false);
      setShowDropdown(false);
      toast.success("Medication added successfully");
    } catch (err) {
      console.error("Error adding medication:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          const formattedStartDate = moment(startDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
          const formattedEndDate = moment(endDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
          const calculatedTimes = calculateTimes(timesPerDay);
          
          const newMedication = {
            medication_name: name,
            frequency: frequency.toLowerCase(),
            dosage,
            times_per_day: parseInt(timesPerDay),
            times: calculatedTimes,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            notes: notes || null,
            doses: calculatedTimes.map((time) => ({
              time,
              taken: false,
              missed: false,
              takenAt: null,
            })),
          };
          const createdMedication = await createMedication(newMedication, newToken);
          setMedications((prev) => [createdMedication, ...prev]);

          setName("");
          setFrequency("daily");
          setDosage("");
          setTimesPerDay("1");
          setStartDate("");
          setEndDate("");
          setNotes("");
          setShowAddModal(false);
          setShowDropdown(false);
          toast.success("Medication added successfully");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          console.error("Error refreshing token:", refreshErr);
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to add medication");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    setActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      await deleteMedication(id, token);
      setMedications((prev) => prev.filter((med) => med.id !== id));
      if (selectedMedication?.id === id) {
        setShowDetailModal(false);
      }
      toast.success("Medication deleted successfully");
    } catch (err) {
      console.error("Error deleting medication:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          await deleteMedication(id, newToken);
          setMedications((prev) => prev.filter((med) => med.id !== id));
          if (selectedMedication?.id === id) {
            setShowDetailModal(false);
          }
          toast.success("Medication deleted successfully");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to delete medication");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTakenStatus = async (id, doseIndex, taken) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;
  
    const { isTimeToTake, hasPassed } = getDoseStatus(med, doseIndex);
  
    if (taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot mark as taken more than 1 hour after the scheduled time");
      return;
    }
  
    if (!taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot undo taken status more than 1 hour after the scheduled time");
      return;
    }
  
    setActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const updatedMedication = await updateMedicationTakenStatus(id, doseIndex, taken, token);
  
      // Update medications in state
      setMedications(prev =>
        prev.map(med => (med.id === updatedMedication.id ? updatedMedication : med))
      );
  
      // Update selected medication if it's the one being modified
      if (selectedMedication?.id === updatedMedication.id) {
        setSelectedMedication(updatedMedication);
      }
  
      // Emit Socket.IO event to notify other clients (e.g., Dashboard)
      if (socket) {
        socket.emit("medicationUpdated", updatedMedication);
      }
  
      toast.success(taken ? "Medication marked as taken" : "Taken status undone");
    } catch (err) {
      console.error("Error updating taken status:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          const updatedMedication = await updateMedicationTakenStatus(id, doseIndex, taken, newToken);
          setMedications(prev =>
            prev.map(med => (med.id === updatedMedication.id ? updatedMedication : med))
          );
          if (selectedMedication?.id === updatedMedication.id) {
            setSelectedMedication(updatedMedication);
          }
  
          // Emit Socket.IO event after refreshing token
          if (socket) {
            socket.emit("medicationUpdated", updatedMedication);
          }
  
          toast.success(taken ? "Medication marked as taken" : "Taken status undone");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to update medication status");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const checkForMissedMedications = () => {
    const now = new Date();
    
    const medicationsWithUpdatedStatus = medications.map(med => {
      if (!med.doses) return med;
      
      const updatedDoses = med.doses.map((dose, index) => {
        if (dose.taken || dose.missed) return dose;
        
        const [hours, minutes] = dose.time.split(':').map(Number);
        const doseDateTime = new Date(selectedDate);
        doseDateTime.setHours(hours, minutes, 0);
        
        // If dose time has passed by more than 2 hours and not taken
        const twoHoursInMs = 2 * 60 * 60 * 1000;
        if (now - doseDateTime > twoHoursInMs) {
          return { ...dose, missed: true };
        }
        
        return dose;
      });
      
      return { ...med, doses: updatedDoses };
    });
    
    // Update medications state if any changes were made
    if (JSON.stringify(medications) !== JSON.stringify(medicationsWithUpdatedStatus)) {
      setMedications(medicationsWithUpdatedStatus);
  
      medicationsWithUpdatedStatus.forEach(async (med, medIndex) => {
        if (!med.doses) return;
  
        med.doses.forEach(async (dose, index) => {
          const originalDose = medications[medIndex]?.doses?.[index];
          if (dose.missed && !originalDose?.missed) {
            try {
              const token = await auth.currentUser.getIdToken(true);
              const updatedMedication = await markMedicationAsMissed(med.id, index, true, token);
              if (socket) {
                socket.emit("medicationUpdated", updatedMedication);
              }
            } catch (err) {
              console.error("Error auto-marking medication as missed:", err);
            }
          }
        });
      });
    }
  };

  // Check for missed medications every minute
  useEffect(() => {
    checkForMissedMedications();
    const interval = setInterval(checkForMissedMedications, 60 * 1000);
    return () => clearInterval(interval);
  }, [medications, selectedDate]);

  const confirmTakenStatus = (id, doseIndex, taken) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;
  
    const { isTaken, isTimeToTake, hasPassed } = getDoseStatus(med, doseIndex);
  
    if (taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot mark as taken more than 1 hour after the scheduled time");
      return;
    }
  
    if (!taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot undo taken status more than 1 hour after the scheduled time");
      return;
    }
  
    setConfirmMessage(`${taken ? "Did you take your medicine?" : "Not taken your medicine yet?"}`);
    setConfirmAction(() => () => handleUpdateTakenStatus(id, doseIndex, taken));
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const openMedicationDetail = (med) => {
    setSelectedMedication(med);
    setShowDetailModal(true);
  };

  const calculateProgress = () => {
    if (!selectedMedication) return 0;
    const { totalDoses, takenDoses } = calculateDoseStatus(selectedMedication);
    return totalDoses > 0 ? Math.floor((takenDoses / totalDoses) * 100) : 0;
  };

  const calculateDaysRemaining = () => {
    if (!selectedMedication) return 0;
    const end = moment(selectedMedication.end_date);
    const today = moment();
    return Math.max(0, end.diff(today, "days"));
  };

  const categorizeMedicationsByTime = () => {
    const morningMeds = [];
    const afternoonMeds = [];
    const eveningMeds = [];
    
    medications.forEach(med => {
      if (!med.doses) return;
      
      med.doses.forEach((dose, index) => {
        if (!dose || !dose.time) return;
        
        const [hours] = dose.time.split(':').map(Number);
        let timeOfDay = "morning";
        if (hours >= 12 && hours < 17) timeOfDay = "afternoon";
        else if (hours >= 17) timeOfDay = "evening";
        
        const medDate = moment(med.start_date || med.createdAt).format('YYYY-MM-DD');
        const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
        
        if (medDate === selectedDateStr) {
          const medicationWithDoseInfo = {
            ...med,
            doseIndex: index,
            doseTime: dose.time,
            doseTaken: dose.taken || false,
            doseMissed: dose.missed || false,
          };
          
          if (timeOfDay === "morning") morningMeds.push(medicationWithDoseInfo);
          else if (timeOfDay === "afternoon") afternoonMeds.push(medicationWithDoseInfo);
          else eveningMeds.push(medicationWithDoseInfo);
        }
      });
    });
    
    return { morningMeds, afternoonMeds, eveningMeds };
  };

  const getDailyDoses = () => {
    return medications.flatMap(med => {
      const doses = Array.isArray(med.doses) ? med.doses : [];
      const medDate = moment(med.start_date || med.createdAt).format('YYYY-MM-DD');
      const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
      
      if (medDate === selectedDateStr) {
        return doses.map((dose, index) => ({
          ...med,
          doseIndex: index,
          doseTime: dose?.time || "Unknown time",
          doseTaken: dose?.taken || false,
          doseMissed: dose?.missed || false,
          timeOfDay: (() => {
            if (!dose?.time) return "unknown";
            const [hours] = dose.time.split(':').map(Number);
            if (hours < 12) return "Morning";
            if (hours < 17) return "Afternoon";
            return "Evening";
          })()
        }));
      }
      return [];
    });
  };

  const { morningMeds, afternoonMeds, eveningMeds } = categorizeMedicationsByTime();
  const dailyDoses = getDailyDoses();
  
  const calculateDoseStatus = (med) => {
    const doses = Array.isArray(med.doses) ? med.doses : [];
    const totalDoses = doses.length;
    const takenDoses = doses.filter(dose => dose?.taken).length;
    const missedDoses = doses.filter(dose => dose?.missed).length;
    return { totalDoses, takenDoses, missedDoses };
  };

  const isPastDate = (date) => moment(date).isBefore(moment(), "day");
  const isFutureDate = (date) => moment(date).isAfter(moment(), "day");