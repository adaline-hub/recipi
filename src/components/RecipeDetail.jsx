import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipe } from '../hooks/useRecipes';
import { db } from '../db';
import { deleteRecipeFromSupabase } from '../lib/supabaseSync';

const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
  ja: '日本語',
  'zh-CN': '中文（简体）',
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function RecipeDetail({ recipeId, onBack, onEdit }) {
  const recipe = useRecipe(recipeId);
  const [confirming, setConfirming] = useState(false);
  const [showTranslateForm, setShowTranslateForm] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');
  const [translateTitle, setTranslateTitle] = useState('');
  const [translateIngredientsText, setTranslateIngredientsText] = useState('');
  const [translateInstructions, setTranslateInstructions] = useState('');
  const [translateNotes, setTranslateNotes] = useState('');
  const [translateErrors, setTranslateErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  async function handleDelete() {
    // Delete from local db first
    await db.recipes.delete(recipeId);
    
    // Also delete from Supabase
    await deleteRecipeFromSupabase(recipeId);
    
    onBack();
  }

  function openTranslateForm() {
    // Pre-select a language that doesn't already have a translation
    const existingTranslations = recipe.translations || {};
    const availableLangs = SUPPORTED_LANGUAGES.filter(
      (l) => l.code !== recipe.language && !existingTranslations[l.code]
    );
    const defaultLang = availableLangs[0]?.code || 'en';
    
    setTranslateLang(defaultLang);
    setTranslateTitle('');
    setTranslateIngredientsText('');
    setTranslateInstructions('');
    setTranslateNotes('');
    setTranslateErrors({});
    setShowTranslateForm(true);
  }

  function validateTranslation() {
    const errs = {};
    if (!translateTitle.trim()) errs.title = t('form.error_title');
    const ings = translateIngredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (ings.length === 0) errs.ingredients = t('form.error_ingredients');
    return errs;
  }

  async function handleSaveTranslation() {
    const errs = validateTranslation();
    if (Object.keys(errs).length > 0) {
      setTranslateErrors(errs);
      return;
    }
    setTranslateErrors({});
    setSaving(true);

    try {
      const ingredients = translateIngredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
      
      // Format current date
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const existingTranslations = recipe.translations || {};
      const updatedTranslations = {
        ...existingTranslations,
        [translateLang]: {
          title: translateTitle.trim(),
          ingredients,
          instructions: translateInstructions.trim(),
          notes: translateNotes.trim(),
          translatedBy: recipe.createdBy || 'Unknown',
          translatedDate: Date.now(),
          translatedDateFormatted: dateStr,
          isAutoTranslated: false, // Manual translation
        },
      };

      await db.recipes.update(recipe.id, {
        translations: updatedTranslations,
        updatedAt: Date.now(),
      });

      setShowTranslateForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
        <p className="text-blue-400 text-lg">{t('detail.loading')}</p>
      </div>
    );
  }

  // Resolve displayed content: prefer translation for current app language, fall back to original
  const translations = recipe.translations || {};
  const translatedContent = translations[currentLang];
  const isTranslated = !!translatedContent && currentLang !== recipe.language;
  const isOriginalLang = currentLang === recipe.language;

  const displayTitle = translatedContent?.title || recipe.title;
  const displayIngredients = translatedContent?.ingredients || recipe.ingredients;
  const displayInstructions = translatedContent?.instructions ?? recipe.instructions;
  const displayNotes = translatedContent?.notes ?? recipe.notes;

  const originalLangLabel = LANGUAGE_LABELS[recipe.language] || recipe.language || 'English';
  const currentLangLabel = LANGUAGE_LABELS[currentLang] || currentLang;
  
  // Get translation metadata if available
  const translationMetadata = isTranslated ? translatedContent : null;

  // Count available translations (excluding original language)
  const translationCount = Object.keys(translations).filter((l) => l !== recipe.language).length;

  // Format dates
  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-blue-100 text-sm mb-3 flex items-center gap-1">
          {t('detail.back')}
        </button>
        <h1 className="text-2xl font-bold text-white leading-tight">{displayTitle}</h1>

        {/* Creator and date info */}
        {isTranslated && translationMetadata ? (
          // Show translation info when viewing a translation
          <div className="mt-2 text-blue-100 text-sm">
            {translationMetadata.translatedBy && translationMetadata.translatedDateFormatted && (
              <p>
                {t('detail.translated_by_on', {
                  creator: translationMetadata.translatedBy,
                  date: translationMetadata.translatedDateFormatted,
                })}
              </p>
            )}
            {translationMetadata.isAutoTranslated && (
              <p className="text-xs text-blue-200 mt-0.5">✨ Auto-translated</p>
            )}
          </div>
        ) : (
          // Show original recipe info
          (recipe.createdBy || recipe.createdAt) && (
            <div className="mt-2 text-blue-100 text-sm">
              {recipe.createdBy && recipe.createdAt && (
                <p>{t('detail.created_by_on', { creator: recipe.createdBy, date: formatDate(recipe.createdAt) })}</p>
              )}
              {recipe.createdBy && !recipe.createdAt && (
                <p>{t('detail.created_by', { creator: recipe.createdBy })}</p>
              )}
              {!recipe.createdBy && recipe.createdAt && (
                <p>{t('detail.created_on', { date: formatDate(recipe.createdAt) })}</p>
              )}
            </div>
          )
        )}

        {/* Last modified */}
        {recipe.updatedAt && recipe.updatedAt !== recipe.createdAt && (
          <div className="mt-1 text-blue-200 text-xs">
            {t('detail.last_modified', { date: formatDateTime(recipe.updatedAt) })}
          </div>
        )}

        {/* Language badge row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Original language tag */}
          <span className="bg-blue-600 text-blue-100 text-xs px-2 py-0.5 rounded-full">
            {t('detail.original_language', { lang: originalLangLabel })}
          </span>

          {/* "Viewing in X" tag when showing a translation */}
          {isTranslated && (
            <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {t('detail.viewing_translation', { lang: currentLangLabel })}
            </span>
          )}

          {/* Translation count badge */}
          {translationCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {t('detail.translation_count', { count: translationCount })}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Photo */}
        {recipe.photo && (
          <img
            src={recipe.photo}
            alt={displayTitle}
            className="w-full rounded-2xl object-cover max-h-72 mb-2"
          />
        )}

        {/* Translation notice when viewing original but a translation exists for another language */}
        {!isTranslated && !isOriginalLang && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-600">
            {t('detail.showing_original_notice', { lang: originalLangLabel })}
          </div>
        )}

        {/* Ingredients */}
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-3 uppercase tracking-wide">{t('detail.ingredients')}</h2>
          <ul className="space-y-2">
            {displayIngredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 text-base">
                <span className="text-blue-400 mt-1">•</span>
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        {displayInstructions && (
          <section>
            <h2 className="text-lg font-bold text-blue-700 mb-3 uppercase tracking-wide">{t('detail.instructions')}</h2>
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{displayInstructions}</p>
          </section>
        )}

        {/* Notes */}
        {displayNotes && (
          <section>
            <h2 className="text-lg font-bold text-blue-700 mb-3 uppercase tracking-wide">{t('detail.notes')}</h2>
            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">{displayNotes}</p>
          </section>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => onEdit(recipe.id)}
            className="w-full py-4 rounded-xl text-white text-lg font-semibold"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {t('detail.edit')}
          </button>

          {/* Translate button */}
          <button
            onClick={openTranslateForm}
            className="w-full py-4 rounded-xl border-2 border-blue-300 text-blue-600 text-lg font-semibold bg-white"
          >
            🌐 {t('detail.translate_to', { lang: LANGUAGE_LABELS[currentLang] })}
          </button>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full py-4 rounded-xl border-2 border-red-300 text-red-500 text-lg font-semibold"
            >
              {t('detail.delete')}
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-red-600 font-medium text-center">{t('detail.confirm_msg')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-600 font-semibold"
                >
                  {t('detail.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-lg bg-red-500 text-white font-semibold"
                >
                  {t('detail.confirm_delete')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Translation Form Modal */}
      {showTranslateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-700">{t('detail.translate_to', { lang: LANGUAGE_LABELS[translateLang] })}</h2>
              <button onClick={() => setShowTranslateForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            {/* Language selector */}
            <div>
              <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
                {t('form.label_language')}
              </label>
              <select
                value={translateLang}
                onChange={(e) => setTranslateLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white"
              >
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== recipe.language && !(recipe.translations || {})[l.code]).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
                {t('form.label_name_required')}
              </label>
              <input
                type="text"
                value={translateTitle}
                onChange={(e) => setTranslateTitle(e.target.value)}
                placeholder={recipe.title}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white"
              />
              {translateErrors.title && <p className="text-red-500 text-sm mt-1">{translateErrors.title}</p>}
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
                {t('form.label_ingredients')}
              </label>
              <textarea
                value={translateIngredientsText}
                onChange={(e) => setTranslateIngredientsText(e.target.value)}
                placeholder={recipe.ingredients.join('\n')}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
              />
              {translateErrors.ingredients && <p className="text-red-500 text-sm mt-1">{translateErrors.ingredients}</p>}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
                {t('form.label_instructions')}
              </label>
              <textarea
                value={translateInstructions}
                onChange={(e) => setTranslateInstructions(e.target.value)}
                placeholder={recipe.instructions}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
                {t('form.label_notes')}
              </label>
              <textarea
                value={translateNotes}
                onChange={(e) => setTranslateNotes(e.target.value)}
                placeholder={recipe.notes || ''}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveTranslation}
              disabled={saving}
              className="w-full py-4 rounded-xl text-white text-lg font-semibold disabled:opacity-60"
              style={{ backgroundColor: '#3b82f6' }}
            >
              {saving ? t('form.saving') : t('form.save_new')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
