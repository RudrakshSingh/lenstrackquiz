import { useState } from "react";

export default function PrescriptionUpload({onParsed}){
    const [file, setFile] = useState(null);
    const[loading, setLoading] = useState(false);
    const[error, setError] = useState(null);

    async function handelUpload(e) {
        e.preventDefault();
        if(!file) return;

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
                body:formData,
            });

            const data = await res.json();
            if(!data.success) throw new Error(data.error || "OCR Failed");

            if(onParsed) onParsed(data);
        }
        catch(err){
            setError(err.message)
        } finally{
            setLoading(false);
        }
    }

    return (
        <div>
        <form onSubmit={handelUpload}>
        <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={loading}>
        {loading ? "Processing..." : "Upload Prescription"}
        </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
        );
}