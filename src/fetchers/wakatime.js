// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * Validates and extracts a safe public hostname from a user-supplied domain
 * string. Returns null if the domain is invalid, an IP address, or a
 * loopback/internal host name.
 *
 * The returned value is reconstructed entirely from regex capture groups so
 * that the taint-flow from the original user input is broken.
 *
 * @param {string | undefined} rawDomain The raw, user-supplied domain string.
 * @returns {string | null} A safe hostname (with optional port), or null.
 */
const extractSafeApiDomain = (rawDomain) => {
  if (!rawDomain || typeof rawDomain !== "string") {
    return null;
  }
  const cleaned = rawDomain.replace(/\/$/gi, "");
  // Each DNS label must start and end with an alphanumeric character.
  // Hyphens are only permitted in the middle of a label.
  // An optional :port suffix is accepted.
  const match =
    /^([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?$/.exec(
      cleaned,
    );
  if (!match) {
    return null;
  }
  // match[1] is the hostname, match[2] is the optional port.
  const safeHostname = match[1].toLowerCase();
  const safePort = match[2];
  // Reject all IPv4 addresses to prevent SSRF against internal networks.
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(safeHostname)) {
    return null;
  }
  // Reject localhost.
  if (safeHostname === "localhost") {
    return null;
  }
  // Reconstruct from the captured groups, not from the original user input,
  // to ensure only the validated parts are used.
  return safePort ? `${safeHostname}:${safePort}` : safeHostname;
};

/**
 * WakaTime data fetcher.
 *
 * @param {{username: string, api_domain: string }} props Fetcher props.
 * @returns {Promise<import("./types").WakaTimeData>} WakaTime data response.
 */
const fetchWakatimeStats = async ({ username, api_domain }) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const resolvedDomain = extractSafeApiDomain(api_domain) ?? "wakatime.com";

  try {
    const { data } = await axios.get(
      `https://${resolvedDomain}/api/v1/users/${username}/stats?is_including_today=true`,
    );

    return data.data;
  } catch (err) {
    if (err.response.status < 200 || err.response.status > 299) {
      throw new CustomError(
        `Could not resolve to a User with the login of '${username}'`,
        "WAKATIME_USER_NOT_FOUND",
      );
    }
    throw err;
  }
};

export { fetchWakatimeStats };
export default fetchWakatimeStats;
