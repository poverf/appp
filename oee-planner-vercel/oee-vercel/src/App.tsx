import { useState, useCallback } from 'react';
import { Activity, BarChart2, Cpu, Upload, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell, Legend, PieChart, Pie,
} from 'recharts';
import type { OEERecord, FailurePrediction, PlannerPrediction, Tab } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const riskColor = (level: string) => ({
  Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444',
}[level] ?? '#94a3b8');

const oeeColor = (v: number) => v >= 85 ? '#22c55e' : v >= 65 ? '#f59e0b' : '#ef4444';

const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// ─── Gauge ────────────────────────────────────────────────────────────────────

function Gauge({ value, label, color }: { value: number; label: string; color: string }) {
  const data = [{ value }, { value: 100 - value }];
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: 100, height: 60, position: 'relative' }}>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={30}
              outerRadius={42}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#1e2d45" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', bottom: 4, left: 0, right: 0,
          textAlign: 'center', fontSize: 14, fontWeight: 700, color,
        }}>
          {value.toFixed(1)}%
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, unit = '', color = '#3b82f6', icon: Icon }: {
  label: string; value: string | number; unit?: string; color?: string; icon: any;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div style={{ background: color + '22', borderRadius: 8, padding: 10 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>
          {value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ data }: { data: OEERecord[] }) {
  const [selected, setSelected] = useState<OEERecord | null>(null);
  const [prediction, setPrediction] = useState<FailurePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const machines = Array.from(new Set(data.map(d => d.machine)));
  const avgOEE = avg(data.map(d => d.oee));
  const avgAR = avg(data.map(d => d.ar));
  const avgPR = avg(data.map(d => d.pr));
  const avgQR = avg(data.map(d => d.qr));
  const totalGood = data.reduce((s, d) => s + d.goodCount, 0);
  const totalBad = data.reduce((s, d) => s + d.badCount, 0);

  const machineAvg = machines.map(m => {
    const rows = data.filter(d => d.machine === m);
    return { machine: m.length > 12 ? m.slice(0, 12) + '…' : m, oee: +avg(rows.map(d => d.oee)).toFixed(1) };
  });

  const shiftData = Array.from(new Set(data.map(d => d.shift))).map(s => {
    const rows = data.filter(d => d.shift === s);
    return { shift: s, OEE: +avg(rows.map(d => d.oee)).toFixed(1), AR: +avg(rows.map(d => d.ar)).toFixed(1), PR: +avg(rows.map(d => d.pr)).toFixed(1) };
  });

  const analyzeFailure = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const r = await fetch('/api/predict-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineData: selected }),
      });
      const json = await r.json();
      setPrediction(json);
    } catch {
      setPrediction({ riskScore: 50, riskLevel: 'Medium', explanation: 'Analysis unavailable', recommendations: ['Manual check required'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <KpiCard label="Plant OEE" value={avgOEE.toFixed(1)} unit="%" color={oeeColor(avgOEE)} icon={Activity} />
        <KpiCard label="Availability" value={avgAR.toFixed(1)} unit="%" color="#06b6d4" icon={CheckCircle} />
        <KpiCard label="Performance" value={avgPR.toFixed(1)} unit="%" color="#8b5cf6" icon={TrendingUp} />
        <KpiCard label="Quality" value={avgQR.toFixed(1)} unit="%" color="#22c55e" icon={BarChart2} />
        <KpiCard label="Good Parts" value={totalGood.toLocaleString()} color="#22c55e" icon={CheckCircle} />
        <KpiCard label="Rejected" value={totalBad.toLocaleString()} color="#ef4444" icon={XCircle} />
      </div>

      {/* Gauges */}
      <div className="card">
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Plant Performance Overview
        </div>
        <div className="flex gap-8 flex-wrap">
          <Gauge value={avgOEE} label="OEE" color={oeeColor(avgOEE)} />
          <Gauge value={avgAR} label="Availability" color="#06b6d4" />
          <Gauge value={avgPR} label="Performance" color="#8b5cf6" />
          <Gauge value={avgQR} label="Quality" color="#22c55e" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card">
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            OEE by Machine
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={machineAvg} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis dataKey="machine" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#161d2e', border: '1px solid #1e2d45', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="oee" name="OEE %">
                {machineAvg.map((e, i) => <Cell key={i} fill={oeeColor(e.oee)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Performance by Shift
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={shiftData} margin={{ top: 4, right: 4, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis dataKey="shift" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#161d2e', border: '1px solid #1e2d45', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="OEE" fill="#3b82f6" />
              <Bar dataKey="AR" fill="#06b6d4" />
              <Bar dataKey="PR" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure Prediction */}
      <div className="card">
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          AI Failure Prediction
        </div>
        <div className="flex gap-3 flex-wrap mb-4">
          {machines.map(m => (
            <button
              key={m}
              onClick={() => { setSelected(data.find(d => d.machine === m) || null); setPrediction(null); }}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                borderColor: selected?.machine === m ? '#3b82f6' : '#1e2d45',
                background: selected?.machine === m ? '#3b82f622' : 'transparent',
                color: selected?.machine === m ? '#3b82f6' : '#94a3b8',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {selected && (
          <button className="btn-primary" onClick={analyzeFailure} disabled={loading}>
            {loading ? 'Analyzing…' : 'Run AI Analysis →'}
          </button>
        )}
        {prediction && (
          <div style={{ marginTop: 16, padding: 16, background: '#0a0e1a', borderRadius: 8, border: `1px solid ${riskColor(prediction.riskLevel)}33` }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                background: riskColor(prediction.riskLevel) + '22',
                color: riskColor(prediction.riskLevel),
                padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              }}>
                {prediction.riskLevel} Risk — {prediction.riskScore}/100
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}>{prediction.explanation}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prediction.recommendations.map((r, i) => (
                <li key={i} style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 8 }}>
                  <span style={{ color: riskColor(prediction.riskLevel) }}>›</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Planner ──────────────────────────────────────────────────────────────────

function Planner() {
  const [form, setForm] = useState({ machine: '', shift: 'A', targetCount: '', partWt: '', goodCount: '', badCount: '' });
  const [result, setResult] = useState<PlannerPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/planner-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, targetCount: +form.targetCount, partWt: +form.partWt, goodCount: +form.goodCount, badCount: +form.badCount }),
      });
      setResult(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { k: 'machine', label: 'Machine Name', placeholder: 'e.g. CNC-1' },
    { k: 'targetCount', label: 'Target Count', placeholder: '1200', type: 'number' },
    { k: 'partWt', label: 'Part Weight (g)', placeholder: '250', type: 'number' },
    { k: 'goodCount', label: 'Expected Good Count', placeholder: '1100', type: 'number' },
    { k: 'badCount', label: 'Expected Bad Count', placeholder: '100', type: 'number' },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <div className="card space-y-4">
        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Shift Planner — OEE Prediction
        </div>
        {fields.map(f => (
          <div key={f.k}>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input
              className="input"
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={(form as any)[f.k]}
              onChange={set(f.k)}
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Shift</label>
          <select className="input" value={form.shift} onChange={set('shift')}>
            {['A', 'B', 'C', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={loading || !form.machine}>
          {loading ? 'Predicting…' : 'Predict OEE →'}
        </button>
      </div>

      {result && (
        <div className="card space-y-4">
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Predicted Results
          </div>
          <div className="flex gap-6 flex-wrap">
            <Gauge value={result.predictedOEE || 0} label="OEE" color={oeeColor(result.predictedOEE || 0)} />
            <Gauge value={result.predictedAR || 0} label="Availability" color="#06b6d4" />
            <Gauge value={result.predictedPR || 0} label="Performance" color="#8b5cf6" />
          </div>
          <div style={{ background: '#0a0e1a', borderRadius: 8, padding: 14, border: '1px solid #1e2d45', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
            {result.insights}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────

function UploadPanel({ onData }: { onData: (d: OEERecord[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setStatus(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch('/api/upload-oee', { method: 'POST', body: fd });
      const json = await r.json();
      if (json.error) { setStatus('Error: ' + json.error); return; }
      onData(json.data);
      setStatus(`✓ Loaded ${json.data.length} records from "${file.name}"`);
    } catch {
      setStatus('Upload failed. Check file format.');
    } finally {
      setLoading(false);
    }
  }, [onData]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) upload(f);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? '#3b82f6' : '#1e2d45'}`,
        borderRadius: 12, padding: '2.5rem', textAlign: 'center',
        background: dragging ? '#3b82f611' : 'transparent',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload size={32} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
      <div style={{ fontSize: 15, color: '#f1f5f9', marginBottom: 6 }}>Drop OEE Excel file here</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>.xlsx / .xls — columns: Machine, Shift, OEE, Good Count…</div>
      <input id="file-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      {loading && <div style={{ marginTop: 14, fontSize: 12, color: '#3b82f6' }}>Parsing…</div>}
      {status && (
        <div style={{ marginTop: 14, fontSize: 12, color: status.startsWith('✓') ? '#22c55e' : '#ef4444' }}>
          {status}
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<OEERecord[]>([]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'planner', label: 'Planner', icon: Cpu },
    { id: 'prediction', label: 'Upload Data', icon: Upload },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1e2d45', padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', gap: '2rem', height: 56,
        background: '#0d1424', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', color: '#f1f5f9' }}>
            OEE PLANNER
          </span>
          <span style={{ fontSize: 10, color: '#3b82f6', background: '#3b82f622', padding: '1px 8px', borderRadius: 10 }}>
            INDUSTRIAL ANALYTICS
          </span>
        </div>
        <nav className="flex gap-1 ml-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px',
                borderRadius: 6, fontSize: 12, cursor: 'pointer', border: 'none',
                background: tab === t.id ? '#3b82f622' : 'transparent',
                color: tab === t.id ? '#3b82f6' : '#94a3b8',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'prediction' || (tab === 'dashboard' && data.length === 0) ? (
          <div>
            {tab === 'dashboard' && data.length === 0 && (
              <div style={{ marginBottom: 20, padding: '10px 16px', background: '#f59e0b11', border: '1px solid #f59e0b33', borderRadius: 8, fontSize: 13, color: '#fbbf24' }}>
                <AlertTriangle size={13} style={{ display: 'inline', marginRight: 6 }} />
                No data loaded. Upload an Excel file to begin.
              </div>
            )}
            <UploadPanel onData={d => { setData(d); setTab('dashboard'); }} />
          </div>
        ) : tab === 'dashboard' ? (
          <Dashboard data={data} />
        ) : (
          <Planner />
        )}
      </main>
    </div>
  );
}
