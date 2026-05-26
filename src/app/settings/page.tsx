'use client';

import { useState, useRef } from 'react';
import { Upload, Database, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function SettingsPage() {
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: boolean; message: string } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = async (file: File) => {
    setCsvUploading(true);
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pms/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setCsvResult({ success: true, message: data.message + (data.warnings ? ` — ${data.warnings}` : '') });
      } else {
        setCsvResult({ success: false, message: data.error || 'Upload failed' });
      }
    } catch {
      setCsvResult({ success: false, message: 'Network error. Check your connection.' });
    } finally {
      setCsvUploading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedResult(null);

    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setSeedResult({ success: true, message: data.message });
      } else {
        setSeedResult({ success: false, message: data.error || 'Seed failed' });
      }
    } catch {
      setSeedResult({ success: false, message: 'Network error. Check your connection.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleCsvUpload(file);
    } else {
      setCsvResult({ success: false, message: 'Please drop a .csv file' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Page Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage data sources, trigger seed generation, and upload PMS data.
          </p>
        </div>

        {/* Section: Seed Data */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-violet-50 p-2">
              <Database className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Mock Data Seed</h3>
              <p className="text-xs text-gray-500">
                Generate 90 days of mock data for MVP testing
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Creates 1 property (Hotel Saison), 3 room types (Standard/Deluxe/Suite),
            90 days of daily rates, weather data, competitor prices, and sample events.
            Run this first if the database is empty.
          </p>

          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {seeding ? 'Generating...' : 'Generate Seed Data'}
          </button>

          {seedResult && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${seedResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
              {seedResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{seedResult.message}</span>
            </div>
          )}
        </section>

        {/* Section: PMS CSV Upload */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">PMS Data Upload (CSV)</h3>
              <p className="text-xs text-gray-500">
                Upload occupancy and revenue data from your PMS
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Upload a CSV file with columns: <code className="bg-gray-100 px-1 rounded text-xs">date, room_type, occupancy_rate, adr, revenue, available_rooms, booked_rooms</code>
          </p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {dragging ? 'Drop your CSV file here' : 'Drag & drop a CSV file, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Only .csv files are accepted</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCsvUpload(file);
              }}
              className="hidden"
            />
          </div>

          {csvUploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading and processing...</span>
            </div>
          )}

          {csvResult && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${csvResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
              {csvResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{csvResult.message}</span>
            </div>
          )}
        </section>

      </div>
    </>
  );
}

