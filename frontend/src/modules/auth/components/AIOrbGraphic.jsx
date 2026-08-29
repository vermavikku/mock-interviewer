import React from 'react';
import { Sparkles, Bot, BrainCircuit, Activity } from 'lucide-react';
import './AuthLayout.css';

export function AIOrbGraphic() {
  return (
    <div className="ai-visual-container">
      {/* Dynamic Glowing Neural Orb */}
      <div className="neural-orb-center">
        <div className="orb-ring ring-1" />
        <div className="orb-ring ring-2" />
        <div className="orb-ring ring-3" />
        <div className="orb-core">
          <BrainCircuit size={48} className="orb-brain-icon" />
        </div>
      </div>

      {/* Floating AI Audio Waveform Preview */}
      <div className="ai-waveform-box">
        <div className="waveform-header">
          <div className="pulse-dot-ai" />
          <span>Real-Time Voice & Speech AI</span>
        </div>
        <div className="waveform-bars">
          {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 70, 85, 40, 65].map((height, i) => (
            <div
              key={i}
              className="wave-bar"
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.08}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Live AI Question Card */}
      <div className="ai-quote-card animate-float">
        <div className="quote-badge">
          <Bot size={14} />
          <span>AI Interviewer "Alex"</span>
        </div>
        <p className="quote-text">
          "How do you design a high-throughput caching tier while preventing cache stampede and stale reads?"
        </p>
        <div className="quote-sub">
          <Activity size={13} className="text-cyan" />
          <span>Adapts in real-time to your resume & answers</span>
        </div>
      </div>
    </div>
  );
}
