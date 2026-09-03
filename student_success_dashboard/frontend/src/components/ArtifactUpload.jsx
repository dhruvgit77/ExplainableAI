import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import GlassCard from './GlassCard';

/**
 * Real agentic Tier-3 extraction. Uploads the student's actual work (exam
 * scripts, reports, PDFs, code) and has the Claude agent mesh MEASURE the Tier-3
 * cognitive features from it — instead of estimating them from the typed fields.
 *
 * Props:
 *   profile   — the current Tier-1/2 form values (sent so the Full model can predict)
 *   onResult  — callback(resultObject) shaped like the /predict response
 */
export default function ArtifactUpload({ profile, onResult }) {
  const [available, setAvailable] = useState(null); // null = checking
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getExtractionStatus()
      .then((s) => setAvailable(s.available))
      .catch(() => setAvailable(false));
  }, []);

  function addFiles(list) {
    const incoming = Array.from(list || []);
    if (incoming.length) setFiles((prev) => [...prev, ...incoming]);
    setError('');
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleExtract() {
    if (!files.length) { setError('Add at least one file.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.extractArtifacts(files, profile);
      // Shape into the same object the manual /predict flow produces.
      const result = res.prediction
        ? { ...res.prediction, agentic_features: res.agentic_features, extraction_source: 'measured' }
        : { agentic_features: res.agentic_features, extraction_source: 'measured' };
      onResult?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const subtitle = available === false
    ? 'Server has no ANTHROPIC_API_KEY set — this real pipeline is offline. The fields below will estimate Tier-3 instead.'
    : "Upload the student's actual work. GPT-4o agent mesh (authenticity → comprehension → code → profile) measures the Tier-3 features directly from it.";

  return (
    <GlassCard title="🔬 GPT-4o Agentic Extraction — Measure Tier-3 from Student Work">
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
        {subtitle}
      </p>

      <div
        className="file-drop-zone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        style={available === false ? { opacity: 0.6 } : undefined}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={{ marginTop: 8, fontWeight: 600 }}>Click or drag files (PDF, image, report, code)</p>
        <input
          ref={fileRef} type="file" multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.py,.java,.c,.cpp,.js,.jsx,.ts,.tsx,.go,.rs,.sql"
          onChange={(e) => addFiles(e.target.files)} style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', padding: '4px 8px', background: 'var(--color-border-light)', borderRadius: 6 }}>
              <span>📎 {f.name} <span style={{ color: 'var(--color-text-muted)' }}>({(f.size / 1024).toFixed(0)} KB)</span></span>
              <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 700 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="info-box error" style={{ marginTop: 12 }}>{error}</div>}

      <button
        className="btn btn-primary"
        onClick={handleExtract}
        disabled={loading || available === false || files.length === 0}
        style={{ width: '100%', marginTop: 14, padding: '12px 24px' }}
      >
        {loading ? '🔬 Agents analysing the work…' : '🔬 Extract Tier-3 & Predict from Work'}
      </button>
    </GlassCard>
  );
}
