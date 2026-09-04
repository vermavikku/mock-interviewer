import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Trash2, Eye, CheckCircle2, History, Sparkles, HardDrive, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { formatFileSize, formatDate } from '../../../shared/utils/formatters';
import { useInterview } from '../../../shared/context/InterviewContext';
import { useToast } from '../../../shared/context/ToastContext';
import * as api from '../../../shared/utils/apiClient';
import './NewInterview.css';

export function ResumeUploadStep() {
  const { activeResume, updateResume } = useInterview();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history'
  const [previousResumes, setPreviousResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(100);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadPreviousResumes();
  }, []);

  const loadPreviousResumes = async () => {
    try {
      setLoadingResumes(true);
      const res = await api.listUploadedResumes();
      const list = res.data || res || [];
      if (Array.isArray(list)) {
        setPreviousResumes(list);
      }
    } catch (err) {
      console.warn('Could not load previous resumes:', err.message);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handlePreviewInNewTab = (resume) => {
    const sid = resume.sessionId || resume.existingSessionId || resume.id;
    if (sid) {
      const url = api.getResumeFileUrl(sid);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFile = (file) => {
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File exceeds the 25 MB size limit.');
      return;
    }

    // Validate type (PDF, DOCX, DOC, PNG, JPG)
    const validExtensions = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      toast.error('Please upload a valid PDF, DOCX, or Image document.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        const resumeObj = {
          id: `res_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          rawFile: file,
          isExistingResume: false,
          updatedAt: new Date().toISOString(),
          title: file.name,
          summary: `Uploaded candidate resume (${file.name}).`,
        };
        updateResume(resumeObj);
        toast.success(`Resume "${file.name}" attached successfully!`);
      }
    }, 100);
  };

  const handleSelectPreviousResume = (prevResume) => {
    const resumeObj = {
      id: prevResume.sessionId,
      existingSessionId: prevResume.sessionId,
      isExistingResume: true,
      name: prevResume.fileName,
      size: prevResume.fileSize,
      type: prevResume.mimeType || 'application/pdf',
      updatedAt: prevResume.uploadedAt,
      title: prevResume.fileName,
      summary: prevResume.textSnippet || `Previously uploaded resume for ${prevResume.targetRole || 'engineering'}.`,
    };
    updateResume(resumeObj);
    toast.success(`Selected previous resume: "${prevResume.fileName}"`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveResume = () => {
    updateResume(null);
    toast.info('Resume selection cleared');
  };

  return (
    <div className="resume-upload-wrap animate-fade-in">
      <div className="upload-hero-text">
        <h3 className="upload-main-title">Attach or Choose Your Resume</h3>
        <p className="upload-main-subtitle">
          Upload a new resume document or select from previously uploaded resumes to formulate authentic AI interview questions.
        </p>
      </div>

      {/* Selected Resume Banner (if chosen) */}
      {activeResume && (
        <div className="uploaded-resume-card glass-panel animate-pop-in" style={{ marginBottom: 24, border: '1px solid var(--color-primary)' }}>
          <div className="uploaded-file-row">
            <div className="file-icon-wrap" style={{ background: 'rgba(15, 118, 110, 0.15)', color: 'var(--color-primary)' }}>
              <FileText size={28} />
            </div>

            <div className="file-info-col">
              <div className="file-name-row">
                <span className="file-name">{activeResume.name}</span>
                <span className="file-size-badge">{formatFileSize(activeResume.size)}</span>
                {activeResume.isExistingResume && (
                  <Badge variant="cyan" size="sm">
                    Reused from Past Session
                  </Badge>
                )}
              </div>
              <span className="file-summary">{activeResume.summary}</span>
            </div>

            <div className="file-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {activeResume.isExistingResume && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ExternalLink}
                  iconPosition="right"
                  onClick={() => handlePreviewInNewTab(activeResume)}
                >
                  Preview Document
                </Button>
              )}
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => setShowRemoveConfirm(true)}
                title="Remove resume"
                aria-label="Remove resume"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="upload-progress-box">
              <ProgressBar value={uploadProgress} max={100} size="sm" color="gradient" />
              <span className="upload-status-text">Attaching resume ({uploadProgress}%)...</span>
            </div>
          )}
        </div>
      )}

      {/* Sub Header Tabs for Options */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'upload' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'upload' ? '#fff' : 'var(--text-dim)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <UploadCloud size={16} /> Upload New Document
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'history' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'history' ? '#fff' : 'var(--text-dim)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <History size={16} /> Previous Resumes ({previousResumes.length})
        </button>
      </div>

      {/* Tab 1: Upload New Zone */}
      {activeTab === 'upload' && !activeResume && (
        <div
          className={`dropzone-box ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files?.[0])}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
          />

          <div className="dropzone-icon-circle">
            <UploadCloud size={32} />
          </div>

          <h4 className="dropzone-title">
            Drag & drop your resume here, or <span className="text-gradient">browse files</span>
          </h4>
          <p className="dropzone-hint">Supports PDF, DOCX, DOC, PNG, JPG (Max 25 MB)</p>
        </div>
      )}

      {/* Tab 2: Previously Uploaded Resumes List */}
      {activeTab === 'history' && (
        <div className="previous-resumes-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {previousResumes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <HardDrive size={36} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 14 }}>No previously uploaded resumes found.</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>Upload a new resume using the tab above.</p>
            </div>
          ) : (
            previousResumes.map((resume) => {
              const isSelected = activeResume?.existingSessionId === resume.sessionId || activeResume?.name === resume.fileName;

              return (
                <div
                  key={resume.sessionId}
                  className={`glass-panel animate-pop-in ${isSelected ? 'selected-resume-card' : ''}`}
                  style={{
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(15, 118, 110, 0.08)' : '#FFFFFF',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(15, 118, 110, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {resume.fileName}
                        </h4>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: 'var(--text-secondary)' }}>
                          {formatFileSize(resume.fileSize)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {formatDate(resume.uploadedAt)}
                        </span>
                        <span>Role: <strong style={{ color: 'var(--text-main)' }}>{resume.targetRole || 'Software Engineer'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={ExternalLink}
                      iconPosition="right"
                      onClick={() => handlePreviewInNewTab(resume)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant={isSelected ? 'gradient' : 'secondary'}
                      size="sm"
                      icon={isSelected ? CheckCircle2 : Sparkles}
                      onClick={() => handleSelectPreviousResume(resume)}
                    >
                      {isSelected ? 'Selected' : 'Use Resume'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Remove Attached Resume Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => {
          setShowRemoveConfirm(false);
          updateResume(null);
          toast.info('Resume selection cleared');
        }}
        title="Remove Attached Resume"
        message="Are you sure you want to remove the currently attached resume? You will need to attach or choose another resume to generate the interview."
        confirmLabel="Remove Resume"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
}
