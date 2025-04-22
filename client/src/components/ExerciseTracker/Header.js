import { motion } from "framer-motion";

const Header = ({ onOpenModal }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.header className="mb-4" variants={itemVariants}>
      <div className="flex justify-between items-center gap-4 mb-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-mono">
            Your Exercises
          </h1>
          <p className="text-base text-gray-600">Track your fitness journey with precision</p>
        </div>
        <button
          onClick={onOpenModal}
          className="mx-2 px-4 py-2 text-sm font-medium text-black bg-transparent hover:bg-yellow-500 hover:text-white border border-gray-200 rounded-lg transition-colors duration-200 focus:outline-none"
          aria-label="Log new exercise"
        >
          Log Exercise
        </button>
      </div>
    </motion.header>
  );
};

export default Header;