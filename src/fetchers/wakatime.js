// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * Validates and extracts a safe public hostname from a user-supplied domain
 * string. Returns null if the domain is invalid, an IP address, an IPv6
 * address, or a loopback/internal host name.
 *
 * @param {string | undefined} rawDomain The raw, user-supplied domain string.
 * @returns {string | null} A safe hostname (with optional port), or null.
 */
const extractSafeApiDomain = (rawDomain) => {
  if (!rawDomain || typeof rawDomain !== "string") {
    return null;
  }
  // Reject input containing '@' to prevent userinfo-based URL manipulation
  // (e.g. "evil.com@internal.host").
  if (rawDomain.includes("@")) {
    return null;
  }
  let parsed;
  try {
    // Use URL constructor to normalise and validate the domain.
    parsed = new URL(`https://${rawDomain.replace(/\/$/gi, "")}/`);
  } catch {
    return null;
  }
  const { hostname, port } = parsed;
  // Reject all IPv4 addresses (strict octet-range check) to prevent SSRF
  // against internal networks.
  if (
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(
      hostname,
    )
  ) {
    return null;
  }
  // Reject all IPv6 addresses (they may reference private/internal ranges).
  // IPv6 hostnames extracted by the URL API never include brackets.
  if (hostname.includes(":")) {
    return null;
  }
  // Reject localhost and common local-only hostnames.
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return null;
  }
  return port ? `${hostname}:${port}` : hostname;
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
