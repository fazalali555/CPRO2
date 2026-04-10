// SplashGate.tsx - Ultimate Premium Splash Experience
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, Variants } from 'framer-motion';
import { APP_NAME, APP_TAGLINE, DEVELOPER, APP_VERSION } from '../config/branding';
import { ProjectLogo } from './ProjectLogo';

// ============================================================================
// TYPES
// ============================================================================

interface LoadingStep {
  id: string;
  label: string;
  icon: string;
  duration: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOADING_STEPS: LoadingStep[] = [
  { id: 'init', label: 'Initializing Core', icon: 'memory', duration: 600 },
  { id: 'data', label: 'Loading Database', icon: 'database', duration: 800 },
  { id: 'ui', label: 'Preparing Interface', icon: 'dashboard', duration: 500 },
  { id: 'ready', label: 'Almost Ready', icon: 'rocket_launch', duration: 400 },
];

const TOTAL_DURATION = LOADING_STEPS.reduce((sum, step) => sum + step.duration, 0) + 800;

const PARTICLES_COUNT = 50;
const RINGS_COUNT = 4;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    scale: 1.1,
    filter: 'blur(20px)',
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
  }
};

const logoVariants: Variants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      delay: 0.3
    }
  }
};

const textRevealVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    rotateX: -15,
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      delay: 0.8,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// ============================================================================
// HOOKS
// ============================================================================

function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

function useTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return '🌙 Working Late?';
  if (hour < 12) return '☀️ Good Morning';
  if (hour < 17) return '🌤️ Good Afternoon';
  if (hour < 21) return '🌅 Good Evening';
  return '🌙 Good Night';
}

