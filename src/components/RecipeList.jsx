import { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';

export default function RecipeList({ onSelectRecipe, onAddRecipe, onImportExport }) {
  const recipes = useRecipes();
  const [search, setSearch] = useState('');

  const filtered = (recipes || []).filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316' }} className="px-4 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Recipi 🍴</h1>
        <p className="text-orange-100 text-sm">Your family recipes, always close</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search recipes..."
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
          + Add Recipe
        </button>

        {/* Recipe cards */}
        {recipes === undefined ? (
          <p className="text-center text-orange-400 text-lg py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            {search ? (
              <p className="text-orange-400 text-lg">No recipes match "{search}"</p>
            ) : (
              <div className="space-y-2">
                <p className="text-5xl">👩‍🍳</p>
                <p className="text-orange-500 text-xl font-medium">No recipes yet!</p>
                <p className="text-orange-400">Tap "Add Recipe" to get started.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe.id)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-orange-100 active:bg-orange-50"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-1">{recipe.title}</h2>
                {recipe.ingredients.length > 0 && (
                  <p className="text-gray-500 text-sm">
                    {recipe.ingredients.slice(0, 2).join(' · ')}
                    {recipe.ingredients.length > 2 && ` · +${recipe.ingredients.length - 2} more`}
                  </p>
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
            Import / Export recipes
          </button>
        </div>
      </div>
    </div>
  );
}
