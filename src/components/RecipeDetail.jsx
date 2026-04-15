import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipe } from '../hooks/useRecipes';
import { db } from '../db';
import { deleteRecipeFromSupabase, saveRecipeToSupabase } from '../lib/tencentSync';
import SyncStatus from './SyncStatus';

const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
  ja: '日本語',
  'zh-CN': '中文（简体）',
};

// Known comment authors (the two people using this app)
const KNOWN_AUTHORS = [
  { id: 'lindsay', name: 'Little B' },
  { id: 'mama', name: 'Little Pan' },
];

const COMMENT_MAX_LENGTH = 500;

export default function RecipeDetail({ recipeId, onBack, onEdit }) {
  const recipe = useRecipe(recipeId);
  const [confirming, setConfirming] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Comments state
  const [selectedAuthor, setSelectedAuthor] = useState(KNOWN_AUTHORS[0].id);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    // Delete from local db first
    await db.recipes.delete(recipeId);

    // Also delete from Supabase
    await deleteRecipeFromSupabase(recipeId);

    onBack();
  }

  async function handleDeleteComment(commentId) {
    const latestRecipe = await db.recipes.get(recipeId);
    if (!latestRecipe) return;
    const updatedRecipe = {
      ...latestRecipe,
      comments: (latestRecipe.comments || []).map((c) =>
        c.id === commentId ? { ...c, deleted: true, deletedAt: Date.now() } : c
      ),
      updatedAt: Date.now(),
    };
    await db.recipes.put(updatedRecipe);
    await saveRecipeToSupabase(updatedRecipe);
  }

  async function handleAddComment() {
    const text = commentText.trim();

    if (!text) {
      setCommentError(t('comments.error_empty'));
      return;
    }

    if (text.length > COMMENT_MAX_LENGTH) {
      setCommentError(t('comments.error_too_long', { max: COMMENT_MAX_LENGTH }));
      return;
    }

    setSubmitting(true);
    setCommentError('');

    try {
      const latestRecipe = await db.recipes.get(recipeId);
      if (!latestRecipe) {
        throw new Error('Recipe not found');
      }

      const comments = latestRecipe.comments || [];
      const author = KNOWN_AUTHORS.find((a) => a.id === selectedAuthor);
      const newComment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        author: author?.name || selectedAuthor,
        authorId: selectedAuthor,
        createdAt: new Date().toISOString(),
      };

      const updatedRecipe = {
        ...latestRecipe,
        comments: [...comments, newComment],
        updatedAt: Date.now(),
      };

      await db.recipes.put(updatedRecipe);
      const saved = await saveRecipeToSupabase(updatedRecipe);
      if (!saved) {
        throw new Error('Cloud sync failed');
      }

      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      setCommentError('Failed to save comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCommentKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment();
    }
  }


  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
        <p className="text-blue-400 text-lg">{t('detail.loading')}</p>
      </div>
    );
  }

  // Resolve displayed content: use stored translation if available, else original
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

  function formatCommentTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const comments = (recipe.comments || []).filter((c) => !c.deleted);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3b82f6' }} className="px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-blue-100 text-sm flex items-center gap-1">
            {t('detail.back')}
          </button>
          <SyncStatus />
        </div>
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

        {/* ── Comments Section ── */}
        <section className="bg-white rounded-2xl border border-blue-100 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-blue-700 uppercase tracking-wide">{t('comments.title')}</h2>
            {comments.length > 0 && (
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </div>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm italic">{t('comments.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3 group">
                  {/* Avatar circle */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {(comment.author || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{comment.author || 'Someone'}</span>
                      <span className="text-xs text-gray-400">{formatCommentTime(comment.createdAt)}</span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-auto text-gray-300 hover:text-red-400 active:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete comment"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add comment form */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            {/* Author selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                {t('comments.label_your_name')}
              </label>
              <div className="flex gap-2">
                {KNOWN_AUTHORS.map((author) => (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthor(author.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                      selectedAuthor === author.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {author.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment input */}
            <div>
              <textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (commentError) setCommentError('');
                }}
                onKeyDown={handleCommentKeyDown}
                placeholder={t('comments.placeholder')}
                rows={3}
                maxLength={COMMENT_MAX_LENGTH}
                className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  commentError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {commentError ? (
                  <p className="text-red-500 text-xs">{commentError}</p>
                ) : (
                  <p className="text-xs text-gray-400">{t('comments.name_hint')}</p>
                )}
                <p className="text-xs text-gray-400">
                  {t('comments.char_count', { count: commentText.length, max: COMMENT_MAX_LENGTH })}
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                submitting || !commentText.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              }`}
            >
              {submitting ? '…' : t('comments.submit')}
            </button>
            <p className="text-xs text-gray-400 text-center">⌘ + Enter to post</p>
          </div>
        </section>

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
