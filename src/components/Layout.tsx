
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { AppIcon } from './AppIcon';
import { ProjectLogo } from './ProjectLogo';
import { APP_NAME } from '../config/branding';
import { useLanguage } from '../contexts/LanguageContext';
import { securityService } from '../services/SecurityService';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, setDarkMode }) => {
  const { t, language, setLanguage, isUrdu } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const location = useLocation();

  const navItems = [
    { icon: 'dashboard', label: t.common.dashboard, path: '/' },
    { icon: 'assignment', label: 'Clerk Desk', path: '/clerk-desk' },
    { icon: 'groups', label: t.common.employees, path: '/employees' },
    { icon: 'cases', label: t.common.cases, path: '/cases' },
    { icon: 'payments', label: t.common.pension, path: '/pension' },
    { icon: 'account_balance', label: t.common.budgeting, path: '/budgeting' },
    { icon: 'gavel', label: t.common.legalAudit, path: '/legal-audit' },
    { icon: 'admin_panel_settings', label: t.common.admin, path: '/admin' },
    { icon: 'calendar_today', label: t.common.calendar, path: '/calendar' },
    { icon: 'folder_shared', label: t.common.sharing, path: '/sharing' },
  ];

  const role = securityService.getCurrentUser()?.role || 'viewer';
  const roleAccess: Record<string, string[]> = {
    admin: ['/', '/clerk-desk', '/employees', '/cases', '/pension', '/budgeting', '/legal-audit', '/admin', '/calendar', '/sharing', '/settings', '/about'],
    clerk: ['/', '/clerk-desk', '/employees', '/cases', '/pension', '/budgeting', '/legal-audit', '/admin', '/calendar', '/sharing'],
    viewer: ['/', '/cases', '/calendar', '/sharing', '/about']
  };
  const isAllowed = (path: string) => (roleAccess[role] || []).some(p => path === p || (p !== '/' && path.startsWith(p)));
  const filteredNavItems = navItems.filter(i => isAllowed(i.path));
  const mobileNavItems = filteredNavItems.slice(0, 5);

  // Close mobile menu on route change
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  // Install Prompt Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setMobileMenuOpen(false);
  };

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <div className={clsx("min-h-screen bg-background text-on-background font-sans flex transition-colors duration-500", darkMode ? "dark" : "")}>
      
      {/* --- DESKTOP NAVIGATION RAIL --- */}
      <nav 
        className={clsx(
          "hidden lg:flex flex-col fixed inset-y-0 z-50 bg-surface-container-low/80 backdrop-blur-xl border-outline-variant transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
          isUrdu ? "right-0 border-l" : "left-0 border-r",
          drawerOpen ? "w-[300px]" : "w-[88px]"
        )}
      >
        <div className="h-16 flex items-center px-4 gap-3">
          <button onClick={toggleDrawer} className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors">
            <AppIcon name="menu" />
          </button>
          {drawerOpen && (
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col overflow-hidden whitespace-nowrap">
               <span className="font-bold text-lg leading-tight text-primary font-official">{APP_NAME}</span>
               <span className="text-[10px] text-outline uppercase tracking-wider">Education Dept</span>
             </motion.div>
          )}
        </div>

        <div className="px-3 py-4">
           {drawerOpen ? (
             <Link to="/cases/new" className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary-container text-on-primary-container hover:shadow-elevation-1 transition-all">
               <AppIcon name="edit_document" />
               <span className="font-medium">New Case</span>
             </Link>
           ) : (
             <Link to="/cases/new" className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container hover:shadow-elevation-1 transition-all mx-auto" title="New Case">
               <AppIcon name="edit_document" />
             </Link>
           )}
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!drawerOpen ? item.label : ''}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-full transition-all group relative",
                  isActive 
                    ? "bg-secondary-container text-on-secondary-container font-bold" 
                    : "text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface"
                )}
              >
                <AppIcon name={item.icon} filled={isActive} />
                {drawerOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 mt-auto border-t border-outline-variant/30">
          {deferredPrompt && (
             <button onClick={handleInstall} className={clsx("flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-primary/10 mb-2 text-primary font-bold w-full", !drawerOpen && "justify-center")}>
                <AppIcon name="download" size={20} />
                {drawerOpen && <span className="text-sm">Install App</span>}
             </button>
          )}
          
          <Link to="/settings" className={clsx("flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-on-surface/5 mb-2 text-on-surface-variant", !drawerOpen && "justify-center")}>
             <AppIcon name="settings" size={20} />
             {drawerOpen && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <div className={clsx("flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-on-surface/5", !drawerOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-xs">
              FA
            </div>
            {drawerOpen && (
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-on-surface truncate">Fazal Ali</p>
                <p className="text-xs text-on-surface-variant truncate">Junior Clerk</p>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className={clsx(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]", 
        drawerOpen 
          ? (isUrdu ? "lg:mr-[300px]" : "lg:ml-[300px]") 
          : (isUrdu ? "lg:mr-[88px]" : "lg:ml-[88px]")
      )}>
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant/30 no-print">
          <div className="lg:hidden flex items-center gap-3">
            <ProjectLogo className="w-10 h-10" />
            <span className="font-bold text-on-surface font-official text-sm">{APP_NAME}</span>
          </div>

          <div className="hidden lg:block">
            <span className="text-title-medium font-medium text-on-surface font-official">Government of Khyber Pakhtunkhwa</span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="px-3 py-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all font-bold text-sm flex items-center gap-2"
              title="Switch Language"
            >
              <AppIcon name="language" size={20} />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-transform active:rotate-90"
              title="Toggle Theme"
            >
              <AppIcon name={darkMode ? 'light_mode' : 'dark_mode'} />
            </button>
            <Link to="/about" className="hidden lg:block p-2 rounded-full hover:bg-surface-variant text-on-surface-variant" title="About">
              <AppIcon name="info" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-28 lg:pb-8">
           {isAllowed(location.pathname) ? children : (
             <div className="max-w-xl mx-auto p-8 bg-surface rounded-2xl border border-outline-variant text-center">
               <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                 <AppIcon name="lock" />
               </div>
               <h2 className="text-xl font-bold text-on-surface">Access Restricted</h2>
               <p className="text-sm text-on-surface-variant mt-2">Your role does not have permission to access this module.</p>
               <div className="mt-4 text-xs text-on-surface-variant uppercase">Role: {role}</div>
             </div>
           )}
        </main>
      </div>

      {/* --- MOBILE BOTTOM BAR --- */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-20 bg-surface-container border-t border-outline-variant/30 z-50 pb-safe no-print">
        <div className="flex items-center justify-around h-full px-2">
          {mobileNavItems.map((item) => {
             const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center w-full py-1 gap-1 group active:scale-95 transition-transform"
              >
                <div className={clsx(
                  "px-4 py-1 rounded-full transition-colors duration-300",
                  isActive ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant group-hover:bg-on-surface/5"
                )}>
                  <AppIcon name={item.icon} filled={isActive} size={24} />
                </div>
                <span className={clsx("text-[10px] font-medium transition-colors", isActive ? "text-on-surface" : "text-on-surface-variant")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full py-1 gap-1 group active:scale-95 transition-transform"
          >
            <div className={clsx("px-4 py-1 rounded-full text-on-surface-variant", mobileMenuOpen && "bg-surface-variant")}>
              <AppIcon name="menu" size={24} />
            </div>
            <span className="text-[10px] font-medium text-on-surface-variant">More</span>
          </button>
        </div>
      </nav>

      {/* --- MOBILE MORE SHEET --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm" 
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container-low rounded-t-3xl z-[70] lg:hidden pb-safe overflow-hidden shadow-elevation-4"
            >
              <div className="flex justify-center p-4">
                <div className="w-12 h-1 bg-outline-variant/50 rounded-full" />
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 pb-8">
                 {/* Install Button if available */}
                 {deferredPrompt && (
                   <button 
                     onClick={handleInstall}
                     className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-variant/30 active:bg-surface-variant/50 transition-colors"
                   >
                     <div className="p-3 bg-primary text-on-primary rounded-full shadow-lg">
                       <AppIcon name="download" size={24} />
                     </div>
                     <span className="text-xs font-bold text-primary">Install App</span>
                   </button>
                 )}

                 {filteredNavItems.slice(4).concat([
                   { icon: 'settings', label: 'Settings', path: '/settings' },
                   { icon: 'info', label: 'About', path: '/about' },
                   { icon: 'logout', label: 'Logout', path: '/login' },
                 ]).map((item) => (
                   <Link 
                     key={item.label} 
                     to={item.path} 
                     className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-variant/30 active:bg-surface-variant/50 transition-colors"
                   >
                     <div className="p-3 bg-secondary-container text-on-secondary-container rounded-full">
                       <AppIcon name={item.icon} size={24} />
                     </div>
                     <span className="text-xs font-medium text-on-surface">{item.label}</span>
                   </Link>
                 ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
