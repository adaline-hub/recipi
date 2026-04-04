import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipe } from '../hooks/useRecipes';
import { db } from '../db';
import { deleteRecipeFromSupabase } from '../lib/supabaseSync';
import { translateText } from '../utils/translate';
import { mapLanguageToBaidu } from '../utils/baiduTranslate';

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
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [autoTranslations, setAutoTranslations] = useState({});
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Auto-translate recipe when app language changes
  useEffect(() => {
    if (!recipe) return;

    const translations = recipe.translations || {};
    const translatedContent = translations[currentLang];
    const isOriginalLang = currentLang === recipe.language;

    // If translation exists or it's the original language, don't auto-translate
    if (translatedContent || isOriginalLang) {
      return;
    }

    // Check if we already auto-translated this
    if (autoTranslations[currentLang]) {
      return;
    }

    // Auto-translate recipe to current language
    async function autoTranslate() {
      setAutoTranslating(true);
      try {
        const sourceLang = recipe.language || 'en';
        const targetLang = currentLang;

        const translatedTitle = await translateText(recipe.title, sourceLang, targetLang);
        const translatedIngredients = await Promise.all(
          recipe.ingredients.map((ing) => translateText(ing, sourceLang, targetLang))
        );
        const translatedInstructions = recipe.instructions
          ? await translateText(recipe.instructions, sourceLang, targetLang)
          : '';
        const translatedNotes = recipe.notes
          ? await translateText(recipe.notes, sourceLang, targetLang)
          : '';

        setAutoTranslations((prev) => ({
          ...prev,
          [currentLang]: {
            title: translatedTitle,
            ingredients: translatedIngredients,
            instructions: translatedInstructions,
            notes: translatedNotes,
          },
        }));
      } catch (err) {
        console.error('Auto-translation failed:', err);
      } finally {
        setAutoTranslating(false);
      }
    }

    autoTranslate();
  }, [recipe, currentLang, autoTranslations]);

  async function handleDelete() {
    // Delete from local db first
    await db.recipes.delete(recipeId);

    // Also delete from Supabase
    await deleteRecipeFromSupabase(recipeId);

    onBack();
  }


  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
        <p className="text-blue-400 text-lg">{t('detail.loading')}</p>
      </div>
    );
  }

  // Resolve displayed content: prefer saved translation, then auto-translation, then original
  const translations = recipe.translations || {};
  const translatedContent = translations[currentLang];
  const autoTranslated = autoTranslations[currentLang];
  const isTranslated = !!translatedContent && currentLang !== recipe.language;
  const isAutoTranslated = !!autoTranslated && currentLang !== recipe.language;
  const isOriginalLang = currentLang === recipe.language;

  const displayTitle = translatedContent?.title || autoTranslated?.title || recipe.title;
  const displayIngredients = translatedContent?.ingredients || autoTranslated?.ingredients || recipe.ingredients;
  const displayInstructions = translatedContent?.instructions ?? autoTranslated?.instructions ?? recipe.instructions;
  const displayNotes = translatedContent?.notes ?? autoTranslated?.notes ?? recipe.notes;

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
        ) : isAutoTranslated ? (
          // Show auto-translation indicator
          <div className="mt-2 text-blue-100 text-sm">
            <p className="text-xs text-blue-200">🤖 Auto-translated</p>
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

        {/* Auto-translating indicator */}
        {autoTranslating && (
          <div className="mt-2 text-blue-200 text-xs">
            🔄 Translating...
          </div>
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
    </div>
  );
}
