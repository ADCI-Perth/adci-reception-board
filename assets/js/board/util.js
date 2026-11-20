// Small shared helpers for board code.

export function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
