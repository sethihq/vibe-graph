'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MoodSession {
  timestamp: Date;
  mood: string;
  frequency: number;
  volatility: number;
  duration: number;
  color: string;
}

interface MoodHistoryProps {
  currentMood: string;
  frequency: number;
  volatility: number;
  moodColor: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function MoodHistory({ 
  currentMood, 
  frequency, 
  volatility, 
  moodColor,
  isVisible,
  onClose 
}: MoodHistoryProps) {
  const [moodHistory, setMoodHistory] = useState<MoodSession[]>([]);
  const [sessionStart, setSessionStart] = useState<Date>(new Date());

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vibegraph-mood-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp)
        }));
        setMoodHistory(parsed);
      } catch (error) {
        console.log('Failed to load mood history:', error);
      }
    }
  }, []);

  // Save current session when mood changes significantly
  useEffect(() => {
    const saveCurrentSession = () => {
      const now = new Date();
      const duration = now.getTime() - sessionStart.getTime();
      
      // Only save if session lasted more than 5 seconds
      if (duration > 5000) {
        const newSession: MoodSession = {
          timestamp: sessionStart,
          mood: currentMood,
          frequency,
          volatility,
          duration,
          color: moodColor
        };

        setMoodHistory(prev => {
          const updated = [...prev, newSession].slice(-50); // Keep last 50 sessions
          localStorage.setItem('vibegraph-mood-history', JSON.stringify(updated));
          return updated;
        });
      }
      
      setSessionStart(now);
    };

    const timer = setTimeout(saveCurrentSession, 2000);
    return () => clearTimeout(timer);
  }, [currentMood, frequency, volatility, moodColor, sessionStart]);

  // Calculate mood statistics
  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;

    const moodCounts = moodHistory.reduce((acc, session) => {
      acc[session.mood] = (acc[session.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalSessions = moodHistory.length;
    const avgVolatility = moodHistory.reduce((sum, s) => sum + s.volatility, 0) / totalSessions;
    const avgFrequency = moodHistory.reduce((sum, s) => sum + s.frequency, 0) / totalSessions;
    const totalTime = moodHistory.reduce((sum, s) => sum + s.duration, 0);

    const dominantMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    return {
      totalSessions,
      totalTime: Math.round(totalTime / 1000), // in seconds
      avgVolatility: Math.round(avgVolatility * 100),
      avgFrequency: Math.round(avgFrequency * 10) / 10,
      dominantMood,
      moodDistribution: Object.entries(moodCounts)
        .map(([mood, count]) => ({
          mood,
          count,
          percentage: Math.round((count / totalSessions) * 100)
        }))
        .sort((a, b) => b.count - a.count)
    };
  };

  const clearHistory = () => {
    setMoodHistory([]);
    localStorage.removeItem('vibegraph-mood-history');
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(moodHistory, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibegraph-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = getMoodStats();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-neutral-800">📊 Mood History</h2>
              <div className="flex space-x-2">
                <motion.button
                  onClick={exportHistory}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={moodHistory.length === 0}
                >
                  📤 Export
                </motion.button>
                <motion.button
                  onClick={clearHistory}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={moodHistory.length === 0}
                >
                  🗑️ Clear
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="px-3 py-1 text-sm bg-neutral-600 text-white rounded hover:bg-neutral-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            {moodHistory.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p className="text-lg mb-2">No mood history yet</p>
                <p className="text-sm">Start using the app to build your mood timeline!</p>
              </div>
            ) : (
              <>
                {/* Statistics Overview */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-neutral-100 rounded-lg">
                      <div className="text-2xl font-bold text-neutral-800">{stats.totalSessions}</div>
                      <div className="text-xs text-neutral-600">Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-100 rounded-lg">
                      <div className="text-2xl font-bold text-neutral-800">{stats.totalTime}s</div>
                      <div className="text-xs text-neutral-600">Total Time</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-100 rounded-lg">
                      <div className="text-2xl font-bold text-neutral-800">{stats.avgVolatility}%</div>
                      <div className="text-xs text-neutral-600">Avg Volatility</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-100 rounded-lg">
                      <div className="text-2xl font-bold text-neutral-800">{stats.avgFrequency}x</div>
                      <div className="text-xs text-neutral-600">Avg Frequency</div>
                    </div>
                  </div>
                )}

                {/* Mood Distribution */}
                {stats && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Mood Distribution</h3>
                    <div className="space-y-2">
                      {stats.moodDistribution.map(({ mood, count, percentage }) => (
                        <div key={mood} className="flex items-center">
                          <div className="w-20 text-sm font-mono text-neutral-600 capitalize">
                            {mood}
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <motion.div
                                className="h-2 rounded-full"
                                style={{ backgroundColor: moodHistory.find(s => s.mood === mood)?.color || '#6b7280' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-mono text-neutral-600 w-12 text-right">
                            {percentage}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Sessions Timeline */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Recent Sessions</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {moodHistory.slice(-20).reverse().map((session, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: session.color }}
                          />
                          <div>
                            <div className="font-medium text-sm capitalize">{session.mood}</div>
                            <div className="text-xs text-neutral-500 font-mono">
                              {session.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">
                            {Math.round(session.duration / 1000)}s
                          </div>
                          <div className="text-xs text-neutral-500">
                            V:{Math.round(session.volatility * 100)}% F:{session.frequency.toFixed(1)}x
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 