import { useState, useEffect } from 'react';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import ImportExport from './components/ImportExport';
import SyncStatus from './components/SyncStatus';
import { fetchRecipesFromSupabase, subscribeToRecipeChanges, unsubscribeFromRecipeChanges } from './lib/supabaseSync';

// Views: list | detail | add | edit | importexport
export default function App() {
  const [view, setView] = useState('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // Initialize Supabase sync on app load
  useEffect(() => {
    fetchRecipesFromSupabase();
    subscribeToRecipeChanges();

    return () => {
      unsubscribeFromRecipeChanges();
    };
  }, []);

  function showList() {
    setView('list');
    setSelectedRecipeId(null);
  }

  function showDetail(id) {
    setSelectedRecipeId(id);
    setView('detail');
  }

  function showAdd() {
    setSelectedRecipeId(null);
    setView('add');
  }

  function showEdit(id) {
    setSelectedRecipeId(id);
    setView('edit');
  }

  function showImportExport() {
    setView('importexport');
  }

  // After saving a new recipe, go to detail; after saving edit, go back to detail
  function handleSaved(id) {
    showDetail(id);
  }

  if (view === 'list') {
    return (
      <RecipeList
        onSelectRecipe={showDetail}
        onAddRecipe={showAdd}
        onImportExport={showImportExport}
      />
    );
  }

  if (view === 'detail') {
    return (
      <RecipeDetail
        recipeId={selectedRecipeId}
        onBack={showList}
        onEdit={showEdit}
      />
    );
  }

  if (view === 'add') {
    return (
      <RecipeForm
        recipeId={null}
        onBack={showList}
        onSaved={handleSaved}
      />
    );
  }

  if (view === 'edit') {
    return (
      <RecipeForm
        recipeId={selectedRecipeId}
        onBack={() => showDetail(selectedRecipeId)}
        onSaved={handleSaved}
      />
    );
  }

  if (view === 'importexport') {
    return (
      <ImportExport onBack={showList} />
    );
  }

  return null;
}
