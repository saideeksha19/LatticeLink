import React, { useState, useEffect } from 'react';
import { GlobalProvider } from './context/GlobalProvider';
import { useAuth } from './context/AuthContext';
import GlobalBackground from './components/GlobalBackground';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import Navbar from './Navbar';
import MessagesPage from './MessagesPage';
import SettingsPage from './SettingsPage';
import SecurityLab from './SecurityLab';
import KeyManagementCenter from './KeyManagementCenter';
import NetworkMonitor from './NetworkMonitor';
import SecurityAnalytics from './SecurityAnalytics';
import AuditCenter from './AuditCenter';
import EnterpriseAdminCenter from './EnterpriseAdminCenter';
import VaultPage from './VaultPage';
import CrossPlatformCenter from './CrossPlatformCenter';
import QuantumIdentityPage from './QuantumIdentityPage';
import Documentation from './Documentation';

const AppInner = () => {
  const [currentPage, setCurrentPage] = useState('auth');
  const { currentUser } = useAuth();

  const APP_PAGES = currentUser?.role === 'ADMIN' 
    ? ['messages', 'files', 'crossplatform', 'lab', 'keymanagement', 'network', 'analytics', 'audit', 'admin', 'howitworks', 'settings', 'identity']
    : ['messages', 'files', 'crossplatform', 'howitworks', 'settings', 'identity', 'keymanagement'];

  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    
    if (!currentUser) {
      if (path === 'auth') {
        setCurrentPage('auth');
      } else {
        setCurrentPage('home');
      }
    } else {
      const activePath = path || 'messages';
      if (APP_PAGES.includes(activePath)) {
        setCurrentPage(activePath);
      } else {
        setCurrentPage('messages'); 
      }
    }
  }, [currentUser]);

  const navigate = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/${page}`);
  };

  if (!currentUser) {
    return (
      <GlobalBackground>
        <div className="app-container relative w-full min-h-screen">
          {currentPage === 'home' && <HomePage onNavigate={navigate} />}
          {currentPage === 'auth' && <AuthPage onLogin={() => navigate('messages')} />}
        </div>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <div className="container relative">
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
          
          <Navbar currentPage={currentPage} onNavigate={navigate} />
          
          <div className="app-main-content" style={{ marginLeft: '260px', width: 'calc(100% - 260px)', height: '100vh', overflowY: 'auto' }}>
            {currentPage === 'messages' && <MessagesPage />}
            {currentPage === 'files' && <VaultPage />}
            {currentPage === 'crossplatform' && <CrossPlatformCenter />}
            
            {currentPage === 'lab' && <SecurityLab />}
            {currentPage === 'keymanagement' && <KeyManagementCenter />}
            {currentPage === 'network' && currentUser?.role === 'ADMIN' && <NetworkMonitor />}
            {currentPage === 'analytics' && currentUser?.role === 'ADMIN' && <SecurityAnalytics />}
            {currentPage === 'audit' && currentUser?.role === 'ADMIN' && <AuditCenter />}
            {currentPage === 'admin' && currentUser?.role === 'ADMIN' && <EnterpriseAdminCenter />}
            
            {currentPage === 'settings' && <SettingsPage />}
            {currentPage === 'identity' && <QuantumIdentityPage />}
            {currentPage === 'howitworks' && <Documentation onNavigate={navigate} />}
          </div>
        </div>
      </div>
    </GlobalBackground>
  );
};

const App = () => (
  <GlobalProvider>
    <AppInner />
  </GlobalProvider>
);

export default App;
