import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "framer-motion";
import { FaRunning, FaPills, FaChartLine, FaUserPlus, FaClipboardList, FaChartBar } from "react-icons/fa";
import heroImage from "../assets/home-unsplash.jpg";;

const Home = () => {
  // Animation controls for each section
  const heroControls = useAnimation();
  const valuePropControls = useAnimation();
  const howItWorksControls = useAnimation();
  const ctaControls = useAnimation();

  // Refs for each section to detect when they come into view
  const heroRef = useRef(null);
  const valuePropRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);

  // Detect when sections are in view
  const heroInView = useInView(heroRef, { threshold: 0.3, once: true });
  const valuePropInView = useInView(valuePropRef, { threshold: 0.3, once: true });
  const howItWorksInView = useInView(howItWorksRef, { threshold: 0.3, once: true });
  const ctaInView = useInView(ctaRef, { threshold: 0.3, once: true });

  // Trigger animations when sections come into view
  useEffect(() => {
    if (heroInView) heroControls.start("visible");
    if (valuePropInView) valuePropControls.start("visible");
    if (howItWorksInView) howItWorksControls.start("visible");
    if (ctaInView) ctaControls.start("visible");
  }, [
    heroControls,
    valuePropControls,
    howItWorksControls,
    ctaControls,
    heroInView,
    valuePropInView,
    howItWorksInView,
    ctaInView,
  ]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="bg-transparent pt-16 min-h-screen">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroControls}
        variants={fadeInUp}
        className="relative h-[75vh] flex items-center justify-center bg-cover bg-center py-24"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-30 z-0"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Take Charge of Your Health with HealthTrack
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl lg:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto"
          >
            Effortlessly track your exercises, manage medications, and gain insights to achieve your wellness goals.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/signup"
              className="inline-block px-6 py-3 text-white bg-black rounded-md font-medium hover:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 transition-all duration-200"
            >
              Start Your Journey
            </Link>
            <Link
              to="/about"
              className="inline-block px-6 py-3 text-white border border-white rounded-md font-medium hover:bg-white hover:text-gray-800 transition-all duration-200"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Value Proposition Section */}
      <motion.section
        ref={valuePropRef}
        initial="hidden"
        animate={valuePropControls}
        variants={staggerChildren}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
            Empower Your Wellness Journey
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            HealthTrack provides the tools you need to stay on top of your health goals with ease and confidence.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FaRunning className="text-black text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Track Your Workouts
              </h3>
              <p className="text-gray-600">
                Log your exercises, monitor calories burned, and see your progress over time.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FaPills className="text-black text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Manage Medications
              </h3>
              <p className="text-gray-600">
                Set reminders and track your medication schedule to never miss a dose.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FaChartLine className="text-black text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Gain Health Insights
              </h3>
              <p className="text-gray-600">
                Receive personalized analytics to optimize your health and wellness.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        ref={howItWorksRef}
        initial="hidden"
        animate={howItWorksControls}
        variants={staggerChildren}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-100"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
            How HealthTrack Works
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Get started in just a few simple steps and take control of your health today.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center"
            >
              <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaUserPlus className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Sign Up
              </h3>
              <p className="text-gray-600 max-w-xs">
                Create your free account in seconds and start your wellness journey.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center"
            >
              <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaClipboardList className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Track Your Health
              </h3>
              <p className="text-gray-600 max-w-xs">
                Log your exercises, medications, and wellness goals with ease.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center"
            >
              <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaChartBar className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                See Results
              </h3>
              <p className="text-gray-600 max-w-xs">
                Monitor your progress with detailed insights and analytics.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        ref={ctaRef}
        initial="hidden"
        animate={ctaControls}
        variants={fadeInUp}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-200 to-gray-400 text-white text-center"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to Transform Your Health?
        </h2>
        <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
          Sign up today and start tracking your wellness journey with HealthTrack.
        </p>
        <motion.div variants={fadeInUp}>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 text-white bg-gray-800 font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 rounded-full"
          >
            Get Started Now
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-black text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">HealthTrack</h3>
              <p className="text-gray-400">
                Your companion on the journey to better health and wellness.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition duration-300">Home</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition duration-300">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition duration-300">Contact</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition duration-300">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Newsletter</h3>
              <p className="text-gray-400 mb-4">Stay updated with health tips and features.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 mx-2 rounded-lg focus:outline-gray-400 flex-grow bg-white text-black"
                />
                <button className="inline-block bg-white text-black font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300 shadow-lg text-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-sm">
              © 2025 HealthTrack. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <Link to="/privacy" className="text-gray-400 hover:text-gray-200 transition duration-300 text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-gray-200 transition duration-300 text-sm">
                Terms of Service
              </Link>
              <Link to="/faq" className="text-gray-400 hover:text-gray-200 transition duration-300 text-sm">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;