// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * Validates and extracts a safe public hostname from a user-supplied domain
 * string. Returns null if the domain is invalid, an IP address, or a
 * loopback/internal host name.
 *
 * @param {string | undefined} rawDomain The raw, user-supplied domain string.
 * @returns {string | null} A safe hostname (with optional port), or null.
 */
const extractSafeApiDomain = (rawDomain) => {
  if (!rawDomain || typeof rawDomain !== "string") {
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
  // Reject all IPv4 addresses to prevent SSRF against internal networks.
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return null;
  }
  // Reject localhost and IPv6 loopback.
  if (hostname === "localhost" || hostname === "::1") {
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
