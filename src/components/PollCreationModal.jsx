import React, { useState } from 'react';
import { BarChart2, X, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PollCreationModal – modal for creating a new poll in the currently active conversation.
 *
 * Props:
 *   conversationId   – current active conversation id
 *   sessionToken     – JWT for authenticated API calls
 *   currentUsername  – username of the creator
 *   isGroup          – boolean, whether this is a group conversation
 *   onClose()        – called when the modal should be dismissed
 *   onPollCreated(pollMsgData) – called after successful creation with the full message+poll response
 */
const PollCreationModal = ({
  conversationId,
  sessionToken,
  currentUsername,
  isGroup,
  onClose,
  onPollCreated
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowChange, setAllowChange] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!question.trim()) {
      newErrors.question = 'Poll question is required.';
    } else if (question.trim().length > 500) {
      newErrors.question = 'Question must be ≤ 500 characters.';
    }

    const trimmedOpts = options.map(o => o.trim());
    const emptyIdx = trimmedOpts.findIndex(o => !o);
    if (emptyIdx !== -1) {
      newErrors[`opt_${emptyIdx}`] = 'Option cannot be blank.';
    }
    if (trimmedOpts.length < 2) {
      newErrors.options = 'At least 2 options are required.';
    }
    if (trimmedOpts.length > 10) {
      newErrors.options = 'Maximum 10 options allowed.';
    }
    // Duplicate check (case-insensitive)
    const lowered = trimmedOpts.map(o => o.toLowerCase());
    const uniqueLowered = new Set(lowered);
    if (uniqueLowered.size !== lowered.length) {
      newErrors.options = 'Duplicate options are not allowed.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions(prev => [...prev, '']);
    setErrors(prev => ({ ...prev, options: undefined }));
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
    // Clean up per-option errors
    setErrors(prev => {
      const next = { ...prev };
      delete next[`opt_${idx}`];
      return next;
    });
  };

  const handleOptionChange = (idx, value) => {
    setOptions(prev => prev.map((o, i) => (i === idx ? value : o)));
    setErrors(prev => {
      const next = { ...prev };
      delete next[`opt_${idx}`];
      delete next.options;
      return next;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/polls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          question: question.trim(),
          options: options.map(o => o.trim()).filter(Boolean),
          allow_change_vote: allowChange,
          show_voter_identities: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || 'Failed to create poll.' });
        return;
      }

      if (onPollCreated) onPollCreated(data);
      onClose();
    } catch (err) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay-bg, rgba(0,0,0,0.7))',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{
          width: '90%',
          maxWidth: '480px',
          background: 'var(--bg-elevated, #1a1a2e)',
          border: '1px solid rgba(139,92,246,0.45)',
          borderRadius: '18px',
          padding: '28px 28px 24px',
          color: 'var(--text-primary)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.15)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139,92,246,0.5)'
            }}>
              <BarChart2 size={18} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Create Poll
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Add a poll to this conversation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-hover)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-dim)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate}>
          {/* Question */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Poll Question <span style={{ color: '#f87171' }}>*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setErrors(prev => ({ ...prev, question: undefined }));
              }}
              placeholder="What would you like to ask?"
              rows={2}
              maxLength={500}
              style={{
                width: '100%',
                background: 'var(--input-bg, rgba(255,255,255,0.05))',
                border: errors.question ? '1px solid #f87171' : '1px solid var(--input-border, rgba(255,255,255,0.15))',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
            />
            {errors.question && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f87171', fontSize: '12px' }}>
                <AlertCircle size={11} /> {errors.question}
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'right' }}>
              {question.length}/500
            </div>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Answer Options <span style={{ color: '#f87171' }}>*</span>
              <span style={{ fontWeight: '400', color: 'var(--text-muted)', marginLeft: '6px' }}>({options.length}/10)</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence initial={false}>
                {options.map((opt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: '700', color: '#60a5fa'
                    }}>
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={200}
                      style={{
                        flex: 1,
                        background: 'var(--input-bg, rgba(255,255,255,0.05))',
                        border: errors[`opt_${idx}`] ? '1px solid #f87171' : '1px solid var(--input-border, rgba(255,255,255,0.15))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        title="Remove option"
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '6px', width: '30px', height: '30px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#f87171', transition: '0.15s'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {errors.options && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#f87171', fontSize: '12px' }}>
                <AlertCircle size={11} /> {errors.options}
              </div>
            )}

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  marginTop: '10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.4)',
                  borderRadius: '8px', padding: '7px 14px',
                  color: '#60a5fa', fontSize: '13px', cursor: 'pointer',
                  fontWeight: '500', transition: '0.15s'
                }}
              >
                <Plus size={14} /> Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div style={{
            marginBottom: '22px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: '10px',
            padding: '12px 14px'
          }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              cursor: 'pointer', userSelect: 'none'
            }}>
              <div
                onClick={() => setAllowChange(v => !v)}
                style={{
                  width: '38px', height: '22px', borderRadius: '11px',
                  background: allowChange ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.25s', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: allowChange ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  transition: 'left 0.25s'
                }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Allow vote changes</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {allowChange ? 'Participants can change their vote' : 'Votes are locked once submitted'}
                </div>
              </div>
            </label>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div style={{
              marginBottom: '14px', padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', color: '#f87171', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <AlertCircle size={14} /> {errors.submit}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--input-border, rgba(255,255,255,0.15))',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: '0.15s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                opacity: isCreating ? 0.7 : 1,
                boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: '0.15s'
              }}
            >
              {isCreating ? (
                <>Creating…</>
              ) : (
                <><Check size={16} /> Create Poll</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PollCreationModal;
