import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportRecipes, importRecipes } from '../utils/importExport';

export default function ImportExport({ onBack }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();

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
        message: t('importexport.import_summary', { added: result.added, updated: result.updated, skipped: result.skipped }),
      });
    } catch (err) {
      setStatus({ type: 'error', message: t('importexport.import_error', { error: err.message }) });
    } finally {
      setImporting(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-blue-100 text-sm mb-3">
          {t('importexport.back')}
        </button>
        <h1 className="text-2xl font-bold text-white">{t('importexport.title')}</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Export */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">📤 {t('importexport.export_button')}</h2>
          <p className="text-gray-500 text-sm mb-4">{t('importexport.export_hint')}</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-4 rounded-xl text-white text-base font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {exporting ? '…' : t('importexport.export_button')}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-1">📥 {t('importexport.import_button')}</h2>
          <p className="text-gray-500 text-sm mb-4">{t('importexport.import_hint')}</p>
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
            className={`block w-full py-4 rounded-xl text-center text-base font-semibold cursor-pointer border-2 border-blue-300 text-blue-600 ${
              importing ? 'opacity-60 pointer-events-none' : 'hover:bg-blue-50'
            }`}
          >
            {importing ? '…' : t('importexport.import_button')}
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
