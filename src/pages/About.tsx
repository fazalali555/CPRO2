// About.tsx - Professional Developer Portfolio About Page
import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback, 
  memo, 
  RefObject, 
  ReactNode 
} from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/M3';
import { ProjectLogo } from '../components/ProjectLogo';
import { APP_NAME, APP_TAGLINE, DEVELOPER, APP_VERSION } from '../config/branding';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
  gradient: string;
  hoverGradient: string;
  username?: string;
  followers?: string;
}

interface Skill {
  name: string;
  icon: string;
  level: number;
  color: string;
}

interface Service {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ============================================================================
// CONFIGURATION - UPDATE WITH YOUR ACTUAL LINKS
// ============================================================================

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'chat',
    url: `https://wa.me/${DEVELOPER.contact?.replace(/[^0-9]/g, '')}`,
    color: '#25D366',
    gradient: 'from-green-400 to-green-600',
    hoverGradient: 'from-green-500 to-green-700',
    username: DEVELOPER.contact,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://facebook.com/fazalali555', // Update with actual link
    color: '#1877F2',
    gradient: 'from-blue-500 to-blue-700',
    hoverGradient: 'from-blue-600 to-blue-800',
    username: '@fazalali555',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'music_note',
    url: 'https://tiktok.com/@fazalaliallai', // Update with actual link
    color: '#000000',
    gradient: 'from-gray-800 via-pink-500 to-cyan-400',
    hoverGradient: 'from-gray-900 via-pink-600 to-cyan-500',
    username: '@fazalaliallai',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'tag',
    url: 'https://x.com/fazalali555', // Update with actual link
    color: '#000000',
    gradient: 'from-gray-800 to-gray-900',
    hoverGradient: 'from-black to-gray-800',
    username: '@fazalali555',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'photo_camera',
    url: 'https://instagram.com/fazalali555', // Update with actual link
    color: '#E4405F',
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    hoverGradient: 'from-purple-600 via-pink-600 to-orange-500',
    username: '@fazalali555',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'work',
    url: 'https://linkedin.com/in/fazalali555', // Update with actual link
    color: '#0A66C2',
    gradient: 'from-blue-600 to-blue-800',
    hoverGradient: 'from-blue-700 to-blue-900',
    username: 'in/fazalali555',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'code',
    url: 'https://github.com/fazalali555', // Update with actual link
    color: '#181717',
    gradient: 'from-gray-700 to-gray-900',
    hoverGradient: 'from-gray-800 to-black',
    username: '@fazalali555',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'play_circle',
    url: 'https://youtube.com/@fazalali555', // Update with actual link
    color: '#FF0000',
    gradient: 'from-red-500 to-red-700',
    hoverGradient: 'from-red-600 to-red-800',
    username: '@fazalali555',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'send',
    url: 'https://t.me/fazalali555', // Update with actual link
    color: '#26A5E4',
    gradient: 'from-sky-400 to-blue-500',
    hoverGradient: 'from-sky-500 to-blue-600',
    username: '@fazalali555',
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'mail',
    url: `mailto:${DEVELOPER.email}`,
    color: '#EA4335',
    gradient: 'from-red-400 to-orange-500',
    hoverGradient: 'from-red-500 to-orange-600',
    username: DEVELOPER.email,
  },
];

const SKILLS: Skill[] = [
  { name: 'React / Next.js', icon: 'code', level: 95, color: 'from-cyan-400 to-blue-500' },
  { name: 'TypeScript', icon: 'data_object', level: 92, color: 'from-blue-400 to-blue-600' },
  { name: 'Node.js', icon: 'dns', level: 88, color: 'from-green-400 to-green-600' },
  { name: 'UI/UX Design', icon: 'palette', level: 90, color: 'from-purple-400 to-pink-500' },
  { name: 'Mobile Development', icon: 'smartphone', level: 85, color: 'from-orange-400 to-red-500' },
  { name: 'Database Design', icon: 'storage', level: 87, color: 'from-emerald-400 to-teal-500' },
];

const SERVICES: Service[] = [
  {
    icon: 'web',
    title: 'Web Development',
    description: 'Modern, responsive websites and web applications built with cutting-edge technologies.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: 'smartphone',
    title: 'Mobile Apps',
    description: 'Cross-platform mobile applications for iOS and Android using React Native.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: 'dashboard_customize',
    title: 'Custom Software',
    description: 'Tailored software solutions designed to meet your specific business needs.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: 'cloud',
    title: 'Cloud Solutions',
    description: 'Scalable cloud infrastructure and deployment strategies for optimal performance.',
    gradient: 'from-green-500 to-emerald-500',
  },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
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

function useIntersectionObserver<T extends HTMLElement>(
  options: { threshold?: number; triggerOnce?: boolean } = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.1, triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return [ref, isIntersecting];
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, isInstalling, install };
}

