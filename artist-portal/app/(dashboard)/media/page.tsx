'use client';

import React, { useState, useEffect } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { 
  Music, 
  Video, 
  Plus, 
  Trash2, 
  ExternalLink, 
  FileAudio, 
  Play, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

export default function MediaPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [audioSamples, setAudioSamples] = useState<string[]>(artist?.audio_samples || []);
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(artist?.video_url || '');

  useEffect(() => {
    if (artist) {
      setAudioSamples(artist.audio_samples || []);
      setVideoUrl(artist.video_url || '');
    }
  }, [artist]);

  const handleAddAudio = () => {
    if (!newAudioUrl.trim()) return;
    setAudioSamples([...audioSamples, newAudioUrl.trim()]);
    setNewAudioUrl('');
  };

  const handleRemoveAudio = (idx: number) => {
    setAudioSamples(audioSamples.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!artist) return;
    setSaving(true);
    setMessage(null);

    try {
      await artistService.updateProfile(artist.id, {
        audio_samples: audioSamples,
        video_url: videoUrl,
      });
      await refreshArtist();
      setMessage({ type: 'success', text: 'Audio tracks and showreel saved successfully.' });
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save media assets.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Audio & Showreels</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Add sound samples, studio recordings, and video links for booking clients.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary self-start sm:self-auto py-2 px-4 text-xs flex items-center gap-1.5 min-h-[38px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs border flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Video Showreel */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Video className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Spotlight Video Showreel</h2>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">YouTube or Vimeo URL</label>
          <div className="relative">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm pr-10"
            />
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                title="Preview video"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Audio Tracks */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Audio Tracks & Demos</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {audioSamples.length} {audioSamples.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {/* Add audio input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={newAudioUrl}
            onChange={(e) => setNewAudioUrl(e.target.value)}
            placeholder="SoundCloud track, MP3 link, or drive audio URL..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAudio())}
          />
          <button
            type="button"
            onClick={handleAddAudio}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 whitespace-nowrap min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Track</span>
          </button>
        </div>

        {/* Audio Tracks List */}
        {audioSamples.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <FileAudio className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
            <p className="text-xs font-bold text-slate-900">No audio tracks added</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Add links to SoundCloud or cloud audio files to let clients hear your sound.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {audioSamples.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-sky-600 shadow-xs">
                    <Play className="w-3 h-3 fill-sky-600" />
                  </div>
                  <span className="truncate text-xs font-mono text-slate-800">
                    {url}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAudio(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove track"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
