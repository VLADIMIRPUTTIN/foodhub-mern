import { useState } from 'react';

const ImageWithFallback = ({ src, alt, fallbackSrc = '/api/placeholder/200/200', ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasErrored, setHasErrored] = useState(false);

    const handleError = () => {
        if (!hasErrored) {
            setHasErrored(true);
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            onError={handleError}
            {...props}
        />
    );
};

export default ImageWithFallback;