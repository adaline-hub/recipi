import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipes } from '../hooks/useRecipes';
import LanguageSwitcher from './LanguageSwitcher';

export default function RecipeList({ onSelectRecipe, onAddRecipe, onImportExport }) {
  const recipes = useRecipes();
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filtered = (recipes || []).filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316' }} className="px-4 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{t('app.title')}</h1>
            <p className="text-orange-100 text-sm">{t('app.tagline')}</p>
          </div>
          <div className="mt-1">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Message to Mom */}
      <div className="bg-white border-b-4 border-orange-200 px-4 py-6">
        <p className="text-center text-gray-700 text-sm leading-relaxed">
          {t('banner.message')}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder={t('list.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 text-lg focus:outline-none focus:border-orange-400 bg-white"
        />

        {/* Add button */}
        <button
          onClick={onAddRecipe}
          className="w-full py-4 rounded-xl text-white text-lg font-semibold"
          style={{ backgroundColor: '#f97316' }}
        >
          {t('list.add_button')}
        </button>

        {/* Recipe cards */}
        {recipes === undefined ? (
          <p className="text-center text-orange-400 text-lg py-8">{t('list.loading')}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            {search ? (
              <p className="text-orange-400 text-lg">{t('list.no_match', { query: search })}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-5xl">👩‍🍳</p>
                <p className="text-orange-500 text-xl font-medium">{t('list.empty_title')}</p>
                <p className="text-orange-400">{t('list.empty_hint')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe.id)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-orange-100 active:bg-orange-50 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{recipe.title}</h2>
                  {recipe.ingredients.length > 0 && (
                    <p className="text-gray-500 text-sm truncate">
                      {recipe.ingredients.slice(0, 2).join(' · ')}
                      {recipe.ingredients.length > 2 && ` · +${recipe.ingredients.length - 2} more`}
                    </p>
                  )}
                </div>
                {recipe.photo && (
                  <img
                    src={recipe.photo}
                    alt={recipe.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Import/Export link */}
        <div className="pt-4 text-center">
          <button
            onClick={onImportExport}
            className="text-orange-400 underline text-sm"
          >
            {t('list.import_export_link')}
          </button>
        </div>
      </div>
    </div>
  );
}
