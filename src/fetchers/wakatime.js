// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * Validates that an api_domain value is a safe public hostname.
 * Rejects IP addresses and internal/loopback hostnames to prevent SSRF.
 *
 * @param {string} domain The domain to validate.
 * @returns {boolean} Whether the domain is valid and safe.
 */
const isValidApiDomain = (domain) => {
  if (!domain || typeof domain !== "string") {
    return false;
  }
  const trimmed = domain.replace(/\/$/gi, "");
  // Each DNS label must start and end with an alphanumeric character; hyphens
  // are only allowed in the middle. An optional port number is allowed.
  if (
    !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(?::\d+)?$/.test(
      trimmed,
    )
  ) {
    return false;
  }
  const hostname = trimmed.split(":")[0].toLowerCase();
  // Reject all IPv4 addresses to avoid SSRF against internal networks
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return false;
  }
  // Reject localhost
  if (hostname === "localhost") {
    return false;
  }
  return true;
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

  const resolvedDomain =
    api_domain && isValidApiDomain(api_domain)
      ? api_domain.replace(/\/$/gi, "")
      : "wakatime.com";

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
