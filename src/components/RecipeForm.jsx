import { useState, useEffect } from 'react';
import { db } from '../db';
import { useRecipe } from '../hooks/useRecipes';

export default function RecipeForm({ recipeId, onBack, onSaved }) {
  const existing = useRecipe(recipeId);

  const [title, setTitle] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = !!recipeId;

  // Pre-populate when editing
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setIngredientsText(existing.ingredients.join('\n'));
      setInstructions(existing.instructions || '');
      setNotes(existing.notes || '');
    }
  }, [existing]);

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    const ings = ingredientsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (ings.length === 0) errs.ingredients = 'At least one ingredient is required.';
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
        await db.recipes.update(recipeId, {
          title: title.trim(),
          ingredients,
          instructions: instructions.trim(),
          notes: notes.trim(),
          updatedAt: now,
        });
        onSaved(recipeId);
      } else {
        const id = crypto.randomUUID();
        await db.recipes.add({
          id,
          title: title.trim(),
          ingredients,
          instructions: instructions.trim(),
          notes: notes.trim(),
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
    <div className="min-h-screen" style={{ backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316' }} className="px-4 pt-10 pb-6">
        <button onClick={onBack} className="text-orange-100 text-sm mb-3">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Edit Recipe' : 'New Recipe'}
        </h1>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-orange-700 font-bold mb-1 text-sm uppercase tracking-wide">
            Recipe Name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grandma's Apple Pie"
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 text-lg focus:outline-none focus:border-orange-400 bg-white"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-orange-700 font-bold mb-1 text-sm uppercase tracking-wide">
            Ingredients * <span className="normal-case font-normal text-orange-400">(one per line)</span>
          </label>
          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={"2 cups flour\n1 tsp salt\n3 tbsp butter"}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 text-base focus:outline-none focus:border-orange-400 bg-white resize-none"
          />
          {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-orange-700 font-bold mb-1 text-sm uppercase tracking-wide">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step 1: Preheat oven to 350°F..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 text-base focus:outline-none focus:border-orange-400 bg-white resize-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-orange-700 font-bold mb-1 text-sm uppercase tracking-wide">
            Notes <span className="normal-case font-normal text-orange-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tips, substitutions, family memories..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 text-base focus:outline-none focus:border-orange-400 bg-white resize-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl text-white text-lg font-semibold disabled:opacity-60"
          style={{ backgroundColor: '#f97316' }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Recipe'}
        </button>
      </div>
    </div>
  );
}
