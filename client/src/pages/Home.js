import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "framer-motion";
import { FaRunning, FaPills, FaChartLine } from "react-icons/fa";
import breakfast from "../assets/home-unsplash.jpg";

const Home = () => {
  const heroControls = useAnimation();
  const featuresControls = useAnimation();
  const ctaControls = useAnimation();

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { threshold: 0.3, once: true });
  const featuresInView = useInView(featuresRef, { threshold: 0.3, once: true });
  const ctaInView = useInView(ctaRef, { threshold: 0.3, once: true });

  useEffect(() => {
    if (heroInView) heroControls.start("visible");
    if (featuresInView) featuresControls.start("visible");
    if (ctaInView) ctaControls.start("visible");
  }, [heroControls, featuresControls, ctaControls, heroInView, featuresInView, ctaInView]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.6,
      },
    },
  };

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroControls}
        variants={fadeInUp}
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${breakfast})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-60 z-0"></div>
        <div className="relative z-10 text-center px-4">
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white"
          >
            Welcome to HealthTrack
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-200"
          >
            Track your exercises, medications, and wellness goals with ease.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link
              to="/register"
              className="inline-block bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-gray-200 transition duration-300 shadow-lg"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-4 right-4 text-white text-sm z-10">
          Photo by{" "}
          <a
            href="https://unsplash.com/@element5digital?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
            className="underline hover:text-gray-300 transition duration-300"
          >
            Element5 Digital
          </a>{" "}
          on{" "}
          <a
            href="https://unsplash.com/photos/photo-of-three-orange-fruits-acrBf9BlfvE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
            className="underline hover:text-gray-300 transition duration-300"
          >
            Unsplash
          </a>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresControls}
        variants={staggerChildren}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl min-h-70 mx-auto text-center flex flex-col items-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12"
          >
            Why Choose HealthTrack?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
            >
              <FaRunning className="text-gray-800 text-4xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Exercise Tracking
              </h3>
              <p className="text-gray-600">
                Log your workouts, track calories burned, and monitor your progress over time.
              </p>
            </div>
            <div
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
            >
              <FaPills className="text-gray-800 text-4xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Medication Reminders
              </h3>
              <p className="text-gray-600">
                Never miss a dose with our smart reminders and medication tracking.
              </p>
            </div>
            <div
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
            >
              <FaChartLine className="text-gray-800 text-4xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Health Insights
              </h3>
              <p className="text-gray-600">
                Get personalized insights and analytics to improve your wellness journey.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        ref={ctaRef}
        initial="hidden"
        animate={ctaControls}
        variants={fadeInUp}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-100 to-gray-200 text-black text-center"
      >
        <h2
          className="text-3xl sm:text-4xl font-bold mb-4"
        >
          Ready to Take Control of Your Health?
        </h2>
        <p
          className="text-lg sm:text-xl mb-8 text-black"
        >
          Join users who are achieving their wellness goals with HealthTrack.
        </p>
        <motion.div variants={fadeInUp}>
          <Link
            to="/register"
            className="inline-block bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-gray-200 transition duration-300 shadow-lg"
          >
            Sign Up Now
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