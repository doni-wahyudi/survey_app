/**
 * Camera utility — uses Capacitor Camera on mobile, falls back to file input on web.
 */

export async function capturePhoto(): Promise<string | null> {
    try {
        // Try Capacitor Camera first (mobile)
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera,
            width: 1024,
            height: 1024,
        });
        return image.dataUrl || null;
    } catch {
        // Fallback: file input for web
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                } else {
                    resolve(null);
                }
            };
            input.click();
        });
    }
}

export async function pickPhoto(): Promise<string | null> {
    try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Photos,
            width: 1024,
            height: 1024,
        });
        return image.dataUrl || null;
    } catch {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                } else {
                    resolve(null);
                }
            };
            input.click();
        });
    }
}
