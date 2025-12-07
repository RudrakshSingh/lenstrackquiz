import { useState, useRef } from "react";
import styles from './PrescriptionUpload.module.css';

export default function PrescriptionUpload({onParsed}){
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're leaving the drop zone itself, not a child element
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            // Validate file type
            if (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf') {
                // Validate file size (10MB limit)
                if (droppedFile.size > 10 * 1024 * 1024) {
                    setError('File size must be less than 10MB');
                    return;
                }
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Please upload an image or PDF file');
            }
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
                // Validate file size (10MB limit)
                if (selectedFile.size > 10 * 1024 * 1024) {
                    setError('File size must be less than 10MB');
                    return;
                }
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Please upload an image or PDF file');
            }
        }
    };

    async function handleUpload(e) {
        e.preventDefault();
        if(!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);

        try{
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/ocr", {
                method: "POST",
                headers: {
                    "x-ocr-key": process.env.NEXT_PUBLIC_OCR_API_KEY || "",
                },
                body: formData,
            });

            const data = await res.json();
            if(!data.success) throw new Error(data.error || "OCR Failed");

            if(onParsed) onParsed(data);
            setFile(null); // Reset after successful upload
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
        catch(err){
            setError(err.message);
        } finally{
            setLoading(false);
        }
    }

    return (
        <div className={styles.uploadContainer}>
            <div 
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={(e) => {
                    // Don't trigger if clicking on the button inside
                    if (e.target.closest(`.${styles.changeFileButton}`)) {
                        return;
                    }
                    fileInputRef.current?.click();
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className={styles.hiddenInput}
                />
                
                <div className={styles.dropZoneContent}>
                    {loading ? (
                        <>
                            <div className={styles.spinner}></div>
                            <p className={styles.dropZoneText}>Processing your prescription...</p>
                        </>
                    ) : file ? (
                        <>
                            <div className={styles.fileIcon}>📄</div>
                            <p className={styles.fileName}>{file.name}</p>
                            <p className={styles.fileSize}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button 
                                type="button"
                                className={styles.changeFileButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    if(fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                Change File
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={styles.uploadIcon}>📤</div>
                            <p className={styles.dropZoneText}>
                                <strong>Click to upload</strong> or drag and drop
                            </p>
                            <p className={styles.dropZoneSubtext}>
                                PNG, JPG, PDF up to 10MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {file && !loading && (
                <button 
                    type="button"
                    className={styles.uploadButton}
                    onClick={handleUpload}
                >
                    <span>Extract Prescription Data</span>
                    <span className={styles.buttonIcon}>→</span>
                </button>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}