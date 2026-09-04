import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../../shared/components/layout/PageWrapper';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Input } from '../../../shared/components/ui/Input';
import { ProgressBar } from '../../../shared/components/ui/ProgressBar';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { formatDate, formatFileSize } from '../../../shared/utils/formatters';
import { useInterview } from '../../../shared/context/InterviewContext';
import { useToast } from '../../../shared/context/ToastContext';
import * as api from '../../../shared/utils/apiClient';
import {
  FileText,
  UploadCloud,
  ExternalLink,
  Play,
  Trash2,
  Calendar,
  HardDrive,
  Sparkles,
  Search,
  Plus,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import '../components/Resumes.css';

export function ResumesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateResume, updateConfig } = useInterview();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState('Full Stack Engineer');
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.listUploadedResumes();
      const list = res.data || res || [];
      if (Array.isArray(list)) {
        setResumes(list);
      }
    } catch (err) {
      toast.error('Failed to load resumes from vault');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(50);
      const res = await api.uploadResumeToVault(file, targetRoleInput);
      setUploadProgress(100);
      toast.success(`Resume "${file.name}" uploaded to vault successfully!`);
      setShowUploadBox(false);
      await fetchResumes();
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePreview = (resume) => {
    const sid = resume.sessionId || resume.id;
    if (sid) {
      const url = api.getResumeFileUrl(sid);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartInterviewWithResume = (resume) => {
    const resumeObj = {
      id: resume.sessionId,
      existingSessionId: resume.sessionId,
      isExistingResume: true,
      name: resume.fileName,
      size: resume.fileSize,
      type: resume.mimeType || 'application/pdf',
      updatedAt: resume.uploadedAt,
      title: resume.fileName,
      summary: resume.textSnippet || `Uploaded candidate resume for ${resume.targetRole || 'engineering'}.`,
    };

    updateResume(resumeObj);

    updateConfig({
      role: resume.targetRole || 'Software Engineer',
    });

    toast.success(`Loaded "${resume.fileName}" for new interview!`);
    navigate('/interviews/new', { state: { selectedResume: resumeObj, fromVault: true } });
  };

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    setDeleting(true);
    try {
      await api.deleteResume(resumeToDelete.sessionId);
      setResumes((prev) =>
        prev.filter(
          (r) => r.sessionId !== resumeToDelete.sessionId && r.fileName !== resumeToDelete.fileName
        )
      );
      toast.info(`Deleted "${resumeToDelete.fileName}" from vault`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete resume file');
    } finally {
      setResumeToDelete(null);
      setDeleting(false);
    }
  };

  const handleDeleteResumeClick = (e, resume) => {
    e.stopPropagation();
    setResumeToDelete(resume);
  };

  const filteredResumes = resumes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.fileName?.toLowerCase().includes(q) ||
      r.targetRole?.toLowerCase().includes(q) ||
      r.textSnippet?.toLowerCase().includes(q)
    );
  });

  return (
    <PageWrapper className="resumes-page">
      {/* Header */}
      <div className="resumes-header animate-fade-in">
        <div>
          <div className="resumes-title-badge">
            <Sparkles size={13} />
            <span>RESUME VAULT</span>
          </div>
          <h2 className="resumes-main-title">Candidate Resumes & Documents</h2>
          <p className="resumes-main-subtitle">
            All uploaded resumes indexed with full-text OCR extraction. Preview documents in full screen or start a customized practice interview anytime.
          </p>
        </div>

        <Button
          variant="gradient"
          icon={Plus}
          onClick={() => setShowUploadBox(!showUploadBox)}
        >
          {showUploadBox ? 'Close Upload' : 'Upload New Resume'}
        </Button>
      </div>

      {/* Upload Box (Toggleable) */}
      {showUploadBox && (
        <div className="uploaded-resume-card glass-panel animate-pop-in" style={{ padding: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Upload Resume Document</h4>
          
          <div style={{ marginBottom: 16, maxWidth: 360 }}>
            <Input
              label="Associated Target Role"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div
            className={`dropzone-box ${isDragging ? 'drag-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon-circle">
              <UploadCloud size={32} />
            </div>
            <h4 className="dropzone-title">
              Click to browse or drag & drop resume file (.pdf, .docx, .png, .jpg)
            </h4>
            <p className="dropzone-hint">Max file size: 25 MB</p>
          </div>

          {isUploading && (
            <div style={{ marginTop: 16 }}>
              <ProgressBar value={uploadProgress} max={100} size="sm" color="gradient" />
              <span style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, display: 'block' }}>
                Uploading document to vault ({uploadProgress}%)...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resumes by filename, target role, or extracted content..."
            style={{
              width: '100%',
              padding: '11px 14px 11px 40px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* List / Grid of Resumes */}
      {loading ? (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} className="stage-spinner" style={{ color: 'var(--color-primary)' }} />
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading resumes from vault...</span>
        </div>
      ) : filteredResumes.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? 'No matching resumes' : 'No resumes in vault yet'}
          description={
            searchQuery
              ? 'Try adjusting your search keywords.'
              : 'Upload your first resume document to store it in your personal vault.'
          }
          actionLabel="Upload Resume"
          onAction={() => setShowUploadBox(true)}
          actionIcon={UploadCloud}
        />
      ) : (
        <div className="resumes-grid animate-fade-in">
          {filteredResumes.map((resume) => (
            <div key={resume.sessionId} className="resumes-vault-card">
              <div className="vault-card-top">
                <div className="vault-doc-icon">
                  <FileText size={22} />
                </div>
                <div className="vault-info-col">
                  <h4 className="vault-file-name" title={resume.fileName}>
                    {resume.fileName}
                  </h4>
                  <div className="vault-meta-row">
                    <span className="vault-meta-item">
                      <HardDrive size={13} /> {formatFileSize(resume.fileSize)}
                    </span>
                    <span className="vault-meta-item">
                      <Calendar size={13} /> {formatDate(resume.uploadedAt)}
                    </span>
                  </div>
                </div>
                <span className="vault-role-badge">
                  {resume.targetRole || 'Software Engineer'}
                </span>
              </div>

              {/* Text Snippet Preview */}
              <div className="vault-snippet-box" title={resume.textSnippet}>
                {resume.textSnippet || 'Extracted resume text ready for AI analysis.'}
              </div>

              {/* Action Buttons */}
              <div className="vault-card-actions">
                <div className="vault-action-buttons">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ExternalLink}
                    iconPosition="right"
                    onClick={() => handlePreview(resume)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    icon={Play}
                    onClick={() => handleStartInterviewWithResume(resume)}
                  >
                    Practice
                  </Button>
                </div>

                <button
                  type="button"
                  className="vault-delete-btn"
                  onClick={(e) => handleDeleteResumeClick(e, resume)}
                  title="Delete resume"
                  aria-label="Delete resume"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Resume Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(resumeToDelete)}
        onClose={() => setResumeToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Resume Document"
        message={`Are you sure you want to delete "${resumeToDelete?.fileName}" from your vault? All OCR text extractions and file references will be permanently removed.`}
        confirmLabel="Delete Resume"
        variant="danger"
        icon={Trash2}
        isLoading={deleting}
      />
    </PageWrapper>
  );
}
