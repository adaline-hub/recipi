import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipe } from '../hooks/useRecipes';
import { db } from '../db';
import TranslationModal from './TranslationModal';

const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
  ja: '日本語',
  'zh-CN': '中文（简体）',
};

export default function RecipeDetail({ recipeId, onBack, onEdit }) {
  const recipe = useRecipe(recipeId);
  const [confirming, setConfirming] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  async function handleDelete() {
    await db.recipes.delete(recipeId);
    onBack();
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

  // Count available translations (excluding original language)
  const translationCount = Object.keys(translations).filter((l) => l !== recipe.language).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-blue-100 text-sm mb-3 flex items-center gap-1">
          {t('detail.back')}
        </button>
        <h1 className="text-2xl font-bold text-white leading-tight">{displayTitle}</h1>

        {/* Language badge row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
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

          {/* Add / Edit Translation button */}
          <button
            onClick={() => setShowTranslationModal(true)}
            className="w-full py-4 rounded-xl border-2 border-blue-300 text-blue-600 text-lg font-semibold bg-white"
          >
            🌐 {translationCount > 0 ? t('detail.manage_translations') : t('detail.add_translation')}
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

      {/* Translation Modal */}
      {showTranslationModal && (
        <TranslationModal
          recipe={recipe}
          onClose={() => setShowTranslationModal(false)}
          onSaved={() => setShowTranslationModal(false)}
        />
      )}
    </div>
  );
}
