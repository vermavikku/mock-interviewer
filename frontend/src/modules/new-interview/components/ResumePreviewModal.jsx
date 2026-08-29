import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { FileText, Eye, AlignLeft, Check, Calendar, HardDrive, Download } from 'lucide-react';
import { formatDate, formatFileSize } from '../../../shared/utils/formatters';
import * as api from '../../../shared/utils/apiClient';

export function ResumePreviewModal({ isOpen, onClose, resume, onSelect }) {
  const [activeTab, setActiveTab] = useState('doc'); // 'doc' | 'text'

  if (!resume) return null;

  const fileUrl = resume.sessionId ? api.getResumeFileUrl(resume.sessionId) : '';
  const isPdf = resume.fileName?.toLowerCase().endsWith('.pdf') || resume.mimeType?.includes('pdf');
  const isImage = /\.(png|jpg|jpeg|webp)$/i.test(resume.fileName || '') || resume.mimeType?.includes('image');

  const handleSelectAndClose = () => {
    if (onSelect) onSelect(resume);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="resume-preview-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-main)' }}>
                {resume.fileName}
              </h3>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HardDrive size={13} /> {formatFileSize(resume.fileSize || 0)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> Uploaded on {formatDate(resume.uploadedAt)}
                </span>
              </div>
            </div>
          </div>

          <Badge variant="primary">{resume.targetRole || 'Uploaded Resume'}</Badge>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab('doc')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'doc' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'doc' ? '#fff' : 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Eye size={15} /> Document Viewer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'text' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'text' ? '#fff' : 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <AlignLeft size={15} /> Extracted Text Preview
          </button>
        </div>

        {/* Body Viewer */}
        <div style={{ height: '420px', borderRadius: 8, overflow: 'hidden', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.06)' }}>
          {activeTab === 'doc' ? (
            isPdf || isImage ? (
              <iframe
                src={fileUrl}
                title="Resume Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>Document Ready for Processing</h4>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-dim)', fontSize: 13 }}>
                    This document format can be inspected in the Extracted Text tab or downloaded.
                  </p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={resume.fileName}
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="outline" size="sm" icon={Download}>
                    Download Original File
                  </Button>
                </a>
              </div>
            )
          ) : (
            <div style={{ height: '100%', padding: 16, overflowY: 'auto', color: '#cbd5e1', fontSize: 13, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {resume.textSnippet && resume.textSnippet !== 'Extracted text processing...'
                ? resume.textSnippet
                : 'Raw text extracted via OCR and Gemini analysis will appear here during interview question synthesis.'}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="gradient" icon={Check} onClick={handleSelectAndClose}>
            Select This Resume
          </Button>
        </div>
      </div>
    </Modal>
  );
}
