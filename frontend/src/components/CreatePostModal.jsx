import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../styles/Post.css';

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
    const [newPostCaption, setNewPostCaption] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isCropMode, setIsCropMode] = useState(false);
    const [newPostImagePreview, setNewPostImagePreview] = useState(null);
    const imgRef = useRef(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setNewPostCaption('');
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(null);
        setIsCropMode(false);
        setNewPostImagePreview(null);
        onClose();
    };

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setIsCropMode(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function onImageLoad(e) {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                1,
                width,
                height
            ),
            width,
            height
        );
        setCrop(crop);
    }

    const getCroppedImg = () => {
        if (!completedCrop || !imgRef.current) return;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );

        const base64Image = canvas.toDataURL('image/jpeg');
        setNewPostImagePreview(base64Image);
        setIsCropMode(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newPostImagePreview || !newPostCaption.trim()) return;

        const newPost = {
            id: Date.now(),
            username: 'straycare_user', // Mock user
            userImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
            postImage: newPostImagePreview,
            caption: newPostCaption,
            likes: 0,
            isLiked: false,
            comments: [],
            timestamp: 'Just now'
        };

        onSubmit(newPost);
        handleClose();
    };


    return (
        <div className="create-post-modal-overlay">
            <div className="create-post-modal-backdrop" onClick={handleClose}></div>
            <div className="create-post-modal preview-active">
                <div className="modal-header">
                    <h2>Create New Post</h2>
                    <button className="modal-close-btn" onClick={handleClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="create-post-form preview-mode">
                    <div className="mock-post-preview" style={{ display: 'flex', width: '100%', height: '100%' }}>
                        <div className="post-image-section">
                            {isCropMode && imgSrc ? (
                                <div className="crop-container" style={{ width: '100%', height: '100%' }}>
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={1}
                                    >
                                        <img
                                            ref={imgRef}
                                            alt="Crop me"
                                            src={imgSrc}
                                            onLoad={onImageLoad}
                                            className="img-to-crop"
                                        />
                                    </ReactCrop>
                                    <div className="crop-actions">
                                        <button type="button" className="crop-btn cancel" onClick={() => setIsCropMode(false)}>Cancel</button>
                                        <button type="button" className="crop-btn" onClick={getCroppedImg}>Apply Crop</button>
                                    </div>
                                </div>
                            ) : newPostImagePreview ? (
                                <>
                                    <img src={newPostImagePreview} alt="Preview" className="post-main-image" />
                                    <div className="preview-actions">
                                        <button
                                            type="button"
                                            className="preview-btn"
                                            onClick={() => {
                                                setNewPostImagePreview(null);
                                                setIsCropMode(true);
                                            }}
                                        >
                                            Change Crop
                                        </button>
                                        <label htmlFor="post-image-change-preview" className="preview-btn">
                                            Change Photo
                                        </label>
                                        <input
                                            type="file"
                                            id="post-image-change-preview"
                                            accept="image/*"
                                            onChange={onSelectFile}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="upload-placeholder" style={{ backgroundColor: '#fafafa', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <label htmlFor="post-image-upload" className="upload-label">
                                        <span>Select Photo from Computer</span>
                                    </label>
                                    <input
                                        type="file"
                                        id="post-image-upload"
                                        accept="image/*"
                                        onChange={onSelectFile}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="post-details-section">
                            <div className="post-header">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="User profile" className="post-user-img" />
                                <div className="post-user-info">
                                    <span className="post-username">straycare_user</span>
                                    <span className="post-time">New Post</span>
                                </div>
                            </div>
                            <div className="post-content-scroll" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div className="post-caption-block" style={{ width: '100%', alignItems: 'flex-start' }}>
                                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="User profile" className="post-user-img-small" />
                                    <textarea
                                        className="caption-textarea mockup-textarea"
                                        placeholder="Write a caption (max 100 words)..."
                                        value={newPostCaption}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            const words = text.trim().split(/\s+/);
                                            if (words.length <= 100 || text.endsWith(' ')) {
                                                if (words.length <= 100 || (words.length === 101 && text.endsWith(' '))) {
                                                    setNewPostCaption(text);
                                                }
                                            }
                                        }}
                                        rows="4"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid #efefef', margin: 0, padding: '16px', backgroundColor: 'white', zIndex: 10, justifyContent: 'space-between' }}>
                                <button type="button" className="cancel-btn" onClick={handleClose}>Cancel</button>
                                <button
                                    type="submit"
                                    className="submit-post-btn"
                                    disabled={!newPostImagePreview || !newPostCaption.trim()}
                                >
                                    Share Post
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
