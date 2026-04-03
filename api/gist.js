// @ts-check

import { renderError } from "../src/common/render.js";
import { isLocaleAvailable } from "../src/translations.js";
import { renderGistCard } from "../src/cards/gist.js";
import { fetchGist } from "../src/fetchers/gist.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import { guardAccess } from "../src/common/access.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseBoolean } from "../src/common/ops.js";
import { sanitizeColor } from "../src/common/color.js";

// @ts-ignore
export default async (req, res) => {
  const {
    id,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    locale,
    border_radius,
    border_color,
    show_owner,
    hide_border,
  } = req.query;

  res.setHeader("Content-Type", "image/svg+xml");
  const safeTitleColor = sanitizeColor(title_color);
  const safeTextColor = sanitizeColor(text_color);
  const safeIconColor = sanitizeColor(icon_color);
  const safeBgColor = sanitizeColor(bg_color);
  const safeBorderColor = sanitizeColor(border_color);

  const access = guardAccess({
    res,
    id,
    type: "gist",
    colors: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.isPassed) {
    return access.result;
  }

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
        renderOptions: {
          title_color: safeTitleColor,
          text_color: safeTextColor,
          bg_color: safeBgColor,
          border_color: safeBorderColor,
          theme,
        },
      }),
    );
  }

  try {
    const gistData = await fetchGist(id);
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.GIST_CARD.DEFAULT,
      min: CACHE_TTL.GIST_CARD.MIN,
      max: CACHE_TTL.GIST_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderGistCard(gistData, {
        title_color: safeTitleColor,
        icon_color: safeIconColor,
        text_color: safeTextColor,
        bg_color: safeBgColor,
        theme,
        border_radius,
        border_color: safeBorderColor,
        locale: locale ? locale.toLowerCase() : null,
        show_owner: parseBoolean(show_owner),
        hide_border: parseBoolean(hide_border),
      }),
    );
  } catch (err) {
    setErrorCacheHeaders(res);
    if (err instanceof Error) {
      return res.send(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            title_color: safeTitleColor,
            text_color: safeTextColor,
            bg_color: safeBgColor,
            border_color: safeBorderColor,
            theme,
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
      );
    }
    return res.send(
      renderError({
        message: "An unknown error occurred",
        renderOptions: {
          title_color: safeTitleColor,
          text_color: safeTextColor,
          bg_color: safeBgColor,
          border_color: safeBorderColor,
          theme,
        },
      }),
    );
  }
};
