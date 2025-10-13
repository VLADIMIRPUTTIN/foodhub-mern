import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import './MobileIngredientSheet.scss';

const MobileIngredientSheet = ({
    isSheetOpen,
    setIsSheetOpen,
    sheetAnimate,
    sheetOut,
    handleSheetOpenChange,
    ingredientSearch,
    setIngredientSearch,
    filteredIngredients,
    selectedIngredients,
    handleIngredientClick,
    isMobile
}) => {
    return (
        <div className="ingredients-sheet-mobile">
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetTrigger asChild>
                    {!isSheetOpen && (
                        <button
                            className="ingredients-fab-btn"
                            aria-label="Select Ingredients"
                        >
                            <i className="bx bx-bowl-hot"></i>
                        </button>
                    )}
                </SheetTrigger>
                <SheetContent
                    side={isMobile ? "bottom" : "left"} // Show from bottom on mobile, left on desktop
                    className={
                        `ingredients-sheet-content` +
                        (sheetAnimate && !sheetOut ? ' sheet-animate-in' : '') +
                        (sheetOut ? ' sheet-animate-out' : '')
                    }
                >
                    <button
                        className={`ingredients-fab-btn close-btn${isSheetOpen ? ' rotating' : ''}`}
                        aria-label="Close Ingredients"
                        onClick={() => handleSheetOpenChange(false)}
                    >
                        <i className="bx bx-x"></i>
                    </button>
                    <div className="sidebar-header">
                        <span className="sidebar-title">Select <span className="highlight">Ingredients</span></span>
                        <div className="sidebar-underline"></div>
                    </div>
                    <input
                        type="text"
                        className="ingredient-search"
                        placeholder="Search ingredients..."
                        value={ingredientSearch}
                        onChange={e => setIngredientSearch(e.target.value)}
                    />
                    <div className="ingredient-list">
                        {filteredIngredients.map((ing, idx) => (
                            <button
                                key={idx}
                                className={`ingredient-btn${selectedIngredients.includes(ing) ? " selected" : ""}`}
                                onClick={() => handleIngredientClick(ing)}
                                type="button"
                            >
                                {ing}
                            </button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default MobileIngredientSheet;