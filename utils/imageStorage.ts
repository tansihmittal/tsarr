// Utility for converting images to base64 for localStorage persistence

/**
 * Convert a blob URL or file to base64 data URL
 */
export const imageToBase64 = async (imageUrl: string): Promise<string> => {
  // If already a data URL, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If it's a blob URL, fetch and convert
  if (imageUrl.startsWith('blob:')) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert blob to base64:', error);
      return imageUrl;
    }
  }

  // For regular URLs (http/https), fetch and convert
  if (imageUrl.startsWith('http')) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch and convert image:', error);
      return imageUrl;
    }
  }

  return imageUrl;
};

/**
 * Convert multiple images in an object to base64
 * Recursively searches for image URLs in the object
 */
export const convertImagesToBase64 = async <T extends Record<string, any>>(
  data: T,
  imageKeys: string[]
): Promise<T> => {
  const result = { ...data };

  for (const key of imageKeys) {
    if (result[key] && typeof result[key] === 'string') {
      result[key] = await imageToBase64(result[key]);
    }
  }

  return result;
};

/**
 * Check if a string is a blob URL that needs conversion
 */
export const needsConversion = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('blob:');
};

/**
 * Compress an image to reduce storage size
 * Returns a smaller base64 string
 */
export const compressImage = async (
  imageUrl: string,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if larger than maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};
