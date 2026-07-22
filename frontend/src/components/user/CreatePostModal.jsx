import React, { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../../styles/user/Post.css';
import { useAuthStore } from '../../store/authStore';

const CreatePostModal = ({ isOpen, onClose, onSubmit, initialPost }) => {
    const { user } = useAuthStore();
    const [newPostCaption, setNewPostCaption] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isCropMode, setIsCropMode] = useState(false);
    const [newPostImagePreview, setNewPostImagePreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [shareLocation, setShareLocation] = useState(true);
    const imgRef = useRef(null);



    const handleClose = () => {
        setNewPostCaption('');
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(null);
        setIsCropMode(false);
        setNewPostImagePreview(null);
        setLocation(null);
        setIsFetchingLocation(false);
        onClose();
    };

    React.useEffect(() => {
        if (isOpen && initialPost) {
            setNewPostCaption(initialPost.caption || '');
            setNewPostImagePreview(initialPost.image || null);
            setIsCropMode(false);
        } else if (isOpen && !initialPost) {
            setNewPostCaption('');
            setNewPostImagePreview(null);
        }
    }, [isOpen, initialPost]);

    if (!isOpen) return null;

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

    const fetchLocation = () => {
        setIsFetchingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                    );
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village;
                    const state = data.address.state;
                    setLocation({ name: `${city}, ${state}` });
                } catch (error) {
                    console.error("Error fetching location name:", error);
                    setLocation({ name: "Unknown Location" });
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                console.error("Error getting geolocation:", error);
                setIsFetchingLocation(false);
                alert("Could not get your location. Please try again.");
            });
        } else {
            alert("Geolocation is not supported by your browser.");
            setIsFetchingLocation(false);
        }
    };

    const getCroppedImg = () => {
        if (!completedCrop || !imgRef.current) return;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

        const cropTargetWidth = completedCrop.width * scaleX;
        const cropTargetHeight = completedCrop.height * scaleY;

        let finalWidth = cropTargetWidth;
        let finalHeight = cropTargetHeight;

        // Resize if it exceeds 1080px (like Instagram)
        if (finalWidth > 1080 || finalHeight > 1080) {
            const ratio = Math.min(1080 / finalWidth, 1080 / finalHeight);
            finalWidth = Math.floor(finalWidth * ratio);
            finalHeight = Math.floor(finalHeight * ratio);
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');

        // Better interpolation for scaling down
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            cropTargetWidth,
            cropTargetHeight,
            0,
            0,
            finalWidth,
            finalHeight
        );

        // Apply compression (0.8 quality for JPEG)
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        setNewPostImagePreview(base64Image);
        setIsCropMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPostImagePreview || !newPostCaption.trim()) return;

        if (initialPost) {
            onSubmit({ id: initialPost.id, caption: newPostCaption });
            handleClose();
            return;
        }

        try {
            const base64Response = await fetch(newPostImagePreview);
            const blob = await base64Response.blob();
            
            const formData = new FormData();
            formData.append('image', blob, 'post-image.jpg');
            formData.append('caption', newPostCaption);
            if (shareLocation && location) {
                formData.append('location', location.name);
            }

            onSubmit(formData);
            handleClose();
        } catch (error) {
            console.error('Failed to create FormData from image:', error);
        }
    };


    return (
        <div className="create-post-modal-overlay">
            <div className="create-post-modal-backdrop" onClick={handleClose}></div>
            <div className="create-post-modal preview-active">
                <div className="modal-header">
                    <h2>{initialPost ? "Edit Post" : "Create New Post"}</h2>
                    <button className="modal-close-btn" onClick={handleClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="create-post-form preview-mode">
                    <div className="mock-post-preview">
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
                                    {!initialPost && (
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
                                    )}
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
                                <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="User profile" className="post-user-img" />
                                <div className="post-user-info">
                                    <span className="post-username">{user?.name || 'User'}</span>
                                    <div className="location-toggle-row">
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={shareLocation} 
                                                onChange={(e) => setShareLocation(e.target.checked)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        {shareLocation && (
                                            <button 
                                                type="button" 
                                                className="modal-location-trigger"
                                                onClick={fetchLocation}
                                                disabled={isFetchingLocation}
                                            >
                                                <MapPin size={14} className="meta-icon" />
                                                <span>
                                                    {isFetchingLocation ? 'Fetching...' : location ? location.name : 'Add location...'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="post-content-scroll" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div className="post-caption-block" style={{ width: '100%', alignItems: 'flex-start' }}>
                                    <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="User profile" className="post-user-img-small" />
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
                                        onFocus={(e) => {
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 300);
                                        }}
                                        rows="4"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={handleClose}>Cancel</button>
                                <button
                                    type="submit"
                                    className="submit-post-btn"
                                    disabled={!newPostImagePreview || !newPostCaption.trim()}
                                >
                                    {initialPost ? "Save Changes" : "Share Post"}
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