function useParticles(count: number): Particle[] {
  return useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1
    })),
  [count]);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const GlowingOrb = memo<{ className: string; delay?: number }>(({ className, delay = 0 }) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] will-change-transform ${className}`}
      animate={reducedMotion ? {} : {
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: 'easeInOut'
      }}
    />
  );
});
GlowingOrb.displayName = 'GlowingOrb';

const FloatingParticles = memo<{ particles: Particle[] }>(({ particles }) => {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, p.opacity, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

const ConcentricRings = memo(() => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: RINGS_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/10"
          style={{
            width: `${(i + 1) * 150}px`,
            height: `${(i + 1) * 150}px`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={reducedMotion ? { scale: 1, opacity: 0.3 } : {
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1],
            rotate: i % 2 === 0 ? [0, 360] : [360, 0],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
});
ConcentricRings.displayName = 'ConcentricRings';

const LogoWithGlow = memo<{ className?: string }>(({ className }) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={logoVariants}
      initial="hidden"
      animate="visible"
      className={`relative ${className}`}
    >
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/50 to-tertiary/50 blur-2xl"
        variants={pulseVariants}
        animate="animate"
      />
      
      {/* Rotating Border */}
      <motion.div
        className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary via-tertiary to-secondary"
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ padding: '2px' }}
      />
      
      {/* Logo Container */}
      <div className="relative bg-surface dark:bg-surface-dark p-5 rounded-3xl shadow-2xl">
        <ProjectLogo className="w-24 h-24 md:w-28 md:h-28 drop-shadow-xl" />
      </div>

      {/* Sparkles */}
      {!reducedMotion && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
});
LogoWithGlow.displayName = 'LogoWithGlow';

const TypewriterText = memo<{ text: string; delay?: number; className?: string }>(
  ({ text, delay = 0, className = '' }) => {
    const [displayText, setDisplayText] = useState('');
    const reducedMotion = useReducedMotion();

    useEffect(() => {
      if (reducedMotion) {
        setDisplayText(text);
        return;
      }

      let index = 0;
      const startDelay = setTimeout(() => {
        const interval = setInterval(() => {
          if (index <= text.length) {
            setDisplayText(text.slice(0, index));
            index++;
          } else {
            clearInterval(interval);
          }
        }, 50);

        return () => clearInterval(interval);
      }, delay * 1000);

      return () => clearTimeout(startDelay);
    }, [text, delay, reducedMotion]);

    return (
      <span className={className}>
        {displayText}
        {!reducedMotion && displayText.length < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle"
          />
        )}
      </span>
    );
  }
);
TypewriterText.displayName = 'TypewriterText';

const LoadingProgress = memo<{ 
  steps: LoadingStep[]; 
  currentStep: number; 
  progress: number;
}>(({ steps, currentStep, progress }) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full max-w-xs">
      {/* Progress Bar */}
      <div className="relative h-1.5 bg-surface-variant/30 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Shimmer Effect */}
        {!reducedMotion && (
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>

      {/* Current Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          <motion.span
            className="material-symbols-rounded text-primary text-lg"
            animate={reducedMotion ? {} : { rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {steps[currentStep]?.icon || 'pending'}
          </motion.span>
          <span className="text-xs font-medium text-on-surface-variant">
            {steps[currentStep]?.label || 'Loading...'}
          </span>
          <span className="text-xs font-mono text-on-surface-variant/60">
            {Math.round(progress)}%
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i <= currentStep 
                ? 'bg-primary' 
                : 'bg-surface-variant/40'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
});
LoadingProgress.displayName = 'LoadingProgress';

const DeveloperCard = memo<{ show: boolean }>(({ show }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const reducedMotion = useReducedMotion();

  if (!show) return null;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-sm perspective-1000"
    >
      {/* Card Glow */}
      <motion.div
        className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-tertiary/30 to-secondary/30 rounded-[2rem] blur-xl"
        animate={reducedMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Main Card */}
      <div className="relative bg-white/80 dark:bg-surface-container/80 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Decorative Header */}
        <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-tertiary relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
            animate={reducedMotion ? {} : { backgroundPosition: ['0px 0px', '20px 20px'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          {/* Wave Effect */}
          <svg
            className="absolute bottom-0 left-0 right-0"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,10 Q100,20 200,10 T400,10 L400,20 L0,20 Z"
              fill="currentColor"
              className="text-white dark:text-surface-container"
              animate={reducedMotion ? {} : {
                d: [
                  'M0,10 Q100,20 200,10 T400,10 L400,20 L0,20 Z',
                  'M0,10 Q100,0 200,10 T400,10 L400,20 L0,20 Z',
                  'M0,10 Q100,20 200,10 T400,10 L400,20 L0,20 Z',
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        {/* Avatar */}
        <div className="flex justify-center -mt-12 relative z-10">
          <motion.div
            className="relative"
            whileHover={reducedMotion ? {} : { scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Rotating Ring */}
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-tertiary to-secondary"
              animate={reducedMotion ? {} : { rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            
            <div className="relative w-24 h-24 rounded-full bg-surface p-1 shadow-xl">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-1 rounded-full bg-surface-container animate-pulse" />
              )}
              {imageError ? (
                <div className="w-full h-full rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-rounded text-3xl text-on-primary-container">person</span>
                </div>
              ) : (
                <img
                  src={DEVELOPER.image}
                  alt={DEVELOPER.name}
                  className={`w-full h-full rounded-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Verified Badge */}
            <motion.div
              className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full shadow-lg ring-2 ring-white dark:ring-surface-container"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: 'spring' }}
            >
              <span className="material-symbols-rounded text-white text-sm">verified</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1"
          >
            Crafted by
          </motion.p>
          
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="text-xl font-black text-on-surface mb-0.5"
          >
            {DEVELOPER.name}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-sm font-medium text-on-surface-variant"
          >
            {DEVELOPER.role}
          </motion.p>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-4 space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-variant/30 text-xs font-medium text-on-surface-variant">
              <span className="material-symbols-rounded text-sm text-primary">call</span>
              {DEVELOPER.contact}
            </div>
            <div className="block text-xs text-on-surface-variant/70">
              {DEVELOPER.email}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});
DeveloperCard.displayName = 'DeveloperCard';

