import { useState } from "react";
import axios from "axios";
import "./CreateIngredient.scss";

const CreateIngredient = ({ onCreated }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await axios.post(
                "http://localhost:5000/api/ingredients",
                { name },
                { withCredentials: true }
            );
            setSuccess("Ingredient created!");
            setName("");
            if (onCreated) onCreated();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create ingredient");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-ingredient-admin">
            <h2>Create Ingredient</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ingredient name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Ingredient"}
                </button>
            </form>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
        </div>
    );
};

export default CreateIngredient;