import './PaginationControls.scss';

const PaginationControls = ({ currentPage, setCurrentPage, totalPages }) => {
    if (totalPages <= 1) return null;
    
    return (
        <>
            {/* Desktop Pagination Controls */}
            <div className="pagination-controls">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                >
                    <i className="bx bx-chevron-left"></i>
                    Previous
                </button>
                <div className="page-info">
                    <span className="current-page">{currentPage}</span>
                    <span className="page-separator">of</span>
                    <span className="total-pages">{totalPages}</span>
                </div>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                >
                    Next
                    <i className="bx bx-chevron-right"></i>
                </button>
            </div>
            
            {/* Mobile Swipe Pagination Indicator */}
            <div className="mobile-pagination-container">
                <div className="mobile-pagination-swipe">
                    <div className="swipe-indicator">
                        <i className="bx bx-chevrons-left"></i>
                        <span>Swipe to navigate</span>
                        <i className="bx bx-chevrons-right"></i>
                    </div>
                    <div className="mobile-page-info">
                        <span className="current-page">{currentPage}</span>
                        <span className="page-separator">of</span>
                        <span className="total-pages">{totalPages}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaginationControls;