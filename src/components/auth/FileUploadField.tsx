import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, FileCheck2, Scale } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
}

export function FileUploadField({ label, onFileSelect, selectedFile, error }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) onFileSelect(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-surface-300 mb-2">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {!selectedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? 'border-primary-500 bg-primary-500/10'
              : error
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-surface-700 bg-surface-800/50 hover:border-primary-600 hover:bg-surface-800'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-surface-500" />
          <p className="text-sm text-surface-400">برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید</p>
          <p className="text-xs text-surface-600 mt-1">PNG, JPG, PDF حداکثر ۵ مگابایت</p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-surface-800 border border-primary-700/50 rounded-xl p-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-surface-200 truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={() => { onFileSelect(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="text-surface-500 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', container: 'gap-2' },
    md: { icon: 'w-10 h-10', text: 'text-xl', container: 'gap-2.5' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl', container: 'gap-3' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.container}`}>
      <div className={`${s.icon} rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/50`}>
        <Scale className="w-2/3 h-2/3 text-white" />
      </div>
      <span className={`${s.text} font-bold text-surface-50`}>قسطاس</span>
    </div>
  );
}
