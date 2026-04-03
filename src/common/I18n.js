// @ts-check

const FALLBACK_LOCALE = "en";

/**
 * I18n translation class.
 */
class I18n {
  /**
   * Constructor.
   *
   * @param {Object} options Options.
   * @param {string=} options.locale Locale.
   * @param {any} options.translations Translations.
   */
  constructor({ locale, translations }) {
    this.locale = locale || FALLBACK_LOCALE;
    this.translations = translations;
  }

  /**
   * Get translation.
   *
   * @param {string} str String to translate.
   * @returns {string} Translated string.
   */
  t(str) {
    if (!this.translations[str]) {
      throw new Error(`${str} Translation string not found`);
    }

    if (!this.translations[str][this.locale]) {
      // Log detailed message for debugging, but avoid exposing locale-controlled details to clients.
      // eslint-disable-next-line no-console
      throw new Error("Translation for the requested locale is not available");
    }

    return this.translations[str][this.locale];
  }
}

export { I18n };
export default I18n;
