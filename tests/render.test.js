// @ts-check

import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/jest-globals";
import { createLanguageNode, renderError } from "../src/common/render.js";

describe("Test render.js", () => {
  it("should escape malicious langColor in createLanguageNode fill attribute", () => {
    const maliciousColor = `red" onload="alert(1)`;
    const svg = createLanguageNode("JavaScript", maliciousColor);

    // The raw malicious string must not appear verbatim in the output
    expect(svg).not.toContain(maliciousColor);

    // The escaped value should appear instead of raw quotes
    expect(svg).toContain("red&quot; onload=&quot;alert(1)");

    // Verify the lang-color circle is present and the browser decodes
    // the escaped attribute back to the original value
    document.body.innerHTML = svg;
    const circle = queryByTestId(document.body, "lang-color");
    expect(circle).toBeTruthy();
    expect(circle?.getAttribute("fill")).toBe(maliciousColor);
  });

  it("should render createLanguageNode with a valid color", () => {
    const svg = createLanguageNode("TypeScript", "#3178c6");
    expect(svg).toContain('fill="#3178c6"');
    document.body.innerHTML = svg;
    const circle = queryByTestId(document.body, "lang-color");
    expect(circle?.getAttribute("fill")).toBe("#3178c6");
  });

  it("should test renderError", () => {
    document.body.innerHTML = renderError({ message: "Something went wrong" });
    expect(
      queryByTestId(document.body, "message")?.children[0],
    ).toHaveTextContent(/Something went wrong/gim);
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toBeEmptyDOMElement();

    // Secondary message
    document.body.innerHTML = renderError({
      message: "Something went wrong",
      secondaryMessage: "Secondary Message",
    });
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toHaveTextContent(/Secondary Message/gim);
  });
});
