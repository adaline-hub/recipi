import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db';
import { useRecipe } from '../hooks/useRecipes';
import { resizeAndEncode } from '../utils/imageUtils';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function RecipeForm({ recipeId, onBack, onSaved }) {
  const existing = useRecipe(recipeId);
  const { t, i18n } = useTranslation();
  const currentAppLang = i18n.language;

  const [title, setTitle] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [language, setLanguage] = useState(currentAppLang);
  const [createdBy, setCreatedBy] = useState(() => {
    // Load the last used creator name from localStorage, default to "Little B"
    return localStorage.getItem('lastCreatedBy') || 'Little B';
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = !!recipeId;

  // Pre-populate when editing
  useEffect(() => {
    if (existing) {
      // Show content for the current app language if a translation exists, else original
      const translations = existing.translations || {};
      const langContent = translations[currentAppLang] || null;

      if (langContent) {
        setTitle(langContent.title || existing.title);
        setIngredientsText((langContent.ingredients || existing.ingredients).join('\n'));
        setInstructions(langContent.instructions || existing.instructions || '');
        setNotes(langContent.notes || existing.notes || '');
      } else {
        setTitle(existing.title);
        setIngredientsText(existing.ingredients.join('\n'));
        setInstructions(existing.instructions || '');
        setNotes(existing.notes || '');
      }

      setPhoto(existing.photo || null);
      setLanguage(existing.language || 'en');
      // When editing, preserve the original createdBy (don't let them change it)
      if (existing.createdBy) {
        setCreatedBy(existing.createdBy);
      }
    }
  }, [existing, currentAppLang]);

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = t('form.error_title');
    const ings = ingredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (ings.length === 0) errs.ingredients = t('form.error_ingredients');
    if (!createdBy) errs.createdBy = t('form.error_created_by');
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

    const ingredients = ingredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const now = Date.now();

    try {
      if (isEdit) {
        const existingRecipe = await db.recipes.get(recipeId);
        const existingTranslations = existingRecipe?.translations || {};

        // Store the content for the current app language in translations
        const updatedTranslations = {
          ...existingTranslations,
          [currentAppLang]: {
            title: title.trim(),
            ingredients,
            instructions: instructions.trim(),
            notes: notes.trim(),
          },
        };

        // If editing in the original language, update top-level fields too
        const originalLang = existingRecipe?.language || language;
        const updatePayload = {
          language: originalLang,
          translations: updatedTranslations,
          photo: photo || null,
          updatedAt: now,
          // Don't change createdBy or createdAt when editing
        };

        if (currentAppLang === originalLang) {
          updatePayload.title = title.trim();
          updatePayload.ingredients = ingredients;
          updatePayload.instructions = instructions.trim();
          updatePayload.notes = notes.trim();
        }

        await db.recipes.update(recipeId, updatePayload);
        onSaved(recipeId);
      } else {
        const id = crypto.randomUUID();
        // For new recipes, store in both top-level and translations[language]
        const translations = {
          [language]: {
            title: title.trim(),
            ingredients,
            instructions: instructions.trim(),
            notes: notes.trim(),
          },
        };

        // Save the last used creator name
        if (createdBy.trim()) {
          localStorage.setItem('lastCreatedBy', createdBy.trim());
        }

        await db.recipes.add({
          id,
          title: title.trim(),
          ingredients,
          instructions: instructions.trim(),
          notes: notes.trim(),
          photo: photo || null,
          language,
          translations,
          createdBy: createdBy.trim() || null,
          createdAt: now,
          updatedAt: now,
        });
        onSaved(id);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-blue-100 text-sm mb-3">
          {t('form.back')}
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? t('form.title_edit') : t('form.title_add')}
        </h1>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Language (only shown when creating a new recipe) */}
        {!isEdit && (
          <div>
            <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
              {t('form.label_language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="text-blue-400 text-xs mt-1">{t('form.language_hint')}</p>
          </div>
        )}

        {/* Created by (only shown when creating a new recipe) */}
        {!isEdit && (
          <div>
            <label className="block text-blue-700 font-bold mb-2 text-sm uppercase tracking-wide">
              {t('form.label_created_by')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Little Pan', 'Little B'].map((option) => (
                <label key={option} className="flex items-center p-3 rounded-xl border-2 border-blue-200 bg-white cursor-pointer hover:bg-blue-50 transition-colors"
                  style={{ borderColor: createdBy === option ? '#3b82f6' : '#bfdbfe', backgroundColor: createdBy === option ? '#eff6ff' : '#ffffff' }}>
                  <input
                    type="radio"
                    name="createdBy"
                    value={option}
                    checked={createdBy === option}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-3 text-base text-gray-800">{option}</span>
                </label>
              ))}
            </div>
            {errors.createdBy && <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>}
            <p className="text-blue-400 text-xs mt-2">{t('form.created_by_hint')}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
            {t('form.label_name_required')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grandma's Apple Pie"
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
            placeholder={t('form.ingredients_placeholder')}
            rows={6}
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
            placeholder="Step 1: Preheat oven to 350°F..."
            rows={8}
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
            placeholder="Tips, substitutions, family memories..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-400 bg-white resize-none"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-blue-700 font-bold mb-1 text-sm uppercase tracking-wide">
            {t('form.label_photo')} <span className="normal-case font-normal text-blue-400">{t('form.optional_hint')}</span>
          </label>
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Recipe" className="w-full rounded-xl object-cover max-h-64" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer bg-white hover:bg-blue-50">
              <span className="text-3xl">📷</span>
              <span className="text-blue-400 text-sm mt-1">{t('form.photo_tap')}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const b64 = await resizeAndEncode(file);
                    setPhoto(b64);
                  } catch {
                    // fail silently — photo is optional
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl text-white text-lg font-semibold disabled:opacity-60"
          style={{ backgroundColor: '#3b82f6' }}
        >
          {saving ? t('form.saving') : isEdit ? t('form.save_edit') : t('form.save_new')}
        </button>
      </div>
    </div>
  );
}
