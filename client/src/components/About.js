import { useRef, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { FaHeartbeat, FaChartLine, FaBrain, FaLock } from "react-icons/fa";
import allanImg from '../assets/allan-profile.jpg';
import teamImg from '../assets/team-unsplash.jpg';

const About = () => {
  // Animation controls
  const teamRef = useRef(null);
  const valuesRef = useRef(null);
  const teamInView = useInView(teamRef, { once: true, threshold: 0.2 });
  const valuesInView = useInView(valuesRef, { once: true, threshold: 0.2 });
  const teamControls = useAnimation();
  const valuesControls = useAnimation();

  useEffect(() => {
    if (teamInView) teamControls.start("visible");
    if (valuesInView) valuesControls.start("visible");
  }, [teamControls, valuesControls, teamInView, valuesInView]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="bg-gray-200 pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-400 via-gray-200 to-gray-800 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjMDAwIiBvcGFjaXR5PSIuMDUiIHdpZHRoPSIxNDQwIiBoZWlnaHQ9Ijc2MCIvPjxjaXJjbGUgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgY3g9IjcyMCIgY3k9IjM4MCIgcj0iMTAwIi8+PGNpcmNsZSBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iLjE1IiBjeD0iNzIwIiBjeT0iMzgwIiByPSIyMDAiLz48Y2lyY2xlIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIuMTUiIGN4PSI3MjAiIGN5PSIzODAiIHI9IjMwMCIvPjxjaXJjbGUgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgY3g9IjcyMCIgY3k9IjM4MCIgcj0iNDAwIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        {/* <div 
          className="absolute inset-0 opacity-90 z-0" 
          style={{
            backgroundImage: `url(${aboutImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div> */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About HealthTrack</h1>
            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
              Our mission is to empower you with the tools and insights needed for a healthier, more balanced life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="prose prose-lg text-gray-600">
                    <p>
                        HealthTrack began in 2025 with a simple vision: make health tracking intuitive and actionable. 
                        We believe that understanding your body is the first step toward improving your wellbeing.
                    </p>
                    <p>
                        Founded by a team of university students from Swinburne University Sarawak, we've designed our platform 
                        to be both comprehensive and easy to use. Whether you're managing a health condition, pursuing 
                        fitness goals, or simply want to lead a healthier lifestyle, HealthTrack provides the tools 
                        you need.
                    </p>
                </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
            >
              <img src={teamImg} alt="HealthTrack Team" className="w-full h-auto opacity-70" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section ref={valuesRef} className="py-16 md:py-24 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            animate={valuesControls}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do at HealthTrack.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            animate={valuesControls}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div 
              variants={fadeInUp} 
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-black mb-4">
                <FaHeartbeat size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">User-Centered Care</h3>
              <p className="text-gray-600">
                Everything we build starts with understanding your health needs and goals.
              </p>
            </motion.div>

            <motion.div 
              variants={fadeInUp} 
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-black mb-4">
                <FaChartLine size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Data-Driven Insights</h3>
              <p className="text-gray-600">
                We transform your health data into meaningful, actionable information.
              </p>
            </motion.div>

            <motion.div 
              variants={fadeInUp} 
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-black mb-4">
                <FaLock size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your health data is sensitive. We maintain the highest standards of security and privacy.
              </p>
            </motion.div>

            <motion.div 
              variants={fadeInUp} 
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-black mb-4">
                <FaBrain size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Continuous Innovation</h3>
              <p className="text-gray-600">
                We're constantly improving our platform based on the latest health research.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            animate={teamControls}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate experts behind HealthTrack's mission to improve lives.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            animate={teamControls}
            variants={staggerContainer}
            className="grid md:grid-cols-4 lg:grid-cols-4 gap-8"
          >
            {[1, 2, 3, 4].map((index) => (
              <motion.div 
                key={index}
                variants={fadeInUp} 
                className=" rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <img 
                  src={`${allanImg}?text=Team Member ${index}`} 
                  alt={`Team Member ${index}`} 
                  className="w-full h-64 object-cover opacity-10" 
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Team Member {index}</h3>
                  <p className="text-black mb-3">Position Title</p>
                  <p className="text-gray-600">
                    Brief bio about the team member and their contribution to HealthTrack.
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-100 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-black">Start Your Health Journey Today</h2>
            <p className="text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
              Join thousands of users who are taking control of their health with HealthTrack.
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition duration-300 shadow-lg"
            >
              Create Free Account
            </Link>
          </motion.div>
        </div>
      </section>

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

export default About;