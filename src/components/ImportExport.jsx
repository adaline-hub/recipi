import { useRef, useState } from 'react';
import { exportRecipes, importRecipes } from '../utils/importExport';

export default function ImportExport({ onBack }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    setStatus(null);
    try {
      await exportRecipes();
      setStatus({ type: 'success', message: 'Export downloaded!' });
    } catch (err) {
      setStatus({ type: 'error', message: `Export failed: ${err.message}` });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setStatus(null);
    try {
      const result = await importRecipes(file);
      setStatus({
        type: 'success',
        message: `Done! Added ${result.added}, Updated ${result.updated}, Skipped ${result.skipped}`,
      });
    } catch (err) {
      setStatus({ type: 'error', message: `Import failed: ${err.message}` });
    } finally {
      setImporting(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-orange-100 text-sm mb-3">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">Import / Export</h1>
        <p className="text-orange-100 text-sm mt-1">Back up or move your recipes</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Export */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">📤 Export Recipes</h2>
          <p className="text-gray-500 text-sm mb-4">
            Download all your recipes as a JSON file. Great for backups or moving to another device.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-4 rounded-xl text-white text-base font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#f97316' }}
          >
            {exporting ? 'Exporting…' : 'Download Backup'}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">📥 Import Recipes</h2>
          <p className="text-gray-500 text-sm mb-4">
            Load recipes from a Recipi JSON backup. New recipes will be added; existing ones updated only if newer.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className={`block w-full py-4 rounded-xl text-center text-base font-semibold cursor-pointer border-2 border-orange-300 text-orange-600 ${
              importing ? 'opacity-60 pointer-events-none' : 'hover:bg-orange-50'
            }`}
          >
            {importing ? 'Importing…' : 'Choose JSON File'}
          </label>
        </div>

        {/* Status message */}
        {status && (
          <div
            className={`rounded-xl p-4 text-center font-medium ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
