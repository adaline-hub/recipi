import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipe } from '../hooks/useRecipes';
import { db } from '../db';

export default function RecipeDetail({ recipeId, onBack, onEdit }) {
  const recipe = useRecipe(recipeId);
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();

  async function handleDelete() {
    await db.recipes.delete(recipeId);
    onBack();
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fffbeb' }}>
        <p className="text-orange-400 text-lg">{t('detail.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-orange-100 text-sm mb-3 flex items-center gap-1">
          {t('detail.back')}
        </button>
        <h1 className="text-2xl font-bold text-white leading-tight">{recipe.title}</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Photo */}
        {recipe.photo && (
          <img
            src={recipe.photo}
            alt={recipe.title}
            className="w-full rounded-2xl object-cover max-h-72 mb-2"
          />
        )}

        {/* Ingredients */}
        <section>
          <h2 className="text-lg font-bold text-orange-700 mb-3 uppercase tracking-wide">{t('detail.ingredients')}</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 text-base">
                <span className="text-orange-400 mt-1">•</span>
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        {recipe.instructions && (
          <section>
            <h2 className="text-lg font-bold text-orange-700 mb-3 uppercase tracking-wide">{t('detail.instructions')}</h2>
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{recipe.instructions}</p>
          </section>
        )}

        {/* Notes */}
        {recipe.notes && (
          <section>
            <h2 className="text-lg font-bold text-orange-700 mb-3 uppercase tracking-wide">{t('detail.notes')}</h2>
            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
          </section>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => onEdit(recipe.id)}
            className="w-full py-4 rounded-xl text-white text-lg font-semibold"
            style={{ backgroundColor: '#f97316' }}
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
