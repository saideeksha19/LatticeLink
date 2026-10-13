import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, Lock, CheckCircle, RefreshCw, X } from 'lucide-react';

/**
 * PollCard – renders a poll embedded in a chat message bubble.
 *
 * Props:
 *   pollData   – initial poll object from the message (may be stale)
 *   messageId  – parent message id (used for the refresh key)
 *   isMe       – boolean, whether current user sent the poll
 *   sessionToken – JWT for API calls
 *   currentUsername – logged-in username
 *   onPollUpdate  – callback(updatedPoll) so parent can sync state
 */
const PollCard = ({ pollData, messageId, isMe, sessionToken, currentUsername, onPollUpdate }) => {
  const [poll, setPoll] = useState(pollData);
  const [selectedOption, setSelectedOption] = useState(pollData?.user_voted_option ?? null);
  const [isVoting, setIsVoting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [voteError, setVoteError] = useState('');

  // Sync when external poll data changes (e.g. socket update)
  useEffect(() => {
    if (pollData) {
      setPoll(pollData);
      setSelectedOption(pollData.user_voted_option ?? null);
    }
  }, [pollData]);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
    'ngrok-skip-browser-warning': 'true'
  }), [sessionToken]);

  const refreshPoll = useCallback(async () => {
    if (!poll?.id) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
        setSelectedOption(data.poll.user_voted_option ?? null);
        if (onPollUpdate) onPollUpdate(data.poll);
      }
    } catch (e) {
      console.error('[PollCard] refresh error', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [poll?.id, authHeaders, onPollUpdate]);

  const handleVote = async () => {
    if (selectedOption === null) {
      setVoteError('Please select an option before voting.');
      return;
    }
    if (poll?.is_closed) {
      setVoteError('This poll is closed.');
      return;
    }
    setVoteError('');
    setIsVoting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ option_id: selectedOption })
      });
      const data = await res.json();
      if (res.ok) {
        setPoll(data.poll);
        setSelectedOption(data.poll.user_voted_option ?? null);
        if (onPollUpdate) onPollUpdate(data.poll);
      } else {
        setVoteError(data.error || 'Vote failed. Please try again.');
        // Revert selection to previously voted option
        setSelectedOption(poll.user_voted_option ?? null);
      }
    } catch (e) {
      setVoteError('Network error. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  if (!poll) return null;

  const hasVoted = poll.user_voted_option !== null && poll.user_voted_option !== undefined;
  const totalVotes = poll.total_votes || 0;
  const maxCount = Math.max(...(poll.options || []).map(o => o.count), 1);

  // Leading option – highest count (only if votes exist)
  const leadingId = totalVotes > 0
    ? poll.options.reduce((best, o) => (o.count > (best?.count ?? -1) ? o : best), null)?.id
    : null;

  const cardBg = isMe
    ? 'rgba(0,0,0,0.25)'
    : 'var(--bg-inset, rgba(255,255,255,0.05))';

  const borderColor = poll.is_closed
    ? 'rgba(239,68,68,0.35)'
    : isMe
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(59,130,246,0.3)';

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '14px 16px',
        minWidth: '260px',
        maxWidth: '340px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
          <BarChart2 size={16} color={isMe ? 'rgba(255,255,255,0.8)' : '#60a5fa'} style={{ marginTop: '2px', flexShrink: 0 }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: isMe ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)',
            lineHeight: '1.4'
          }}>
            {poll.question}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {poll.is_closed && (
            <span style={{
              fontSize: '10px', fontWeight: '600',
              background: 'rgba(239,68,68,0.2)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.3)',
              padding: '2px 6px', borderRadius: '4px',
              display: 'flex', alignItems: 'center', gap: '3px'
            }}>
              <Lock size={9} /> CLOSED
            </span>
          )}
          <button
            onClick={refreshPoll}
            disabled={isRefreshing}
            title="Refresh poll results"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-dim)',
              padding: '2px', display: 'flex', alignItems: 'center',
              opacity: isRefreshing ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {(poll.options || []).map(opt => {
          const isSelected = selectedOption === opt.id;
          const isUserVotedHere = poll.user_voted_option === opt.id;
          const pct = opt.percentage || 0;
          const isLeading = leadingId === opt.id && totalVotes > 0;

          return (
            <div
              key={opt.id}
              onClick={() => {
                if (!poll.is_closed) {
                  setSelectedOption(opt.id);
                  setVoteError('');
                }
              }}
              style={{
                position: 'relative',
                borderRadius: '8px',
                border: isSelected
                  ? '1px solid rgba(59,130,246,0.8)'
                  : isLeading && hasVoted
                    ? '1px solid rgba(16,185,129,0.5)'
                    : `1px solid ${isMe ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'}`,
                overflow: 'hidden',
                cursor: poll.is_closed ? 'default' : 'pointer',
                transition: 'border-color 0.2s',
                background: isSelected
                  ? 'rgba(59,130,246,0.12)'
                  : 'rgba(0,0,0,0.15)',
              }}
            >
              {/* Progress bar fill */}
              {hasVoted && pct > 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isLeading
                    ? 'rgba(16,185,129,0.18)'
                    : isUserVotedHere
                      ? 'rgba(59,130,246,0.18)'
                      : 'rgba(255,255,255,0.06)',
                  transition: 'width 0.5s ease',
                  borderRadius: '8px'
                }} />
              )}

              {/* Option content */}
              <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  {/* Radio circle */}
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                    border: isSelected ? '2px solid #3b82f6' : `2px solid ${isMe ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)'}`,
                    background: isSelected ? '#3b82f6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}>
                    {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                  </div>

                  <span style={{
                    fontSize: '13px',
                    color: isMe ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)',
                    fontWeight: isLeading && hasVoted ? '600' : '400',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {opt.text}
                    {isLeading && hasVoted && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#10b981' }}>● LEADING</span>}
                  </span>
                </div>

                {/* Percentage + count */}
                {hasVoted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isUserVotedHere && <CheckCircle size={12} color="#60a5fa" />}
                    <span style={{ fontSize: '12px', fontWeight: '600', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)' }}>
                      ({opt.count})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {voteError && (
        <div style={{
          fontSize: '12px', color: '#f87171', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <X size={12} /> {voteError}
        </div>
      )}

      {/* Footer: total votes + vote button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          {poll.creator && (
            <span style={{ marginLeft: '6px', opacity: 0.6 }}>· by {poll.creator}</span>
          )}
        </span>

        {!poll.is_closed && (
          <button
            onClick={handleVote}
            disabled={isVoting || selectedOption === null}
            style={{
              background: selectedOption !== null ? '#3b82f6' : 'rgba(59,130,246,0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 14px',
              color: selectedOption !== null ? 'white' : 'rgba(255,255,255,0.4)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: selectedOption !== null ? 'pointer' : 'not-allowed',
              opacity: isVoting ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: selectedOption !== null ? '0 0 10px rgba(59,130,246,0.4)' : 'none'
            }}
          >
            {isVoting ? 'Voting…' : hasVoted ? 'Change Vote' : 'Vote'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollCard;
