import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/toast';
import './CommentModal.scss';

const CommentModal = ({ isOpen, onClose, recipe, onCommentUpdate }) => {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && recipe?._id) {
            fetchComments();
        }
    }, [isOpen, recipe]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/comments/recipe/${recipe._id}`);
            if (response.data.success) {
                setComments(response.data.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error("Error", "Failed to load comments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Login Required", "Please login to comment on recipes");
            return;
        }
        if (!comment.trim()) {
            toast.error("Empty Comment", "Please enter a comment");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await axios.post(`/api/comments`, { 
                recipeId: recipe._id, 
                text: comment 
            });
            if (response.data.success) {
                toast.success("Comment Added", "Your comment has been posted successfully");
                setComment('');
                setComments([response.data.comment, ...comments]);
                if (onCommentUpdate) onCommentUpdate(recipe._id, 'add');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error("Error", error.response?.data?.message || "Failed to submit comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`/api/comments/${commentId}`);
            if (response.data.success) {
                toast.success("Comment Deleted", "Your comment has been removed");
                setComments(comments.filter(c => c._id !== commentId));
                if (onCommentUpdate) onCommentUpdate(recipe._id, 'delete');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error("Error", "Failed to delete comment");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="comment-modal-overlay" onClick={onClose}>
            <div className="comment-modal" onClick={e => e.stopPropagation()}>
                <div className="comment-modal-header">
                    <h3>Comments for {recipe?.title}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="bx bx-x"></i>
                    </button>
                </div>
                
                <div className="comment-form-container">
                    <form onSubmit={handleSubmit} className="comment-form">
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder={user ? "Add your comment..." : "Login to comment"}
                            disabled={!user || isSubmitting}
                        />
                        <button 
                            type="submit" 
                            className="submit-comment-btn"
                            disabled={!user || isSubmitting}
                        >
                            {isSubmitting ? (
                                <i className="bx bx-loader-alt bx-spin"></i>
                            ) : (
                                <>
                                    <i className="bx bx-send"></i>
                                    Post Comment
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <div className="comments-list">
                    {isLoading ? (
                        <div className="loading-comments">
                            <i className="bx bx-loader-alt bx-spin"></i>
                            <span>Loading comments...</span>
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment._id} className="comment-item">
                                <div className="comment-header">
                                    <div className="comment-user">
                                        <div className="user-avatar">
                                            {comment.user?.profileImage ? (
                                                <img 
                                                    src={comment.user.profileImage} 
                                                    alt={comment.user.name}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/40';
                                                    }}
                                                />
                                            ) : (
                                                <div className="default-avatar">
                                                    {comment.user?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h4>{comment.user?.name || 'Unknown User'}</h4>
                                            <span className="comment-date">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    {user && comment.user?._id === user._id && (
                                        <button 
                                            className="delete-comment-btn"
                                            onClick={() => handleDeleteComment(comment._id)}
                                        >
                                            <i className="bx bx-trash"></i>
                                        </button>
                                    )}
                                </div>
                                <div className="comment-text">
                                    {comment.text}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-comments">
                            <i className="bx bx-message-rounded-detail"></i>
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentModal;