
// @ts-check

/**
 * Safely escapes any value for use inside SVG/XML attributes.
 * This is what eliminates the CodeQL "HTML construction which depends on library input" warning.
 *
 * @param {number | string | string[]} value Value to escape.
 * @returns {string} Escaped value.
 */
function escapeSvgAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export { escapeSvgAttribute };
