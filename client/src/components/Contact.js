import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
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
    <div className="bg-gray-50 pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-400 via-gray-200 to-gray-800 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjMDAwIiBvcGFjaXR5PSIuMDUiIHdpZHRoPSIxNDQwIiBoZWlnaHQ9Ijc2MCIvPjxjaXJjbGUgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgY3g9IjcyMCIgY3k9IjM4MCIgcj0iMTAwIi8+PGNpcmNsZSBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iLjE1IiBjeD0iNzIwIiBjeT0iMzgwIiByPSIyMDAiLz48Y2lyY2xlIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIuMTUiIGN4PSI3MjAiIGN5PSIzODAiIHI9IjMwMCIvPjxjaXJjbGUgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgY3g9IjcyMCIgY3k9IjM4MCIgcj0iNDAwIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-xl text-white max-w-3xl mx-auto leading-relaxed"
          >
            Have questions or feedback? We're here to help you on your health journey.
          </motion.p>
        </div>
      </section>

      {/* Main Content*/}
      <section className="py-16 px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* Contact Form */}
            <motion.div
              variants={fadeInUp}
              className="lg:col-span-3 bg-white backdrop-blur-lg bg-opacity-80 p-8 rounded-2xl shadow-xl"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaPaperPlane className="mr-3 text-black" />
                Send Us a Message
              </h2>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg"
                >
                  <h3 className="font-semibold text-lg mb-2">Message Sent Successfully!</h3>
                  <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-black font-medium hover:text-gray-800"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                      required
                      aria-label="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                      required
                      aria-label="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                      rows="5"
                      required
                      aria-label="Message"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-black text-white py-3 px-6 rounded-lg hover:opacity-90 transition duration-300 shadow-lg flex items-center justify-center ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
            
            {/* Contact Info - Narrow */}
            <motion.div
              variants={fadeInUp}
              className="lg:col-span-2 bg-white backdrop-blur-lg bg-opacity-80 p-8 rounded-2xl shadow-xl"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-indigo-100 hover:bg-indigo-200 p-3 rounded-full mr-4">
                    <FaEnvelope className="text-black text-lg" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Email</h3>
                    <a
                      href="mailto:info@swinburne.edu.my"
                      className="text-gray-600 hover:text-black transition duration-200"
                    >
                      info@swinburne.edu.my
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 hover:bg-indigo-200 p-3 rounded-full mr-4">
                    <FaPhone className="text-black text-lg" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Phone</h3>
                    <a
                      href="tel:+6082415353"
                      className="text-gray-600 hover:text-black transition duration-200"
                    >
                      +60 82 415 353
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 hover:bg-indigo-200 p-3 rounded-full mr-4">
                    <FaMapMarkerAlt className="text-black text-lg" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Campus</h3>
                    <p className="text-gray-600">
                      Jalan Simpang Tiga<br />
                      93350 Kuching<br />
                      Sarawak, Malaysia
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="https://facebook.com/swinburnesarawak" className="bg-indigo-100 p-2 rounded-full text-black hover:bg-indigo-200 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/swinburnesarawak" className="bg-indigo-100 p-2 rounded-full text-black hover:bg-indigo-200 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com/school/swinburne-sarawak" className="bg-indigo-100 p-2 rounded-full text-black hover:bg-indigo-200 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white shadow-lg rounded-2xl overflow-hidden"
          >
            <h2 className="text-2xl font-bold text-gray-900 p-6 border-b border-gray-200">
              Find Us at Swinburne Sarawak
            </h2>
            <div className="h-96 relative">
              {/* Google Maps iFrame */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.3913259326637!2d110.35474397496598!3d1.5324458984532114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31fba70b11e02ce7%3A0x69cbf290cfd24bb7!2sSwinburne%20University%20of%20Technology%20Sarawak%20Campus!5e0!3m2!1sen!2smy!4v1743673669717!5m2!1sen!2smy" 
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Swinburne Sarawak Location"
                aria-label="Google Maps showing Swinburne Sarawak location">
              </iframe>
            </div>
            <div className="p-6 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-2">Directions</h3>
              <p className="text-gray-600">
                Located in Kuching, Sarawak, Swinburne University of Technology Sarawak Campus is easy to access via public transport or private vehicle. 
                The campus is approximately 15 minutes from Kuching International Airport.
              </p>
            </div>
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

export default Contact;