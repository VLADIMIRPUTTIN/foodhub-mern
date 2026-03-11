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

            {/* Mobile Swipe Hint */}
            <div className="mobile-pagination-container">
                <i className="bx bx-left-arrow-alt swipe-icon left"></i>
                <div className="swipe-center">
                    <span className="swipe-text">Swipe to browse</span>
                    <span className="swipe-counter">{currentPage} of {totalPages}</span>
                </div>
                <i className="bx bx-right-arrow-alt swipe-icon right"></i>
            </div>
        </>
    );
};

export default PaginationControls;