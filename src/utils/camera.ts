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
export async function addWatermarkToImage(
    dataUrl: string, 
    metadata: {
        coords?: string;
        respondentNo?: string;
        location?: string;
        surveyor?: string;
        timestamp?: string;
    }
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(dataUrl);
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Setup text style
            const fontSize = Math.max(20, Math.floor(img.width / 40));
            ctx.font = `${fontSize}px monospace`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            
            const padding = 20;
            const lines = [];
            if (metadata.timestamp) lines.push(`Waktu: ${metadata.timestamp}`);
            if (metadata.coords) lines.push(`GPS: ${metadata.coords}`);
            if (metadata.respondentNo) lines.push(`Responden: ${metadata.respondentNo}`);
            if (metadata.location) lines.push(`Lokasi: ${metadata.location}`);
            if (metadata.surveyor) lines.push(`Surveyor: ${metadata.surveyor}`);

            // Draw semi-transparent background for readability
            const rectHeight = (lines.length * (fontSize + 5)) + (padding * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, canvas.height - rectHeight, canvas.width, rectHeight);

            // Draw text
            ctx.fillStyle = 'white';
            lines.reverse().forEach((line, i) => {
                ctx.fillText(line, padding, canvas.height - padding - (i * (fontSize + 5)));
            });

            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
    });
}
