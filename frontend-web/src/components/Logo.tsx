import React from 'react';

interface LogoProps {
    /**
     * Size of the logo. "full" shows the full logo with text, "icon" shows only the isotipo.
     */
    variant?: 'full' | 'icon';
    /** Optional CSS class for the img element */
    className?: string;
}

/**
 * Reusable logo component for the CanalMedico brand.
 * The image file should be placed in `public/assets/logo-full.png`.
 * The same image can be used for the icon variant; CSS will control the size.
 */
export const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '' }) => {
    const src = '/assets/logo-full.png';
    const alt = 'CanalMedico';
    const sizeClass = variant === 'icon' ? 'h-8 w-auto' : 'h-16 w-auto';
    return (
        <img src={src} alt={alt} className={`${sizeClass} ${className}`} />
    );
};
