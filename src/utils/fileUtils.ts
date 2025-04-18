// Convert a data URL to a Blob.
export const dataURLToBlob = (dataurl: string) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

// Function to trigger a file download.
export const downloadFile = (filename: string, blob: Blob) => {
    console.log("Downloading file...", blob);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};

export function convertUuidToBinary(uuid: string): Uint8Array {
    // Remove all dashes from the UUID.
    const hexStr = uuid.replace(/-/g, "");
    if (hexStr.length !== 32) {
        throw new Error("Invalid UUID format");
    }
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        // Parse each pair of hex characters into a byte.
        bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Converts a Uint8Array (length 16) to a UUID string.
export function convertBinaryToUuid(bytes: Uint8Array): string {
    if (bytes.length !== 16) {
        throw new Error("Invalid UUID binary length");
    }
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}
