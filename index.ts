import * as axeCore from "axe-core";
import merge from "lodash.merge";
import { AxeResults, ImpactValue, Result, RunOptions, Spec } from "axe-core";
import jasmine from "jasmine";

/**
 * Checks if the HTML parameter provided is a HTML element.
 */
const isHTMLElement = (html: any) => {
  return !!html && typeof html === "object" && typeof html.tagName === "string";
};

/**
 * Checks that the HTML parameter provided is a string that contains HTML.
 */
const isHTMLString = (html: any) => {
  return typeof html === "string" && /(<([^>]+)>)/i.test(html);
};

/**
 * Converts a HTML string or HTML element to a mounted HTML element.
 */
const mount = (html: Element | string): [Element, () => void] => {
  if (isHTMLElement(html)) {
    const htmlElement = html as Element;
    if (document.body.contains(htmlElement)) {
      return [htmlElement, () => undefined];
    }

    html = htmlElement.outerHTML;
  }

  if (isHTMLString(html)) {
    const htmlString = html as string;
    const originalHTML = document.body.innerHTML;
    const restore = () => {
      document.body.innerHTML = originalHTML;
    };

    document.body.innerHTML = htmlString;
    return [document.body, restore];
  }

  if (typeof html === "string") {
    throw new Error(`html parameter ("${html}") has no elements`);
  }

  throw new Error(`html parameter should be an HTML string or an HTML element`);
};

export interface JasmineAxeConfigureOptions extends RunOptions {
  globalOptions?: Spec;
  impactLevels?: ImpactValue[];
}

/**
 * Small wrapper for axe-core#run that enables promises,
 * default options and injects html to be tested
 */
export const configureAxe = (options: JasmineAxeConfigureOptions = {}) => {
  const { globalOptions = {}, ...runnerOptions } = options;

  // Set the global configuration for axe-core
  // https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure
  axeCore.configure(globalOptions);

  /**
   * Small wrapper for axe-core#run that enables promises,
   * default options and injects html to be tested
   */
  return function axe(html: Element, additionalOptions = {}) {
    const [element, restore] = mount(html);
    const options = merge({}, runnerOptions, additionalOptions);

    return new Promise((resolve, reject) => {
      axeCore.run(element, options, (err, results) => {
        restore();
        if (err) throw err;
        resolve(results);
      });
    });
  };
};

/**
 * Format violations into a nice error message
 */
const reporter = (violations: Result[], allowedViolations?:number): string => {
  if (violations.length === 0) {
    return "";
  }

  const lineBreak = "\n\n";
  const horizontalLine = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

  const violationsSummary = `${violations.length} violations found. \n\n Expect to have ${allowedViolations ? 'less than '+ allowedViolations : 'no'} violations.`

  return violationsSummary + lineBreak + horizontalLine + lineBreak + violations
    .map((violation) => {
      const errorBody = violation.nodes
        .map((node) => {
          const selector = node.target.join(", ");
          const expectedText =
            `Violation found at $('${selector}')` +
            lineBreak;
          return (
            expectedText +
            node.html +
            lineBreak +
            `Received:` +
            lineBreak +
            `${violation.help} (${violation.id})` +
            lineBreak +
            node.failureSummary +
            lineBreak +
            (violation.helpUrl
              ? `You can find more information on this issue here: \n${violation.helpUrl}`
              : "")
          );
        })
        .join(lineBreak);

      return errorBody;
    })
    .join(lineBreak + horizontalLine + lineBreak);
};

/**
 * Custom Jasmine expect matcher, that can check aXe results for violations.
 */
const toHaveNoViolationsMatcher = (): jasmine.CustomMatcher => ({
  compare: (results: AxeResults): jasmine.CustomMatcherResult => {
    if (typeof results.violations === "undefined") {
      throw new Error("No violations found in aXe results object");
    }
    const { violations } = results;

    return {
      message: reporter(violations),
      pass:  violations.length === 0,
    };
  },
});

const toHaveLessThanXViolationsMatcher = (): jasmine.CustomMatcher => ({
  compare: (results: AxeResults, allowedViolations:number): jasmine.CustomMatcherResult => {
    if (typeof results.violations === "undefined") {
      throw new Error("No violations found in aXe results object");
    }
    const { violations } = results;

    return {
      message: reporter(violations, allowedViolations),
      pass: violations.length <= allowedViolations,
    };
  },
});

export const toHaveNoViolations: jasmine.CustomMatcherFactories = {
  toHaveNoViolations: () => toHaveNoViolationsMatcher(),
};
export const toHaveLessThanXViolations: jasmine.CustomMatcherFactories = {
  toHaveLessThanXViolations: () => toHaveLessThanXViolationsMatcher(),
};

export const axe = configureAxe();

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toHaveNoViolations(): void;
      toHaveLessThanXViolations(allowedViolations:number): void;
    }
  }

  // axe-core depends on a global Node
  interface Node {}
}
