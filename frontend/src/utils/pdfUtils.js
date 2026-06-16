import { PDFDocument } from 'pdf-lib';

// ── Size limit ─────────────────────────────────────────────────────────────────
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Validates and compresses a PDF file.
 *
 * Rules:
 *  - Files > 2 MB → rejected immediately with a clear error.
 *  - Files ≤ 2 MB → always compressed via pdf-lib deflate, then uploaded.
 *
 * Status flow shown to user:
 *   "Compressing..." → "Uploading..." → (caller shows) "✓ Done"
 *
 * @param {File} file - The PDF File from input[type=file]
 * @param {(status: string) => void} [onStatus] - Live status callback
 * @returns {Promise<{ base64: string, originalSizeMB: string, finalSizeMB: string, savings: string }>}
 */
export const processPDF = async (file, onStatus = () => {}) => {
    if (!file) {
        throw new Error('No file selected.');
    }
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
        throw new Error('Only PDF files are supported.');
    }

    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    // ── Hard cap: reject above 2 MB ───────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
        throw new Error(
            `File too large (${originalSizeMB} MB). Maximum allowed size is ${MAX_SIZE_MB} MB. ` +
            `Please reduce the file size or scan at a lower resolution.`
        );
    }

    // ── Compress with pdf-lib ──────────────────────────────────────────────────
    onStatus('Uploading...');
    const rawBytes = await file.arrayBuffer();

    try {
        const pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,   // deflate-compress indirect objects
            addDefaultPage: false,
        });

        const finalSizeMB = (compressedBytes.byteLength / (1024 * 1024)).toFixed(2);
        const savings = (((file.size - compressedBytes.byteLength) / file.size) * 100).toFixed(0);

        onStatus('Uploading...');
        const base64 = await arrayBufferToBase64(compressedBytes.buffer, 'application/pdf');
        return { base64, originalSizeMB, finalSizeMB, savings: `${savings}%` };

    } catch (err) {
        // Encrypted or malformed PDF — fall back to raw upload
        console.warn('PDF compression skipped (encrypted/malformed), uploading original:', err.message);
        onStatus('Uploading...');
        const base64 = await arrayBufferToBase64(rawBytes, 'application/pdf');
        return { base64, originalSizeMB, finalSizeMB: originalSizeMB, savings: '0%' };
    }
};

// ── Helper: ArrayBuffer → base64 data URL ─────────────────────────────────────
const arrayBufferToBase64 = (buffer, mimeType) => {
    return new Promise((resolve) => {
        const blob = new Blob([buffer], { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
};

/**
 * Human-readable file size string.
 * @param {number} bytes
 */
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
