import { useState } from "react";
import { motion } from "framer-motion";
import React from "react";

const LogFood = ({ handleLogFood, loading, isOpen, onClose }) => { 
    const [foodName, setFoodName] = useState("");
    const [sportion, setPortion] = useState("");
    const [calories, setCalories] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        await handleLogFood(e, foodName, sportion, calories, setFoodName, setPortion, setCalories);
        if (!loading) onClose();
    };

    const handleCancel = () => {
        setFoodName("");
        setPortion("");
        setCalories("");
        onClose();
    };

};