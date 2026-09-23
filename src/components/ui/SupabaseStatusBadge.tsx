import React, { useState } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, X, Copy, ExternalLink } from 'lucide-react';

export const SupabaseStatusBadge: React.FC = () => {
  const { supabaseStatus, isLoadingData, checkConnection, showToast } = useScholarship();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await checkConnection();
      setTestResult(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const copyEnvTemplate = () => {
    const text = `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`;
    navigator.clipboard.writeText(text);
    showToast('คัดลอกรูปแบบ .env เรียบร้อยแล้ว', 'success');
  };

  const isConnected = supabaseStatus === 'connected';

  return (
    <>
      {/* Floating Status Pill */}
      <div 
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: '30px',
          background: isConnected 
            ? 'linear-gradient(135deg, rgba(7, 123, 56, 0.95), rgba(4, 90, 40, 0.95))' 
            : 'linear-gradient(135deg, rgba(29, 41, 57, 0.95), rgba(15, 23, 42, 0.95))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 600,
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
          cursor: 'pointer',
          border: isConnected 
            ? '1px solid rgba(52, 211, 153, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.15)',
          transition: 'all 0.2s ease',
        }}
        title="คลิกเพื่อดูสถานะและคำแนะนำการตั้งค่า Supabase"
      >
        <Database size={15} style={{ color: isConnected ? '#34d399' : '#fbbf24' }} />
        <span>
          {isConnected ? 'Supabase: เชื่อมต่อแล้ว' : 'Supabase: Demo Mode (Local)'}
        </span>
        {isLoadingData && <RefreshCw size={12} className="spinning" />}
      </div>

      {/* Info & Setup Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            style={{
              background: 'var(--surface-card)',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div 
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isConnected ? '#ecfdf5' : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={24} style={{ color: isConnected ? '#059669' : '#d97706' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                  สถานะการเชื่อมต่อ Supabase
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  ระบบฐานข้อมูลและคลาวด์สำหรับเว็บทุนการศึกษา มจพ.
                </p>
              </div>
            </div>

            {/* Status Banner */}
            <div 
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 20,
                background: isConnected ? '#ecfdf5' : '#f8fafc',
                border: isConnected ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              {isConnected ? (
                <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: isConnected ? '#065f46' : '#92400e', display: 'block', marginBottom: 2 }}>
                  {isConnected 
                    ? 'เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จ (Real-time Cloud)' 
                    : 'กำลังทำงานในโหมด Demo LocalStorage'}
                </strong>
                <span style={{ color: '#475569' }}>
                  {isConnected 
                    ? 'ข้อมูลการสมัครและทุนการศึกษาจะถูกบันทึกและซิงค์ผ่านคลาวด์แบบเรียลไทม์' 
                    : 'สามารถใช้งานเว็บไซต์และยื่นสมัครได้ตามปกติ โดยข้อมูลจะถูกบันทึกในเบราว์เซอร์ของท่าน'}
                </span>
              </div>
            </div>

            {/* Setup Instructions */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                📌 วิธีเชื่อมต่อกับ Supabase จริง:
              </h4>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: '#334155', lineHeight: 1.8 }}>
                <li>
                  สร้างโปรเจกต์ใหม่ที่เว็บไซต์{' '}
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    Supabase.com <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  ไปที่แท็บ <strong>SQL Editor</strong> ใน Supabase Dashboard แล้วนำโค้ดจากไฟล์ <code>supabase/schema.sql</code> ไปกด Run เพื่อสร้างตารางและข้อมูลตั้งต้น
                </li>
                <li>
                  คัดลอก <strong>Project URL</strong> และ <strong>anon key</strong> จากเมนู <em>Project Settings &gt; API</em>
                </li>
                <li>
                  นำค่ามาใส่ในไฟล์ <code>.env</code> ของโปรเจกต์นี้
                </li>
              </ol>
            </div>

            {/* Code Snippet Box */}
            <div style={{ background: '#0f172a', borderRadius: 8, padding: 14, marginBottom: 20, position: 'relative' }}>
              <button 
                onClick={copyEnvTemplate}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Copy size={12} /> คัดลอก
              </button>
              <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.82rem', fontFamily: 'monospace' }}>
{`# ไฟล์ .env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...`}
              </pre>
            </div>

            {/* Test Connection Button */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button 
                onClick={handleTest}
                disabled={isTesting}
                style={{
                  background: '#077b38',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={16} className={isTesting ? 'spinning' : ''} />
                {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ (Test Connection)'}
              </button>

              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>

            {testResult && (
              <div style={{ marginTop: 12, fontSize: '0.85rem', color: isConnected ? '#059669' : '#dc2626' }}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