const VersionBadge = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 }}
    className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container/50 backdrop-blur-md border border-outline-variant/20 text-xs font-mono text-on-surface-variant"
  >
    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    v{APP_VERSION}
  </motion.div>
));
VersionBadge.displayName = 'VersionBadge';

const Greeting = memo<{ greeting: string }>(({ greeting }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="absolute top-6 left-6 text-sm font-medium text-on-surface-variant/70"
  >
    {greeting}
  </motion.div>
));
Greeting.displayName = 'Greeting';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showDeveloperCard, setShowDeveloperCard] = useState(false);

  const reducedMotion = useReducedMotion();
  const greeting = useTimeGreeting();
  const particles = useParticles(PARTICLES_COUNT);

  // Loading sequence
  useEffect(() => {
    setIsInitialized(true);

    let elapsed = 0;
    let stepIndex = 0;

    // Start showing developer card after initial animation
    const cardTimer = setTimeout(() => setShowDeveloperCard(true), 800);

    // Progress simulation
    const interval = setInterval(() => {
      elapsed += 50;
      
      // Calculate current step based on elapsed time
      let stepTime = 0;
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        stepTime += LOADING_STEPS[i].duration;
        if (elapsed < stepTime) {
          stepIndex = i;
          break;
        }
        stepIndex = LOADING_STEPS.length - 1;
      }
      
      setCurrentStep(stepIndex);
      setProgress(Math.min((elapsed / TOTAL_DURATION) * 100, 100));

      if (elapsed >= TOTAL_DURATION) {
        clearInterval(interval);
        setTimeout(() => setShow(false), 300);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      clearTimeout(cardTimer);
    };
  }, []);

  if (!isInitialized) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9999] bg-surface dark:bg-surface-dark flex flex-col items-center justify-center p-6 overflow-hidden select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Gradient Orbs */}
              <GlowingOrb 
                className="w-[600px] h-[600px] bg-primary/20 -top-1/4 -left-1/4" 
                delay={0} 
              />
              <GlowingOrb 
                className="w-[500px] h-[500px] bg-tertiary/20 -bottom-1/4 -right-1/4" 
                delay={2} 
              />
              <GlowingOrb 
                className="w-[400px] h-[400px] bg-secondary/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
                delay={4} 
              />

              {/* Floating Particles */}
              <FloatingParticles particles={particles} />

              {/* Concentric Rings */}
              <ConcentricRings />

              {/* Noise Overlay */}
              <div 
                className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Version Badge */}
            <VersionBadge />

            {/* Greeting */}
            <Greeting greeting={greeting} />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
              {/* Logo Section */}
              <div className="flex flex-col items-center">
                <LogoWithGlow className="mb-6" />

                {/* App Name with Typewriter Effect */}
                <motion.h1
                  variants={textRevealVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                  className="text-3xl md:text-4xl font-black text-on-surface text-center tracking-tight"
                >
                  <TypewriterText text={APP_NAME} delay={0.6} />
                  <motion.span
                    className="inline-block ml-2"
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 2 }}
                  >
                    🚀
                  </motion.span>
                </motion.h1>

                {/* Tagline */}
                <motion.p
                  variants={textRevealVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.8}
                  className="text-on-surface-variant mt-3 text-sm md:text-base font-medium text-center max-w-xs"
                >
                  {APP_TAGLINE}
                </motion.p>
              </div>

              {/* Developer Card */}
              <DeveloperCard show={showDeveloperCard} />

              {/* Loading Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="w-full flex justify-center"
              >
                <LoadingProgress
                  steps={LOADING_STEPS}
                  currentStep={currentStep}
                  progress={progress}
                />
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-6 text-center"
            >
              <p className="text-[10px] text-on-surface-variant/50 font-medium">
                © {new Date().getFullYear()} {APP_NAME} • All Rights Reserved
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children with fade in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 0 : 1 }}
        transition={{ duration: 0.5, delay: show ? 0 : 0.3 }}
      >
        {children}
      </motion.div>

      {/* Material Symbols Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
};

export default memo(SplashGate);