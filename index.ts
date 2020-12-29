import * as axeCore from 'axe-core';
import merge from 'lodash.merge';
import * as chalk from 'chalk';

function configureAxe (options: any = {}) {

  const { globalOptions = {}, ...runnerOptions } = options

  // Set the global configuration for
  // axe-core 
  // https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure 
  axeCore.configure(globalOptions)


  /**
   * Small wrapper for axe-core#run that enables promises (required for Jest),
   * default options and injects html to be tested
   * @param {string} html requires a html string to be injected into the body
   * @param {object} [additionalOptions] aXe options to merge with default options
   * @returns {promise} returns promise that will resolve with axe-core#run results object
   */
  return function axe (html, additionalOptions = {}) {
    const [element, restore] = mount(html)
    const options = merge({}, runnerOptions, additionalOptions)

    return new Promise((resolve, reject) => {
      axeCore.run(element, options, (err, results) => {
        restore()
        if (err) throw err
        resolve(results)
      })
    })
  }
}

const axe = configureAxe();

function mount (html) {
  if (isHTMLElement(html)) {
    
    if (document.body.contains(html)) {
      return [html, () => undefined]
    }

    html = html.outerHTML
  }

  if (isHTMLString(html)) {
    const originalHTML = document.body.innerHTML
    const restore = () => {
      document.body.innerHTML = originalHTML
    }

    document.body.innerHTML = html
    return [document.body, restore]
  }

  if (typeof html === 'string') {
    throw new Error(`html parameter ("${html}") has no elements`)
  }

  throw new Error(`html parameter should be an HTML string or an HTML element`)
}

function isHTMLElement (html) {
  return !!html && typeof html === 'object' && typeof html.tagName === 'string'
}

function isHTMLString (html) {
  return typeof html === 'string' && /(<([^>]+)>)/i.test(html)
}

function filterViolations (violations, impactLevels) {
  if (impactLevels && impactLevels.length > 0) {
    return violations.filter(v => impactLevels.includes(v.impact))
  }
  return violations
}

const toHaveNoViolations = {
  toHaveNoViolations () {
    return {
      compare: function(results) {
        if (typeof results.violations === "undefined") {
          throw new Error("No violations found in aXe results object");
        }

        const violations = filterViolations(
          results.violations,
          results.toolOptions ? results.toolOptions.impactLevels : []
        )

        const reporter = violations => {
          if (violations.length === 0) {
            return []
          }

          const lineBreak = '\n\n'
          const horizontalLine = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'

          return violations.map(violation => {
            const errorBody = violation.nodes.map(node => {
              const selector = node.target.join(', ')
              const expectedText = `Expected the HTML found at $('${selector}') to have no violations:` + lineBreak
              return (
                expectedText +
                chalk.grey(node.html) +
                lineBreak +
                `Received:` +
                lineBreak +
                `${violation.help} (${violation.id})` +
                lineBreak +
                chalk.yellow(node.failureSummary) +
                lineBreak + (
                  violation.helpUrl ? 
                  `You can find more information on this issue here: \n${chalk.blue(violation.helpUrl)}` : 
                  ''
                )
                
              )
            }).join(lineBreak)

            return (errorBody)
          }).join(lineBreak + horizontalLine + lineBreak)
        }

        const formatedViolations = reporter(violations) as string;
        const pass = formatedViolations.length === 0

        const message = pass ? '' : formatedViolations;

        return { actual: violations, message, pass }
      }
    }
  }
}

export { toHaveNoViolations, axe }

