export default function RecipeView({ t, lastProduct, onGoScan }) {
  if (!lastProduct) {
    return (
      <div className="recipe-view recipe-empty">
        <p className="recipe-empty-text">{t.recipeNoProduct}</p>
        <button className="recipe-empty-cta" onClick={onGoScan}>
          {t.recipeGoScan}
        </button>
      </div>
    )
  }

  return (
    <div className="recipe-view">
      <h2 className="recipe-title">{t.recipeTitle}</h2>
      <p className="recipe-product-name">{lastProduct.productName}</p>
      <p className="recipe-ai-note">{t.recipeAiNote}</p>

      <ul className="recipe-list">
        {(lastProduct.recipeIdeas ?? []).map((idea, i) => (
          <li key={i} className="recipe-item">
            <span className="recipe-item-number">{i + 1}</span>
            <span>{idea}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
