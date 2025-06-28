'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] overflow-hidden relative">
      {/* Animated background elements */}
      {isMounted && (
        <>
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 2
            }}
          />
        </>
      )}

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Premium badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center mb-6 px-4 py-1.5 rounded-full bg-blue-900/20 backdrop-blur-sm border border-blue-700/30"
            >
              <span className="text-sm font-medium text-blue-400">AI-POWERED HOTEL MANAGEMENT</span>
            </motion.div>
            
            {/* Main headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
            >
              Welcome to <span className="text-blue-500">NexStay</span>
            </motion.h1>
            
            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the future of hotel management with our AI-powered platform featuring facial recognition for seamless guest experiences.
            </motion.p>
            
            {/* Action buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/login">
                <Button 
                  className="px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  variant="outline"
                  className="px-8 py-4 text-lg font-medium rounded-xl border border-blue-500/30 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all transform hover:scale-105"
                >
                  Create Account
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Feature showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-b from-gray-800/30 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <div className="text-blue-400">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white ml-4">{feature.title}</h3>
                </div>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Visual element (replaces the placeholder box) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 right-8 md:bottom-16 md:right-16 w-24 h-24 md:w-36 md:h-36 rounded-xl overflow-hidden border-2 border-white/10 shadow-xl"
      >
        {/* Modern visual element instead of placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-600/30 flex items-center justify-center">
          <div className="relative">
            {/* Hotel building icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m4 4v-4" />
            </svg>
            
            {/* Shining star effect */}
            <motion.div 
              className="absolute -top-2 -right-2 text-yellow-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Feature data
const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Facial Recognition",
    description: "Seamless check-in with advanced facial recognition technology"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Smart Management",
    description: "AI-powered tools for efficient hotel operations"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Real-time Analytics",
    description: "Data-driven insights for better decision making"
  }
];