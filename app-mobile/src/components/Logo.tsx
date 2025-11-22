import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
    /**
     * Variant of the logo. "full" shows the full logo with text, "icon" shows only the isotipo.
     */
    variant?: 'full' | 'icon';
    /** Optional style for the Image component */
    style?: StyleProp<ImageStyle>;
}

/**
 * Reusable logo component for the CanalMedico mobile app.
 * Place the image file at `app-mobile/assets/logo-full.png`.
 * The same image is used for both variants; the size is controlled via style.
 */
export const Logo: React.FC<LogoProps> = ({ variant = 'full', style }) => {
    const source = require('../../assets/logo-full.png');
    const sizeStyle = variant === 'icon' ? { width: 32, height: 32 } : { width: 128, height: 32 };
    return <Image source={source} style={[sizeStyle, style]} resizeMode="contain" />;
};
