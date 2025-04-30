const DeleteFoodModal = ({ food, onDelete, onClose }) => {
    const handleDelete = async () => {
        try {
        await onDelete(food.id);
        onClose();
        } catch (error) {
        console.error("Error deleting food:", error);
        }
    };
    
    return (
        <div className="modal">
        <div className="modal-content">
            <h2>Delete Food Entry</h2>
            <p>Are you sure you want to delete this food entry?</p>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={onClose}>Cancel</button>
        </div>
        </div>
    );
}

export default DeleteFoodModal;