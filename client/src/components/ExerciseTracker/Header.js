import { motion } from "framer-motion";

const Header = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.header className="mb-4" variants={itemVariants}>
      <div className="flex flex-col md:items-start gap-4 mb-4 w-full">
        <h1 className="text-2xl font-bold text-gray-800 font-inter">
          Your Exercises
        </h1>
        <p className="text-base text-gray-600">Track your fitness journey with precision</p>
      </div>
    </motion.header>
  );
};

export default Header;