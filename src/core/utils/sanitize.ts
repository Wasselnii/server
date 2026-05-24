

const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
};

export function sanitize(input: string): string {
    return input
        .replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")  // strip onerror=, onclick=, etc.
        .trim();
}

export function validateMessage(raw: unknown): string {
    if (typeof raw !== "string") throw new Error("Message must be a string");

    const trimmed = raw.trim();
    if (trimmed.length === 0) throw new Error("Message cannot be empty");
    if (trimmed.length > 1000) throw new Error("Message exceeds 1000 characters");

    return sanitize(trimmed);
}
