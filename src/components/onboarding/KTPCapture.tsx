import { useState } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { capturePhoto } from '../../utils/camera';
import { Camera, RotateCcw, ChevronRight, IdCard, Loader } from 'lucide-react';
import { uploadFile } from '../../lib/supabase';

export default function KTPCapture() {
    const [ktpImage, setKtpImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const { user, updateProfile } = useAuth();
    const { addToast } = useApp();

    const handleCapture = async () => {
        const photo = await capturePhoto();
        if (photo) {
            setKtpImage(photo);
            addToast('Foto KTP berhasil diambil', 'success');
        }
    };

    const handleRetake = () => {
        setKtpImage(null);
    };

    const handleNext = async () => {
        if (!ktpImage) {
            updateProfile({ ktp_photo_url: 'skipped' });
            return;
        }

        if (ktpImage.startsWith('data:')) {
            setUploading(true);
            try {
                const fileName = `ktp/${user?.id || Date.now()}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('ktp-photos', fileName, ktpImage);
                if (uploadedUrl) {
                    await updateProfile({ ktp_photo_url: uploadedUrl });
                } else {
                    addToast('Gagal mengunggah foto KTP', 'error');
                }
            } catch (error) {
                console.error('Error uploading KTP:', error);
                addToast('Terjadi kesalahan saat mengunggah foto', 'error');
            } finally {
                setUploading(false);
            }
        } else {
            updateProfile({ ktp_photo_url: ktpImage });
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-progress">
                <div className="step active" />
                <div className="step" />
            </div>

            <div className="onboarding-header">
                <h2>Foto KTP</h2>
                <p>Ambil foto Kartu Tanda Penduduk (KTP) Anda untuk verifikasi identitas.</p>
            </div>

            <div className="onboarding-content">
                <div
                    className={`ktp-capture-area ${ktpImage ? 'has-image' : ''}`}
                    onClick={ktpImage ? undefined : handleCapture}
                >
                    {ktpImage ? (
                        <img src={ktpImage} alt="KTP Preview" />
                    ) : (
                        <>
                            <div className="capture-icon">
                                <IdCard size={28} />
                            </div>
                            <div className="capture-text">
                                <strong>Tap untuk mengambil foto KTP</strong>
                                <br />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                    Pastikan KTP terlihat jelas dan tidak terpotong
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {ktpImage && (
                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)' }}>
                        <button className="btn btn-secondary" onClick={handleRetake} style={{ flex: 1 }}>
                            <RotateCcw size={16} />
                            Ulangi
                        </button>
                        <button className="btn btn-primary" onClick={handleCapture} style={{ flex: 1 }}>
                            <Camera size={16} />
                            Foto Baru
                        </button>
                    </div>
                )}
            </div>

            <div className="onboarding-actions">
                <button className="btn btn-secondary" onClick={handleNext} style={{ flex: 1 }}>
                    Lewati
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    style={{ flex: 2 }}
                    disabled={uploading}
                >
                    {uploading ? <Loader size={18} className="spin-animation" /> : 'Lanjut'}
                    {!uploading && <ChevronRight size={18} />}
                </button>
            </div>
        </div>
    );
}
