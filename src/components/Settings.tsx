'use client';

import { useState, useEffect } from 'react';
import {
  getUtrPlayerId,
  setUtrPlayerId,
  clearUtrPlayerId,
  getLastSync,
  setLastSync,
  mergeUtrSessions,
} from '@/lib/storage';

interface UtrSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  singlesUtr: number;
  doublesUtr: number;
  location: string;
}

interface UtrProfile {
  id: number;
  firstName: string;
  lastName: string;
  singlesUtr: number;
  doublesUtr: number;
}

interface Props {
  onClose: () => void;
  onSessionsImported: () => void;
}

export default function Settings({ onClose, onSessionsImported }: Props) {
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UtrProfile | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UtrSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Loading state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const id = getUtrPlayerId();
    setLinkedId(id);
    setLastSyncDate(getLastSync());
    if (id) {
      loadProfile(id);
    }
  }, []);

  async function loadProfile(playerId: string) {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const res = await fetch('/api/utr/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to load profile');
        return;
      }
      setProfile(data);
    } catch {
      setProfileError('Failed to connect to UTR');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const res = await fetch('/api/utr/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Search failed');
        return;
      }
      if (Array.isArray(data)) {
        setSearchResults(data);
        if (data.length === 0) {
          setSearchError('No players found');
        }
      } else {
        setSearchError('Unexpected response format');
      }
    } catch {
      setSearchError('Failed to connect to UTR');
    } finally {
      setSearching(false);
    }
  }

  function handleLink(player: UtrSearchResult) {
    const id = String(player.id);
    setUtrPlayerId(id);
    setLinkedId(id);
    setSearchResults([]);
    setSearchQuery('');
    setProfile({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      singlesUtr: player.singlesUtr,
      doublesUtr: player.doublesUtr,
    });
  }

  function handleUnlink() {
    clearUtrPlayerId();
    setLinkedId(null);
    setProfile(null);
    setLastSyncDate(null);
    setSyncMessage('');
  }

  async function handleSync() {
    if (!linkedId) return;
    setSyncing(true);
    setSyncMessage('');

    try {
      const res = await fetch('/api/utr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: linkedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage(`Error: ${data.error || 'Sync failed'}`);
        return;
      }

      const added = mergeUtrSessions(data.sessions);
      const now = new Date().toISOString();
      setLastSync(now);
      setLastSyncDate(now);
      setSyncMessage(
        added > 0
          ? `Imported ${added} new match${added !== 1 ? 'es' : ''}`
          : `No new matches to import (${data.count} total from UTR)`
      );
      if (added > 0) {
        onSessionsImported();
      }
    } catch {
      setSyncMessage('Error: Failed to connect to UTR');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-green-400">Settings</h2>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white text-sm"
        >
          Close
        </button>
      </div>

      {/* UTR Profile Section */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
        <h3 className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
          UTR Profile
        </h3>

        {linkedId && profile ? (
          // Linked state
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-200">
                  {profile.firstName} {profile.lastName}
                </div>
                <div className="flex gap-3 mt-1">
                  {profile.singlesUtr > 0 && (
                    <span className="text-xs text-green-400">
                      Singles: {profile.singlesUtr.toFixed(2)}
                    </span>
                  )}
                  {profile.doublesUtr > 0 && (
                    <span className="text-xs text-blue-400">
                      Doubles: {profile.doublesUtr.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleUnlink}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Unlink
              </button>
            </div>

            {/* Sync button */}
            <div className="pt-2 border-t border-neutral-700">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
              >
                {syncing ? 'Syncing...' : 'Sync Matches'}
              </button>
              {syncMessage && (
                <p
                  className={`text-xs mt-2 ${
                    syncMessage.startsWith('Error')
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}
                >
                  {syncMessage}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                {lastSyncDate
                  ? `Last synced: ${new Date(lastSyncDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : 'Never synced'}
              </p>
            </div>
          </div>
        ) : linkedId && loadingProfile ? (
          <p className="text-xs text-neutral-500">Loading profile...</p>
        ) : linkedId && profileError ? (
          <div className="space-y-2">
            <p className="text-xs text-red-400">{profileError}</p>
            <button
              onClick={handleUnlink}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Unlink and try again
            </button>
          </div>
        ) : (
          // Search state
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name..."
                className="flex-1 bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-red-400">{searchError}</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-neutral-900 rounded-lg p-3"
                  >
                    <div>
                      <div className="text-sm text-neutral-200">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="flex gap-2 text-xs text-neutral-500">
                        {player.singlesUtr > 0 && (
                          <span>UTR {player.singlesUtr.toFixed(2)}</span>
                        )}
                        {player.location && <span>{player.location}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLink(player)}
                      className="px-2.5 py-1 rounded bg-green-700 hover:bg-green-600 text-xs font-medium transition"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
