import React from 'react';
import { Sparkles } from 'lucide-react';
import { AIOrbGraphic } from './AIOrbGraphic';
import './AuthLayout.css';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-split-page">
      {/* Left Branding Showcase */}
      <div className="auth-left-side">
        <div className="auth-brand-top">
          <div className="auth-brand-logo">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="auth-brand-name">Interview<span className="text-gradient">AI</span></span>
        </div>

        <div className="auth-hero-copy">
          <h1 className="auth-hero-title">
            Practice smarter. <br />
            <span className="text-gradient">Interview better.</span>
          </h1>
          <p className="auth-hero-subtitle">
            Personalized, interactive mock interviews powered by advanced AI. Upload your resume and master technical, system design, and behavioral questions with instant feedback.
          </p>
        </div>

        <AIOrbGraphic />

        <div className="auth-footer-tag">
          <span>Trusted by 10,000+ engineers preparing for top tech roles</span>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="auth-right-side">
        <div className="auth-form-card glass-panel animate-pop-in">
          <div className="auth-card-header">
            <h2 className="auth-card-title">{title}</h2>
            {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
