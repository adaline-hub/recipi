import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function TranslationModal({ recipe, onClose, onSaved }) {
  const { t } = useTranslation();

  // Pre-select a language that doesn't already have a translation
  const existingTranslations = recipe.translations || {};
  const availableLangs = SUPPORTED_LANGUAGES.filter(
    (l) => l.code !== recipe.language && !existingTranslations[l.code]
  );
  const defaultLang = availableLangs[0]?.code || SUPPORTED_LANGUAGES.find(l => l.code !== recipe.language)?.code || 'en';

  const [targetLang, setTargetLang] = useState(defaultLang);
  const [title, setTitle] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // When target language changes, pre-fill from existing translation if available
  function handleLangChange(lang) {
    setTargetLang(lang);
    const existing = existingTranslations[lang];
    if (existing) {
      setTitle(existing.title || '');
      setIngredientsText((existing.ingredients || []).join('\n'));
      setInstructions(existing.instructions || '');
      setNotes(existing.notes || '');
    } else {
      setTitle('');
      setIngredientsText('');
      setInstructions('');
      setNotes('');
    }
    setErrors({});
  }

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = t('form.error_title');
    const ings = ingredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (ings.length === 0) errs.ingredients = t('form.error_ingredients');
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const ingredients = ingredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const updatedTranslations = {
        ...existingTranslations,
        [targetLang]: {
          title: title.trim(),
          ingredients,
          instructions: instructions.trim(),
          notes: notes.trim(),
        },
      };

      await db.recipes.update(recipe.id, {
        translations: updatedTranslations,
        updatedAt: Date.now(),
      });

      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const langLabel = (code) => SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;
  const originalLangLabel = langLabel(recipe.language || 'en');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-lg rounded-t-3xl overflow-y-auto"
        style={{ backgroundColor: '#f0f9ff', maxHeight: '90vh' }}
      >
        {/* Modal header */}
        <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-6 pb-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">{t('translation.modal_title')}</h2>
            <button
              onClick={onClose}
              className="text-blue-100 text-2xl leading-none font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            {t('translation.modal_subtitle', { lang: originalLangLabel })}
          </p>
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Target language selector */}
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('translation.target_language')}
            </label>
            <select
              value={targetLang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white"
            >
              {SUPPORTED_LANGUAGES.filter((l) => l.code !== recipe.language).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                  {existingTranslations[lang.code] ? ` ✓` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reference: show original content */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-wide">
              {t('translation.original_label', { lang: originalLangLabel })}
            </p>
            <p className="text-gray-700 font-semibold">{recipe.title}</p>
            <p className="text-gray-500 text-sm">{recipe.ingredients.join(', ')}</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('form.label_name_required')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-lg focus:outline-none focus:border-blue-400 bg-white"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('form.label_ingredients')} <span className="normal-case font-normal text-blue-400">{t('form.ingredients_hint')}</span>
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
            />
            {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('form.label_instructions')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('form.label_notes')} <span className="normal-case font-normal text-blue-400">{t('form.optional_hint')}</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl text-white text-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {saving ? t('form.saving') : t('translation.save_button', { lang: langLabel(targetLang) })}
          </button>

          <div className="pb-4" />
        </div>
      </div>
    </div>
  );
}
