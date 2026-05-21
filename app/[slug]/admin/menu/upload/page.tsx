'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function CSVUploadPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[]; created: { categories: number; items: number } } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/${slug}/menu/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
      
      if (data.success > 0) {
        setTimeout(() => {
          router.push(`/${slug}/admin/menu`);
        }, 3000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setResult({ success: 0, errors: [errorMessage], created: { categories: 0, items: 0 } });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `category,name,price,food_type
Starters,Paneer Tikka,299,veg
Starters,Egg Bhurji,199,egg
Starters,Chicken Wings,349,non-veg
Main Course,Butter Chicken,449,non-veg
Main Course,Dal Makhani,299,veg
Main Course,Egg Curry,249,egg
Desserts,Gulab Jamun,149,veg
Desserts,Ice Cream,99,veg
Beverages,Mango Lassi,99,veg
Beverages,Masala Chai,49,veg`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/${slug}/admin/menu`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Menu
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Upload Menu CSV</h1>
          <p className="text-sm text-gray-500 mt-1">Import your complete menu from a CSV file</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Sample CSV
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get a ready-to-use template with sample menu items. Just replace with your own data!
          </p>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download menu_template.csv
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!file ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-16 border-2 border-dashed border-gray-300 rounded-xl hover:border-black transition flex flex-col items-center gap-3 text-gray-600 hover:text-black"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to select CSV file</span>
                  <span className="text-sm text-gray-500">or drag and drop</span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-gray-600" />
                    <div>
                      <span className="font-medium block">{file.name}</span>
                      <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {result && (
              <div className={`p-6 rounded-xl ${result.success > 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                {result.success > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-bold text-lg">Upload Successful!</span>
                    </div>
                    <div className="text-green-700 space-y-1">
                      <p>✅ Created {result.created.categories} categories</p>
                      <p>✅ Imported {result.created.items} menu items</p>
                      <p className="text-sm mt-3">Redirecting to menu page...</p>
                    </div>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-bold text-lg">Errors Detected:</span>
                    </div>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  Upload & Import Menu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
