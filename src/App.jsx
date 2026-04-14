import { useState, useEffect } from 'react';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import ImportExport from './components/ImportExport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { fetchRecipesFromCloud, subscribeToRecipeChanges, unsubscribeFromRecipeChanges } from './lib/tencentSync';

// Views: list | detail | add | edit | importexport
export default function App() {
  const [view, setView] = useState('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // Initialize Tencent Cloud sync on app load
  useEffect(() => {
    fetchRecipesFromCloud();
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

  let content = null;
  if (view === 'list') {
    content = <RecipeList onSelectRecipe={showDetail} onAddRecipe={showAdd} onImportExport={showImportExport} />;
  } else if (view === 'detail') {
    content = <RecipeDetail recipeId={selectedRecipeId} onBack={showList} onEdit={showEdit} />;
  } else if (view === 'add') {
    content = <RecipeForm recipeId={null} onBack={showList} onSaved={handleSaved} />;
  } else if (view === 'edit') {
    content = <RecipeForm recipeId={selectedRecipeId} onBack={() => showDetail(selectedRecipeId)} onSaved={handleSaved} />;
  } else if (view === 'importexport') {
    content = <ImportExport onBack={showList} />;
  }

  return (
    <div>
      {/* Global language switcher — always visible top right */}
      <div className="fixed top-3 right-3 z-50">
        <LanguageSwitcher />
      </div>
      {content}
    </div>
  );
}