// ============================================================================
// ICON COMPONENT
// ============================================================================

const Icon = memo<{ name: string; size?: number; className?: string; filled?: boolean }>(
  ({ name, size = 24, className = '', filled = false }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      if (document.fonts) {
        document.fonts.ready.then(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    }, []);

    return (
      <span
        className={`material-symbols-rounded ${filled ? 'material-symbols-filled' : ''} ${className} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ fontSize: size }}
      >
        {name}
      </span>
    );
  }
);
Icon.displayName = 'Icon';

// ============================================================================
// BACKGROUND COMPONENTS
// ============================================================================

const AnimatedBackground = memo(() => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-surface via-surface to-primary/5 dark:from-surface-dark dark:via-surface-dark dark:to-primary/10">
      {/* Gradient Orbs */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"
        animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-tertiary/10 blur-[120px]"
        animate={reducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]"
        animate={reducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
});
AnimatedBackground.displayName = 'AnimatedBackground';

// ============================================================================
// CARD WRAPPER
// ============================================================================

const SectionCard = memo<{ children: ReactNode; className?: string; delay?: number }>(
  ({ children, className = '', delay = 0 }) => {
    const [ref, isVisible] = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
    const reducedMotion = useReducedMotion();

    return (
      <motion.section
        ref={ref}
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`relative bg-white/70 dark:bg-surface-container/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 ${className}`}
      >
        {children}
      </motion.section>
    );
  }
);
SectionCard.displayName = 'SectionCard';

// ============================================================================
// HERO SECTION
// ============================================================================

const HeroSection = memo(() => {
  const { canInstall, isInstalling, install } = usePWAInstall();
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0}>
      {/* Hero Background */}
      <div className="relative min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
        {/* Decorative Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-primary/5"
              style={{ width: i * 200, height: i * 200 }}
              animate={reducedMotion ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center text-center max-w-2xl"
        >
          {/* Logo */}
          <motion.div
            variants={scaleIn}
            className="relative mb-8"
          >
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-3xl blur-3xl"
              animate={reducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Rotating Border */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-3xl"
              animate={reducedMotion ? {} : { rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            
            <div className="relative bg-surface dark:bg-surface-dark p-6 rounded-3xl shadow-2xl">
              <ProjectLogo className="w-24 h-24 md:w-32 md:h-32" />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-black text-on-surface tracking-tight mb-4"
          >
            {APP_NAME}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-on-surface-variant font-medium mb-6 max-w-lg"
          >
            {APP_TAGLINE}
          </motion.p>

          {/* Version Badge */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface-container/80 border border-outline-variant/20 shadow-lg"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold text-on-surface">Version {APP_VERSION}</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
              STABLE
            </span>
          </motion.div>

          {/* Install Button */}
          {canInstall && (
            <motion.div variants={fadeInUp} className="mt-8">
              <motion.button
                onClick={install}
                disabled={isInstalling}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-on-primary font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all disabled:opacity-70"
              >
                <Icon name={isInstalling ? 'progress_activity' : 'download'} size={24} className={isInstalling ? 'animate-spin' : ''} />
                {isInstalling ? 'Installing...' : 'Install App'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </SectionCard>
  );
});
HeroSection.displayName = 'HeroSection';

// ============================================================================
// DEVELOPER PROFILE SECTION
// ============================================================================

const DeveloperSection = memo(() => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.1}>
      {/* Header Background */}
      <div className="relative h-48 md:h-56 bg-gradient-to-r from-primary via-primary/90 to-tertiary overflow-hidden">
        {/* Animated Pattern */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '30px 30px',
          }}
          animate={reducedMotion ? {} : { backgroundPosition: ['0px 0px', '30px 30px'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating Shapes */}
        {!reducedMotion && (
          <>
            <motion.div
              className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10"
              animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-10 right-10 w-16 h-16 rounded-xl bg-white/10"
              animate={{ y: [0, 20, 0], rotate: [0, -180, -360] }}
              transition={{ duration: 12, repeat: Infinity }}
            />
          </>
        )}
      </div>

      <div ref={ref} className="px-6 md:px-12 pb-12">
        {/* Avatar */}
        <motion.div
          className="relative -mt-24 mb-8 flex justify-center"
          initial={{ scale: 0, rotate: -15 }}
          animate={isVisible ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <div className="relative group cursor-pointer">
            {/* Animated Ring */}
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full"
              animate={reducedMotion ? {} : { rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Inner Glow */}
            <motion.div
              className="absolute -inset-4 bg-primary/30 rounded-full blur-xl"
              animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-surface p-1.5 shadow-2xl ring-4 ring-white/50 dark:ring-black/20 group-hover:scale-105 transition-transform duration-300">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-1.5 rounded-full bg-surface-container animate-pulse" />
              )}
              {imageError ? (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center">
                  <Icon name="person" size={64} className="text-white" />
                </div>
              ) : (
                <img
                  src={DEVELOPER.image}
                  alt={DEVELOPER.name}
                  className={`w-full h-full rounded-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Verified Badge */}
            <motion.div
              className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-full shadow-xl ring-4 ring-surface"
              initial={{ scale: 0 }}
              animate={isVisible ? { scale: 1 } : {}}
              transition={{ delay: 0.5, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Icon name="verified" size={24} className="text-white" filled />
            </motion.div>

            {/* Online Status */}
            <motion.div
              className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500 shadow-lg ring-2 ring-surface"
              initial={{ scale: 0 }}
              animate={isVisible ? { scale: 1 } : {}}
              transition={{ delay: 0.6, type: 'spring' }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold text-white">Available</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Developer Info */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-black text-on-surface mb-2">
            {DEVELOPER.name}
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-lg font-bold text-primary mb-4">
            {DEVELOPER.role}
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-8 text-base md:text-lg"
          >
            Passionate Full-Stack Developer with expertise in building modern, scalable applications. 
            Dedicated to crafting exceptional digital experiences that combine beautiful design with 
            powerful functionality. Let's turn your ideas into reality.
          </motion.p>

          {/* Quick Contact Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-10">
            <motion.a
              href={`tel:${DEVELOPER.contact?.replace(/[^0-9+]/g, '')}`}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all"
            >
              <Icon name="call" size={22} />
              <span>Call Now</span>
            </motion.a>

            <motion.a
              href={`mailto:${DEVELOPER.email}`}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all"
            >
              <Icon name="mail" size={22} />
              <span>Send Email</span>
            </motion.a>

            <motion.a
              href={`https://wa.me/${DEVELOPER.contact?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-green-600 text-white font-bold shadow-lg shadow-green-400/30 hover:shadow-xl hover:shadow-green-400/40 transition-all"
            >
              <Icon name="chat" size={22} />
              <span>WhatsApp</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </SectionCard>
  );
});
DeveloperSection.displayName = 'DeveloperSection';

// ============================================================================
// SOCIAL MEDIA SECTION
// ============================================================================

const SocialMediaSection = memo(() => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.2} className="p-8 md:p-12">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-tertiary/20 mb-6">
            <Icon name="share" size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface mb-3">Connect With Me</h2>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Follow me on social media for updates, tips, and behind-the-scenes content
          </p>
        </motion.div>

        {/* Social Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {SOCIAL_PLATFORMS.map((platform, index) => (
            <motion.a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={scaleIn}
              whileHover={reducedMotion ? {} : { scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br ${platform.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={reducedMotion ? {} : { translateX: ['100%', '-100%'] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
              />

              {/* Icon */}
              <div className="relative z-10 mb-3 p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Icon name={platform.icon} size={28} />
              </div>

              {/* Platform Name */}
              <span className="relative z-10 font-bold text-sm">{platform.name}</span>

              {/* Username */}
              {platform.username && (
                <span className="relative z-10 text-xs opacity-80 mt-1 truncate max-w-full px-2">
                  {platform.username}
                </span>
              )}

              {/* Hover Arrow */}
              <motion.div
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <Icon name="arrow_outward" size={16} />
              </motion.div>
            </motion.a>
          ))}
        </div>

        {/* Follow CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-10">
          <p className="text-sm text-on-surface-variant mb-4">
            💡 <strong>Tip:</strong> Follow on multiple platforms to never miss an update!
          </p>
        </motion.div>
      </motion.div>
    </SectionCard>
  );
});
SocialMediaSection.displayName = 'SocialMediaSection';

// ============================================================================
// SKILLS SECTION
// ============================================================================

const SkillsSection = memo(() => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.2 });
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.25} className="p-8 md:p-12">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
            <Icon name="psychology" size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface mb-3">Technical Expertise</h2>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Technologies and tools I use to bring ideas to life
          </p>
        </motion.div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {SKILLS.map((skill, index) => (
            <motion.div
              key={skill.name}
              variants={fadeInUp}
              className="group relative p-6 rounded-2xl bg-surface-container/50 hover:bg-surface-container/80 border border-outline-variant/10 hover:border-outline-variant/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${skill.color} shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon name={skill.icon} size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface">{skill.name}</h4>
                  <span className="text-sm text-on-surface-variant">{skill.level}% Proficiency</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-surface-variant/50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${skill.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={isVisible ? { width: `${skill.level}%` } : {}}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionCard>
  );
});
SkillsSection.displayName = 'SkillsSection';

// ============================================================================
// SERVICES SECTION
// ============================================================================

const ServicesSection = memo(() => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.3} className="p-8 md:p-12">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-6">
            <Icon name="design_services" size={32} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface mb-3">Services Offered</h2>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Professional solutions tailored to your needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              variants={fadeInUp}
              whileHover={reducedMotion ? {} : { scale: 1.02, y: -5 }}
              className="group relative p-8 rounded-3xl bg-surface-container/50 hover:bg-surface-container/80 border border-outline-variant/10 hover:border-outline-variant/20 transition-all duration-300 overflow-hidden"
            >
              {/* Background Gradient */}
              <motion.div
                className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon name={service.icon} size={28} className="text-white" />
                </div>

                <h4 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h4>

                <p className="text-on-surface-variant leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-10">
          <motion.a
            href={`mailto:${DEVELOPER.email}?subject=Project Inquiry`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-tertiary text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
          >
            <Icon name="rocket_launch" size={24} />
            <span>Start a Project</span>
          </motion.a>
        </motion.div>
      </motion.div>
    </SectionCard>
  );
});
ServicesSection.displayName = 'ServicesSection';

// ============================================================================
// CONTACT CTA SECTION
// ============================================================================

const ContactCTASection = memo(() => {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.2 });
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.35}>
      <div
        ref={ref}
        className="relative p-10 md:p-16 bg-gradient-to-br from-primary via-primary to-tertiary text-white overflow-hidden"
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
          animate={reducedMotion ? {} : { backgroundPosition: ['0px 0px', '40px 40px'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating Elements */}
        {!reducedMotion && (
          <>
            <motion.div
              className="absolute top-10 left-10 text-6xl"
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              💬
            </motion.div>
            <motion.div
              className="absolute bottom-10 right-10 text-6xl"
              animate={{ y: [0, 20, 0], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              🚀
            </motion.div>
          </>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-black mb-6">
            Let's Build Something Amazing Together!
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-lg text-white/90 mb-10">
            Have a project in mind? I'd love to hear about it. Let's discuss how we can work together to bring your vision to life.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <motion.a
              href={`mailto:${DEVELOPER.email}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-primary font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Icon name="mail" size={24} />
              <span>Get In Touch</span>
            </motion.a>

            <motion.a
              href={`https://wa.me/${DEVELOPER.contact?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-lg border-2 border-white/30 hover:bg-white/30 transition-all"
            >
              <Icon name="chat" size={24} />
              <span>WhatsApp Me</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </SectionCard>
  );
});
ContactCTASection.displayName = 'ContactCTASection';

// ============================================================================
// FOOTER SECTION
// ============================================================================

const FooterSection = memo(() => {
  const reducedMotion = useReducedMotion();

  return (
    <SectionCard delay={0.4} className="p-8 text-center bg-gradient-to-b from-transparent to-primary/5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 mb-6 shadow-lg"
      >
        <motion.span
          className="text-3xl"
          animate={reducedMotion ? {} : { scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ❤️
        </motion.span>
      </motion.div>

      <h4 className="text-xl font-black text-on-surface mb-2">
        Thank You for Visiting!
      </h4>
      <p className="text-base font-medium text-on-surface-variant mb-8">
        Made with love by {DEVELOPER.name}
      </p>

      {/* Mini Social Links */}
      <div className="flex justify-center gap-3 mb-8">
        {SOCIAL_PLATFORMS.slice(0, 6).map((platform) => (
          <motion.a
            key={platform.id}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, y: -3 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all`}
          >
            <Icon name={platform.icon} size={18} />
          </motion.a>
        ))}
      </div>

      <footer className="pt-6 border-t border-outline-variant/20">
        <p className="text-sm text-on-surface-variant/80 flex items-center justify-center gap-2 font-medium">
          <Icon name="copyright" size={16} />
          {new Date().getFullYear()} {APP_NAME}. All Rights Reserved.
        </p>
        <p className="text-xs text-on-surface-variant/50 mt-3">
          Built with React, TypeScript, Framer Motion & Material Design 3
        </p>
      </footer>
    </SectionCard>
  );
});
FooterSection.displayName = 'FooterSection';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const About: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="max-w-5xl mx-auto pb-32 px-4 sm:px-6">
      <AnimatedBackground />

      <PageHeader
        title="About"
        subtitle="Developer Profile & Application Info"
        action={
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="text" label="Back" icon="arrow_back" onClick={handleBack} />
          </motion.div>
        }
      />

      <main className="mt-8 space-y-8">
        <HeroSection />
        <DeveloperSection />
        <SocialMediaSection />
        <SkillsSection />
        <ServicesSection />
        <ContactCTASection />
        <FooterSection />
      </main>

      {/* Font Loader */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
    </div>
  );
};

export default memo(About);