import React, { useState, useEffect } from 'react';
import { LargeRocket } from './Rocket';
import { Shield, Lock, Fingerprint, Mail, User, ArrowRight, Box, Key, Hash, Monitor } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const AuthPage = ({ onLogin }) => {
  const { login, register } = useAuth();
  
  // view: 'login' | 'register' | 'verify_email' | 'forgot_password' | 'verify_reset_otp' | 'reset_password'
  const [view, setView] = useState('login');
  
  const [isFlying, setIsFlying] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Dropdown options
  const securityQuestions = [
    "What is your favorite teacher's name?",
    "What is your childhood nickname?",
    "What was your first school?",
    "What is your favorite place?"
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlying(false);
      setShowForm(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password.trim()) { setError('Please enter username and password.'); return; }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          device_info: navigator.userAgent
        })
      });
      const data = await response.json();
      if (response.ok) {
        const userObj = { ...data.user, session_token: data.session_token };
        if (login) login(userObj);
        onLogin();
      } else {
        if (data.needs_verification) {
          setError('Email verification required before login.');
          setView('verify_email');
          setSuccess('Enter the 6-digit OTP sent to your registered email address.');
        } else {
          setError(data.error || 'Login failed.');
        }
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username || !email || !password) {
      setError('Username, email, and password are required.'); return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          security_question: securityQuestion || securityQuestions[0], 
          security_answer: securityAnswer || 'None' 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setView('verify_email');
        setOtp('');
        setSuccess('Account created! A 6-digit verification code has been dispatched to your email.');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otp.trim()) { setError('Please enter the 6-digit OTP code.'); return; }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp: otp.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setView('login');
        setSuccess('Email verified successfully! You can now log into your node.');
        setOtp('');
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    if (!username.trim() && !email.trim()) {
      setError('Enter username or email to resend OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('A fresh 6-digit verification code has been sent to your email.');
      } else {
        setError(data.error || 'Failed to resend verification.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() && !username.trim()) { setError('Please enter your email or username.'); return; }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: username.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setMaskedEmail(data.masked_email || email || 'registered email');
        setView('verify_reset_otp');
        setSuccess('If an account exists, a 6-digit reset code has been sent.');
      } else {
        setError(data.error || 'Request failed.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otp.trim()) { setError('Please enter the 6-digit reset code.'); return; }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, otp: otp.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setResetToken(data.reset_token);
        setView('reset_password');
        setSuccess('Code verified! Enter your new password below.');
      } else {
        setError(data.error || 'Invalid or expired reset code.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirmPassword) { setError('Please enter and confirm your new password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          username, 
          otp: otp.trim(),
          reset_token: resetToken, 
          new_password: password,
          confirm_password: confirmPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setView('login');
        setSuccess('Password updated successfully using Argon2id! All existing sessions invalidated. Please login.');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <LargeRocket isFlying={isFlying} />

      <div className="auth-visual-frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 'calc(50% - 240px)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/holographic_earth.png" alt="Holographic Earth" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform: 'scale(1.2)', opacity: 0.7, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.6))' }} />
        </div>
        <div style={{ width: 'calc(50% - 240px)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/quantum_cubes.png" alt="Quantum Cubes" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform: 'scale(1.2)', opacity: 0.7, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))' }} />
        </div>
      </div>

      <div className={`auth-form-wrapper ${showForm ? 'visible' : 'hidden'}`}>
        <div className="glass-card auth-card neon-container-blue">
          <div className="auth-header">
            <Lock size={40} color="#3b82f6" />
            <h2>
              {view === 'login' && 'Secure Gateway'}
              {view === 'register' && 'Initialize Node'}
              {view === 'verify_email' && 'Verify Email OTP'}
              {view === 'forgot_password' && 'Password Recovery'}
              {view === 'verify_reset_otp' && 'Verify Reset Code'}
              {view === 'reset_password' && 'Create New Password'}
            </h2>
          </div>

          <form className="auth-form" onSubmit={
            view === 'login' ? handleLogin :
            view === 'register' ? handleRegister :
            view === 'verify_email' ? handleVerifyEmail :
            view === 'forgot_password' ? handleForgotPassword :
            view === 'verify_reset_otp' ? handleVerifyResetOtp :
            handleResetPassword
          }>
            
            {(view === 'login' || view === 'register' || view === 'verify_email') && (
              <div className="input-group">
                <User size={20} color="#94a3b8" />
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
            )}

            {(view === 'register' || view === 'forgot_password') && (
              <div className="input-group">
                <Mail size={20} color="#94a3b8" />
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required={view === 'register'} />
              </div>
            )}

            {(view === 'verify_email' || view === 'verify_reset_otp') && (
              <div>
                {maskedEmail && (
                  <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
                    OTP sent to: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{maskedEmail}</span>
                  </p>
                )}
                <div className="input-group">
                  <Hash size={20} color="#3b82f6" />
                  <input 
                    type="text" 
                    placeholder="6-Digit OTP Code" 
                    maxLength={6} 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                    required 
                  />
                </div>
                <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', marginTop: '6px', marginBottom: '4px' }}>
                  Please check your email inbox (and spam folder) for the 6-digit code.
                </p>
              </div>
            )}

            {(view === 'login' || view === 'register') && (
              <div className="input-group">
                <Lock size={20} color="#94a3b8" />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            )}

            {view === 'reset_password' && (
              <>
                <div className="input-group">
                  <Lock size={20} color="#3b82f6" />
                  <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="input-group">
                  <Lock size={20} color="#3b82f6" />
                  <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </>
            )}

            {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
            {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

            <button type="submit" className="neon-button auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (
                view === 'login' ? 'Establish Connection' : 
                view === 'register' ? 'Generate Keys & Join' : 
                view === 'verify_email' ? 'Verify OTP & Activate' :
                view === 'forgot_password' ? 'Send Recovery Code' :
                view === 'verify_reset_otp' ? 'Validate Reset OTP' : 'Set New Password'
              )} 
              <ArrowRight size={20} />
            </button>

            {view === 'verify_email' && (
              <button 
                type="button" 
                onClick={handleResendVerification} 
                disabled={loading}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}
              >
                Resend Verification OTP
              </button>
            )}
          </form>

          <div className="auth-toggle">
            {view === 'login' && (
              <>
                <p style={{ marginTop: '14px' }}>New to the network? <span onClick={() => { setView('register'); setError(''); setSuccess(''); }}>Initialize Node</span></p>
                <p style={{ marginTop: '8px' }}><span onClick={() => { setView('forgot_password'); setError(''); setSuccess(''); }}>Forgot Password?</span></p>
              </>
            )}
            {view !== 'login' && (
              <p>Back to <span onClick={() => { setView('login'); setError(''); setSuccess(''); }}>Secure Gateway</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
