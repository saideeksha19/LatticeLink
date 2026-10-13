import React, { useState, useEffect } from 'react';
import { LargeRocket } from './Rocket';
import { Shield, Lock, Mail, User, ArrowRight, Key, Hash, ChevronLeft } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const AuthPage = ({ onLogin }) => {
  const { login } = useAuth();
  
  // view: 'login' | 'register' | 'verify_email' | 'forgot_password' | 'verify_reset_otp' | 'reset_password'
  const [view, setView] = useState('login');
  
  const [isFlying, setIsFlying] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Stepped Registration State:
  // Step 1: Username
  // Step 2: Email Address (OTP Request)
  // Step 3: Enter & Verify 6-Digit Email OTP
  // Step 4: Create Password (min 8 chars)
  // Step 5: Create 6-Digit Security PIN
  // Step 6: Recovery Question + Answer -> Account Created
  const [regStep, setRegStep] = useState(1);
  const verificationMethod = 'email';
  const [contact, setContact] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [maskedContact, setMaskedContact] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [confirmSecurityPin, setConfirmSecurityPin] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState('email'); // 'email' | 'question'
  const [recoveryAccount, setRecoveryAccount] = useState('');
  const [fetchedQuestion, setFetchedQuestion] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Exact prompt recovery question
  const recoveryQuestionPrompt = "What was your favorite teacher's name?";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlying(false);
      setShowForm(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown countdown timer for OTP resends
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Reset registration state when switching views
  const resetRegistrationFlow = () => {
    setRegStep(1);
    setContact('');
    setVerificationToken('');
    setMaskedContact('');
    setSecurityPin('');
    setConfirmSecurityPin('');
    setRecoveryAnswer('');
    setRecoveryMethod('email');
    setRecoveryAccount('');
    setFetchedQuestion('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setSuccess('');
  };

  // Helper to safely execute fetch and parse JSON responses without throwing on non-JSON
  const safeFetchJson = async (url, options) => {
    let response;
    try {
      response = await fetch(url, options);
    } catch (netErr) {
      throw new Error(netErr?.message || 'Connection to server failed. Please ensure the backend is running.');
    }

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = { error: `Server error (HTTP ${response.status})` };
    }

    return { ok: response.ok, status: response.status, data };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password.trim()) { 
      setError('Please enter username and password.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          device_info: navigator.userAgent
        })
      });
      if (ok) {
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
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // STEPPED REGISTRATION HANDLERS
  // ------------------------------------------------------------

  // Step 1: Validate Username
  const handleStep1Username = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Username is required.');
      return;
    }
    if (cleanUser.length < 3 || cleanUser.length > 30) {
      setError('Username must be between 3 and 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
      setError('Username may only contain letters, numbers, underscores, dashes, and periods.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/validate-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser })
      });
      if (ok && data.available) {
        setRegStep(2);
      } else {
        setError(data.error || 'Username is not available.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request Email OTP
  const handleStep2SendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanEmail = contact.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          method: 'email',
          contact: cleanEmail,
          email: cleanEmail
        })
      });
      if (ok) {
        setMaskedContact(data.masked_contact || cleanEmail);
        if (data.canonical_contact) {
          setContact(data.canonical_contact);
        }
        setCooldown(data.cooldown || 60);
        setOtp('');
        setRegStep(3);
        if (data.is_mock) {
          setSuccess('Development mode: Email delivery is unconfigured. Check your backend console for the 6-digit OTP code.');
        } else {
          setSuccess('Verification code dispatched to your email address.');
        }
      } else {
        setError(data.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleStep3VerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit numeric OTP code.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          method: 'email',
          contact: contact.trim().toLowerCase(),
          email: contact.trim().toLowerCase(),
          otp: cleanOtp
        })
      });
      if (ok && data.verified) {
        setVerificationToken(data.verification_token);
        setOtp('');
        setRegStep(4);
        setSuccess('Email verified! Now create your password.');
      } else {
        setError(data.error || 'OTP verification failed.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          method: 'email',
          contact: contact.trim().toLowerCase(),
          email: contact.trim().toLowerCase()
        })
      });
      if (ok) {
        setCooldown(data.cooldown || 60);
        if (data.canonical_contact) {
          setContact(data.canonical_contact);
        }
        if (data.is_mock) {
          setSuccess('Development mode: Fresh mock OTP generated. Please check your backend terminal for the 6-digit code.');
        } else {
          setSuccess('A fresh 6-digit verification code has been dispatched to your email.');
        }
      } else {
        if (data.cooldown) {
          setCooldown(data.cooldown);
        }
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create Password (min 8 chars)
  const handleStep4Password = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }
    setRegStep(5);
  };

  // Step 5: Create 6-Digit Security PIN
  const handleStep5SecurityPin = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanPin = securityPin.trim();
    const cleanConfirm = confirmSecurityPin.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setError('Security PIN must be exactly 6 numeric digits.');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError('Security PIN and confirmation PIN do not match.');
      return;
    }
    if (cleanPin === password) {
      setError('Security PIN must be different from your password.');
      return;
    }
    setRegStep(6);
  };

  // Step 6: Recovery Question + Answer -> Final Account Creation
  const handleStep6CreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanAnswer = recoveryAnswer.trim();
    if (!cleanAnswer) {
      setError('Please provide an answer to the recovery question.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          verification_token: verificationToken,
          verification_method: 'email',
          contact: contact.trim().toLowerCase(),
          email: contact.trim().toLowerCase(),
          phone: null,
          password,
          confirm_password: confirmPassword,
          security_pin: securityPin.trim(),
          confirm_security_pin: confirmSecurityPin.trim(),
          security_question: recoveryQuestionPrompt,
          security_answer: cleanAnswer
        })
      });
      if (ok) {
        const userObj = { ...data.user, session_token: data.session_token };
        if (login) login(userObj);
        onLogin();
      } else {
        setError(data.error || 'Account creation failed.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // LEGACY VERIFY EMAIL / PASSWORD RECOVERY HANDLERS
  // ------------------------------------------------------------

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otp.trim()) { setError('Please enter the 6-digit OTP code.'); return; }
    
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp: otp.trim() })
      });
      if (ok) {
        setView('login');
        setSuccess('Email verified successfully! You can now log into your node.');
        setOtp('');
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
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
      const { ok, data } = await safeFetchJson('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      if (ok) {
        setSuccess('A fresh 6-digit verification code has been sent to your email.');
      } else {
        setError(data.error || 'Failed to resend verification.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
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
      const { ok, data } = await safeFetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: username.trim() })
      });
      if (ok) {
        setMaskedEmail(data.masked_email || email || 'registered email');
        setView('verify_reset_otp');
        setSuccess('If an account exists, a 6-digit reset code has been sent.');
      } else {
        setError(data.error || 'Request failed.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRecoveryQuestion = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    const idVal = (recoveryAccount || username || email).trim();
    if (!idVal) {
      setError('Please enter your username or email address.');
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson(`/api/auth/recovery-question?username=${encodeURIComponent(idVal)}`);
      if (ok && (data.question || data.security_question)) {
        setFetchedQuestion(data.question || data.security_question);
        setSuccess('Security question located. Enter your answer and new password.');
      } else {
        setError(data.error || 'Failed to locate recovery question.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverWithSecurityQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const idVal = (recoveryAccount || username || email).trim();
    const cleanAnswer = recoveryAnswer.trim();
    if (!idVal || !cleanAnswer || !password) {
      setError('Please complete all fields to reset your password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson('/api/auth/recover-with-security-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: idVal,
          security_answer: cleanAnswer,
          new_password: password,
          confirm_password: confirmPassword
        })
      });
      if (ok) {
        setView('login');
        setSuccess('Password reset successfully via security question! Please log in.');
        setPassword('');
        setConfirmPassword('');
        setRecoveryAnswer('');
        setFetchedQuestion('');
        setRecoveryAccount('');
      } else {
        setError(data.error || 'Incorrect answer to recovery question.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
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
      const { ok, data } = await safeFetchJson('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, otp: otp.trim() })
      });
      if (ok) {
        setResetToken(data.reset_token);
        setView('reset_password');
        setSuccess('Code verified! Enter your new password below.');
      } else {
        setError(data.error || 'Invalid or expired reset code.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
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
      const { ok, data } = await safeFetchJson('/api/auth/reset-password', {
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
      if (ok) {
        setView('login');
        setSuccess('Password updated successfully! All existing sessions invalidated. Please login.');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err?.message || 'Connection to server failed.');
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
              {view === 'register' && (
                regStep === 1 ? 'Create Account' :
                regStep === 2 ? 'Email Verification' :
                regStep === 3 ? 'Verify Email Code' :
                regStep === 4 ? 'Create Password' :
                regStep === 5 ? 'Security PIN' : 'Recovery Question'
              )}
              {view === 'verify_email' && 'Verify Email OTP'}
              {view === 'forgot_password' && 'Password Recovery'}
              {view === 'verify_reset_otp' && 'Verify Reset Code'}
              {view === 'reset_password' && 'Create New Password'}
            </h2>
            {view === 'register' && (
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, letterSpacing: '0.5px' }}>
                Step {regStep} of 6 · {
                  regStep === 1 ? 'Choose Username' :
                  regStep === 2 ? 'Enter Email Address' :
                  regStep === 3 ? 'Confirm 6-Digit Email OTP' :
                  regStep === 4 ? 'Minimum 8 Characters' :
                  regStep === 5 ? '6-Digit Numeric Security PIN' :
                  'Account Recovery Answer'
                }
              </p>
            )}
          </div>

          {/* ============================================================ */}
          {/* LOGIN VIEW */}
          {/* ============================================================ */}
          {view === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="input-group">
                <User size={20} color="#94a3b8" />
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <Lock size={20} color="#94a3b8" />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

              <button type="submit" className="neon-button auth-submit" disabled={loading}>
                {loading ? 'Processing...' : 'Establish Connection'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEPPED REGISTRATION WORKFLOW */}
          {/* ============================================================ */}
          {view === 'register' && (
            <form className="auth-form" onSubmit={
              regStep === 1 ? handleStep1Username :
              regStep === 2 ? handleStep2SendOtp :
              regStep === 3 ? handleStep3VerifyOtp :
              regStep === 4 ? handleStep4Password :
              regStep === 5 ? handleStep5SecurityPin :
              handleStep6CreateAccount
            }>

              {/* STEP 1: USERNAME */}
              {regStep === 1 && (
                <div className="input-group">
                  <User size={20} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Create Account Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                    autoFocus 
                  />
                </div>
              )}

              {/* STEP 2: EMAIL ADDRESS (SOLE VERIFICATION METHOD) */}
              {regStep === 2 && (
                <>
                  <div className="input-group">
                    <Mail size={20} color="#94a3b8" />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={contact} 
                      onChange={e => setContact(e.target.value)} 
                      required 
                      autoFocus 
                    />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', margin: '4px 0 0 0' }}>
                    A 6-digit cryptographic verification code will be sent to your email.
                  </p>
                </>
              )}

              {/* STEP 3: ENTER & VERIFY OTP */}
              {regStep === 3 && (
                <div>
                  {maskedContact && (
                    <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
                      Code dispatched to: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{maskedContact}</span>
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
                      autoFocus 
                    />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', marginTop: '6px', marginBottom: '4px' }}>
                    Code expires in 5 minutes.
                  </p>
                </div>
              )}

              {/* STEP 4: CREATE PASSWORD */}
              {regStep === 4 && (
                <>
                  <div className="input-group">
                    <Lock size={20} color="#94a3b8" />
                    <input 
                      type="password" 
                      placeholder="Create Password (min 8 characters)" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      minLength={8}
                      required 
                      autoFocus 
                    />
                  </div>
                  <div className="input-group">
                    <Lock size={20} color="#94a3b8" />
                    <input 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      minLength={8}
                      required 
                    />
                  </div>
                </>
              )}

              {/* STEP 5: CREATE 6-DIGIT SECURITY PIN */}
              {regStep === 5 && (
                <>
                  <div className="input-group">
                    <Key size={20} color="#3b82f6" />
                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder="6-Digit Security PIN" 
                      maxLength={6}
                      value={securityPin} 
                      onChange={e => setSecurityPin(e.target.value.replace(/\D/g, ''))} 
                      style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '16px' }}
                      required 
                      autoFocus 
                    />
                  </div>
                  <div className="input-group">
                    <Key size={20} color="#3b82f6" />
                    <input 
                      type="password" 
                      inputMode="numeric"
                      placeholder="Confirm Security PIN" 
                      maxLength={6}
                      value={confirmSecurityPin} 
                      onChange={e => setConfirmSecurityPin(e.target.value.replace(/\D/g, ''))} 
                      style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '16px' }}
                      required 
                    />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', margin: 0 }}>
                    Must be 6 numeric digits, different from your password.
                  </p>
                </>
              )}

              {/* STEP 6: RECOVERY QUESTION + ANSWER */}
              {regStep === 6 && (
                <>
                  <div style={{ textAlign: 'left', padding: '0 4px', marginBottom: '4px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Security Recovery Question:</p>
                    <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{recoveryQuestionPrompt}</p>
                  </div>
                  <div className="input-group">
                    <Shield size={20} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Your Answer" 
                      value={recoveryAnswer} 
                      onChange={e => setRecoveryAnswer(e.target.value)} 
                      required 
                      autoFocus 
                    />
                  </div>
                </>
              )}

              {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

              <button type="submit" className="neon-button auth-submit" disabled={loading}>
                {loading ? 'Processing...' : (
                  regStep === 1 ? 'Continue' :
                  regStep === 2 ? 'Send Verification Code' :
                  regStep === 3 ? 'Verify Code' :
                  regStep === 4 ? 'Continue' :
                  regStep === 5 ? 'Continue' :
                  'Complete Account Creation'
                )}
                <ArrowRight size={20} />
              </button>

              {regStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <button 
                    type="button" 
                    onClick={handleResendRegistrationOtp} 
                    disabled={loading || cooldown > 0}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: cooldown > 0 ? '#64748b' : '#38bdf8', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer', 
                      fontSize: '12px', 
                      marginTop: '2px',
                      opacity: (loading || cooldown > 0) ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? 'Dispatching code...' : cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Verification Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegStep(2); setError(''); setSuccess(''); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Change email address
                  </button>
                </div>
              )}

              {regStep > 1 && (
                <button
                  type="button"
                  onClick={() => { setRegStep(prev => prev - 1); setError(''); setSuccess(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    width: '100%',
                    marginTop: '2px'
                  }}
                >
                  <ChevronLeft size={14} /> Back to Step {regStep - 1}
                </button>
              )}
            </form>
          )}

          {/* ============================================================ */}
          {/* LEGACY VERIFY EMAIL / PASSWORD RECOVERY VIEWS */}
          {/* ============================================================ */}
          {view === 'verify_email' && (
            <form className="auth-form" onSubmit={handleVerifyEmail}>
              <div className="input-group">
                <User size={20} color="#94a3b8" />
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
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

              {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

              <button type="submit" className="neon-button auth-submit" disabled={loading}>
                {loading ? 'Processing...' : 'Verify OTP & Activate'}
                <ArrowRight size={20} />
              </button>
              <button 
                type="button" 
                onClick={handleResendVerification} 
                disabled={loading}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}
              >
                Resend Verification OTP
              </button>
            </form>
          )}

          {view === 'forgot_password' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => { setRecoveryMethod('email'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: recoveryMethod === 'email' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                    background: recoveryMethod === 'email' ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: recoveryMethod === 'email' ? '#38bdf8' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setRecoveryMethod('question'); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: recoveryMethod === 'question' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                    background: recoveryMethod === 'question' ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: recoveryMethod === 'question' ? '#38bdf8' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Security Question
                </button>
              </div>

              {recoveryMethod === 'email' ? (
                <form className="auth-form" onSubmit={handleForgotPassword}>
                  <div className="input-group">
                    <Mail size={20} color="#94a3b8" />
                    <input type="email" placeholder="Registered Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
                  {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

                  <button type="submit" className="neon-button auth-submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Send Recovery Code'}
                    <ArrowRight size={20} />
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={fetchedQuestion ? handleRecoverWithSecurityQuestion : handleFetchRecoveryQuestion}>
                  <div className="input-group">
                    <User size={20} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Username or Registered Email" 
                      value={recoveryAccount} 
                      onChange={e => setRecoveryAccount(e.target.value)} 
                      required 
                      disabled={!!fetchedQuestion}
                    />
                  </div>

                  {fetchedQuestion && (
                    <>
                      <div style={{ textAlign: 'left', padding: '0 4px', margin: '4px 0' }}>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 2px 0' }}>Security Recovery Question:</p>
                        <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{fetchedQuestion}</p>
                      </div>

                      <div className="input-group">
                        <Shield size={20} color="#94a3b8" />
                        <input 
                          type="text" 
                          placeholder="Your Answer" 
                          value={recoveryAnswer} 
                          onChange={e => setRecoveryAnswer(e.target.value)} 
                          required 
                          autoFocus
                        />
                      </div>

                      <div className="input-group">
                        <Lock size={20} color="#3b82f6" />
                        <input 
                          type="password" 
                          placeholder="New Password (min 8 chars)" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          minLength={8}
                          required 
                        />
                      </div>

                      <div className="input-group">
                        <Lock size={20} color="#3b82f6" />
                        <input 
                          type="password" 
                          placeholder="Confirm New Password" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          minLength={8}
                          required 
                        />
                      </div>
                    </>
                  )}

                  {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
                  {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

                  <button type="submit" className="neon-button auth-submit" disabled={loading}>
                    {loading ? 'Processing...' : (fetchedQuestion ? 'Reset Password' : 'Find Recovery Question')}
                    <ArrowRight size={20} />
                  </button>

                  {fetchedQuestion && (
                    <button
                      type="button"
                      onClick={() => { setFetchedQuestion(''); setError(''); setSuccess(''); }}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', marginTop: '4px' }}
                    >
                      Use a different account
                    </button>
                  )}
                </form>
              )}
            </div>
          )}

          {view === 'verify_reset_otp' && (
            <form className="auth-form" onSubmit={handleVerifyResetOtp}>
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

              {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

              <button type="submit" className="neon-button auth-submit" disabled={loading}>
                {loading ? 'Processing...' : 'Validate Reset OTP'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {view === 'reset_password' && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="input-group">
                <Lock size={20} color="#3b82f6" />
                <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <Lock size={20} color="#3b82f6" />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '13px', textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

              <button type="submit" className="neon-button auth-submit" disabled={loading}>
                {loading ? 'Processing...' : 'Set New Password'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* NAVIGATION FOOTER */}
          {/* ============================================================ */}
          <div className="auth-toggle">
            {view === 'login' && (
              <>
                <p style={{ marginTop: '14px' }}>New to the network? <span onClick={() => { setView('register'); resetRegistrationFlow(); }}>Initialize Node</span></p>
                <p style={{ marginTop: '8px' }}><span onClick={() => { setView('forgot_password'); setError(''); setSuccess(''); }}>Forgot Password?</span></p>
              </>
            )}
            {view !== 'login' && (
              <p>Back to <span onClick={() => { setView('login'); resetRegistrationFlow(); }}>Secure Gateway</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
