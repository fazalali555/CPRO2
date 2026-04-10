import React from 'react';
import { Card, Button, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { Link } from 'react-router-dom';
import { ProjectLogo } from '../components/ProjectLogo';
import { APP_NAME } from '../config/branding';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-container flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="elevated" className="p-10 bg-surface/80 backdrop-blur-2xl border border-outline-variant/30 shadow-elevation-5 rounded-[40px]">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-8"
            >
              <div className="p-4 bg-primary/5 rounded-3xl relative">
                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl animate-pulse" />
                <ProjectLogo className="w-20 h-20 relative z-10" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-on-surface font-official tracking-tight"
            >
              Welcome Back
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-on-surface-variant mt-2 font-medium"
            >
              Sign in to <span className="text-primary">{APP_NAME}</span>
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <TextField label="Username" icon="person" className="rounded-2xl" />
            <TextField label="Password" type="password" icon="lock" className="rounded-2xl" />
            
            <div className="flex justify-end">
               <Link to="#" className="text-sm text-primary font-bold hover:underline tracking-tight">Forgot Password?</Link>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Link to="/">
                 <Button variant="filled" label="Sign In" className="w-full h-14 text-lg rounded-2xl shadow-elevation-2" />
              </Link>
            </motion.div>
            
            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-outline-variant/30" />
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Government of KPK</span>
              <div className="h-px flex-1 bg-outline-variant/30" />
            </div>

            <p className="text-center text-[10px] text-on-surface-variant/60 leading-relaxed uppercase tracking-wider font-medium">
              Authorized Personnel Only<br/>
              Operations Hub v2.0 • Secure Access
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};
