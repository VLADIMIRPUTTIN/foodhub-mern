
import "./RecipeConfirmationModal.scss";

const RecipeConfirmationModal = ({
    open,
    onAccept,
    onReject,
    name,
    category,
    description,
    ingredients,
    steps,
    image
}) => {
    if (!open) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Recipe Confirmation</h2>
                {image && (
                    <img
                        src={typeof image === "string" ? image : URL.createObjectURL(image)}
                        alt="Recipe"
                        className="modal-img"
                    />
                )}
                <div className="modal-section">
                    <strong>Name:</strong> {name}
                </div>
                <div className="modal-section">
                    <strong>Category:</strong> {category}
                </div>
                <div className="modal-section">
                    <strong>Description:</strong> {description}
                </div>
                <div className="modal-section">
                    <strong>Ingredients:</strong>
                    <ul>
                        {ingredients.map((i, idx) => (
                            <li key={idx}>
                                {i.amount} {i.unit} {i.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="modal-section">
                    <strong>Steps:</strong>
                    <ol>
                        {steps.map((s, idx) => (
                            <li key={idx}>
                                <b>{s.instruction}</b>: {s.details}
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="modal-actions">
                    <button className="accept-btn" onClick={onAccept}>Accept</button>
                    <button className="reject-btn" onClick={onReject}>Reject</button>
                </div>
            </div>
        </div>
    );
};

export default RecipeConfirmationModal;