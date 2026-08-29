import React from 'react';
import { Code2, Users, Briefcase, Layers, Shuffle, Check } from 'lucide-react';
import { useInterview } from '../../../shared/context/InterviewContext';
import './NewInterview.css';

export function InterviewConfigStep({ onNext }) {
  const { activeConfig, updateConfig } = useInterview();

  const interviewTypes = [
    {
      id: 'Technical',
      label: 'Technical',
      desc: 'Algorithms, data structures, backend/frontend engineering & coding concepts',
      icon: Code2,
      tag: 'Most Popular',
    },
    {
      id: 'System Design',
      label: 'System Design',
      desc: 'Scalability, microservices, databases, caching, and cloud infrastructure',
      icon: Layers,
      tag: 'Staff / Senior',
    },
    {
      id: 'Behavioral',
      label: 'Behavioral',
      desc: 'STAR method, leadership, communication, and cross-functional conflict',
      icon: Users,
      tag: 'Leadership',
    },
    {
      id: 'HR',
      label: 'HR & Culture',
      desc: 'Career goals, salary negotiations, culture fit, and workplace motivation',
      icon: Briefcase,
      tag: 'All Levels',
    },
    {
      id: 'Mixed',
      label: 'Mixed Comprehensive',
      desc: 'Balanced combination of technical depth, architecture, and behavioral questions',
      icon: Shuffle,
      tag: 'Realistic',
    },
  ];

  const experienceLevels = [
    { id: 'Entry Level', label: 'Entry Level', years: '0–2 yrs' },
    { id: 'Mid Level', label: 'Mid Level', years: '2–5 yrs' },
    { id: 'Senior', label: 'Senior', years: '5–8 yrs' },
    { id: 'Lead', label: 'Staff / Lead', years: '8+ yrs' },
  ];

  const difficulties = [
    { id: 'Easy', label: 'Easy', color: 'var(--color-success)', desc: 'Fundamental concepts & straightforward questions' },
    { id: 'Medium', label: 'Medium', color: 'var(--color-warning)', desc: 'Realistic standard tech company bar' },
    { id: 'Hard', label: 'Hard', color: 'var(--color-danger)', desc: 'FAANG / Tier-1 bar-raiser depth & edge cases' },
  ];

  const durations = [
    { id: 15, label: '15 mins', questions: '~4-6 questions' },
    { id: 30, label: '30 mins', questions: '~8-10 questions', popular: true },
    { id: 45, label: '45 mins', questions: '~12-15 questions' },
    { id: 60, label: '60 mins', questions: '~15-20 questions' },
  ];

  return (
    <div className="interview-config-wrap animate-fade-in">
      {/* 1. Interview Type */}
      <div className="config-section">
        <div className="config-section-header">
          <span className="step-num">01</span>
          <div>
            <h3 className="config-heading">Select Interview Focus</h3>
            <p className="config-subheading">Choose the primary evaluation domain for this practice session</p>
          </div>
        </div>

        <div className="type-cards-grid">
          {interviewTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = activeConfig.type === t.id;
            return (
              <div
                key={t.id}
                onClick={() => updateConfig({ type: t.id })}
                className={`type-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="type-card-top">
                  <div className="type-icon-box">
                    <Icon size={22} />
                  </div>
                  {t.tag && <span className="type-tag">{t.tag}</span>}
                  {isSelected && <span className="selected-check"><Check size={14} /></span>}
                </div>
                <h4 className="type-card-title">{t.label}</h4>
                <p className="type-card-desc">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Experience Level */}
      <div className="config-section">
        <div className="config-section-header">
          <span className="step-num">02</span>
          <div>
            <h3 className="config-heading">Target Experience Level</h3>
            <p className="config-subheading">AI adjusts question complexity according to seniority expectations</p>
          </div>
        </div>

        <div className="level-cards-grid">
          {experienceLevels.map((lvl) => {
            const isSelected = activeConfig.level === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => updateConfig({ level: lvl.id })}
                className={`level-card ${isSelected ? 'selected' : ''}`}
              >
                <span className="level-title">{lvl.label}</span>
                <span className="level-years">{lvl.years}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Difficulty & Duration */}
      <div className="config-row-2col">
        <div className="config-section">
          <div className="config-section-header">
            <span className="step-num">03</span>
            <div>
              <h3 className="config-heading">Difficulty Tier</h3>
              <p className="config-subheading">Interview strictness & depth</p>
            </div>
          </div>

          <div className="difficulty-list">
            {difficulties.map((d) => {
              const isSelected = activeConfig.difficulty === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => updateConfig({ difficulty: d.id })}
                  className={`diff-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="diff-card-left">
                    <span className="diff-indicator" style={{ background: d.color }} />
                    <div>
                      <span className="diff-label">{d.label}</span>
                      <span className="diff-desc">{d.desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="config-section">
          <div className="config-section-header">
            <span className="step-num">04</span>
            <div>
              <h3 className="config-heading">Interview Duration</h3>
              <p className="config-subheading">Session time & pacing</p>
            </div>
          </div>

          <div className="duration-grid">
            {durations.map((dur) => {
              const isSelected = activeConfig.duration === dur.id;
              return (
                <div
                  key={dur.id}
                  onClick={() => updateConfig({ duration: dur.id })}
                  className={`dur-card ${isSelected ? 'selected' : ''}`}
                >
                  {dur.popular && <span className="dur-badge">Recommended</span>}
                  <span className="dur-time">{dur.label}</span>
                  <span className="dur-qcount">{dur.questions}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
