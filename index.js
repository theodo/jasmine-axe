"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axe = exports.toHaveLessThanXViolations = exports.toHaveNoViolations = exports.configureAxe = void 0;
var axeCore = __importStar(require("axe-core"));
var lodash_merge_1 = __importDefault(require("lodash.merge"));
/**
 * Checks if the HTML parameter provided is a HTML element.
 */
var isHTMLElement = function (html) {
    return !!html && typeof html === "object" && typeof html.tagName === "string";
};
/**
 * Checks that the HTML parameter provided is a string that contains HTML.
 */
var isHTMLString = function (html) {
    return typeof html === "string" && /(<([^>]+)>)/i.test(html);
};
/**
 * Converts a HTML string or HTML element to a mounted HTML element.
 */
var mount = function (html) {
    if (isHTMLElement(html)) {
        var htmlElement = html;
        if (document.body.contains(htmlElement)) {
            return [htmlElement, function () { return undefined; }];
        }
        html = htmlElement.outerHTML;
    }
    if (isHTMLString(html)) {
        var htmlString = html;
        var originalHTML_1 = document.body.innerHTML;
        var restore = function () {
            document.body.innerHTML = originalHTML_1;
        };
        document.body.innerHTML = htmlString;
        return [document.body, restore];
    }
    if (typeof html === "string") {
        throw new Error("html parameter (\"" + html + "\") has no elements");
    }
    throw new Error("html parameter should be an HTML string or an HTML element");
};
/**
 * Small wrapper for axe-core#run that enables promises,
 * default options and injects html to be tested
 */
var configureAxe = function (options) {
    if (options === void 0) { options = {}; }
    var _a = options.globalOptions, globalOptions = _a === void 0 ? {} : _a, runnerOptions = __rest(options, ["globalOptions"]);
    // Set the global configuration for axe-core
    // https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure
    axeCore.configure(globalOptions);
    /**
     * Small wrapper for axe-core#run that enables promises,
     * default options and injects html to be tested
     */
    return function axe(html, additionalOptions) {
        if (additionalOptions === void 0) { additionalOptions = {}; }
        var _a = mount(html), element = _a[0], restore = _a[1];
        var options = lodash_merge_1.default({}, runnerOptions, additionalOptions);
        return new Promise(function (resolve, reject) {
            axeCore.run(element, options, function (err, results) {
                restore();
                if (err)
                    throw err;
                resolve(results);
            });
        });
    };
};
exports.configureAxe = configureAxe;
/**
 * Format violations into a nice error message
 */
var reporter = function (violations, allowedViolations) {
    if (violations.length === 0) {
        return "";
    }
    var lineBreak = "\n\n";
    var horizontalLine = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
    var violationsSummary = violations.length + " violations found. \n\n Expect to have " + (allowedViolations ? 'less than ' + allowedViolations : 'no') + " violations.";
    return violationsSummary + lineBreak + horizontalLine + lineBreak + violations
        .map(function (violation) {
        var errorBody = violation.nodes
            .map(function (node) {
            var selector = node.target.join(", ");
            var expectedText = "Violation found at $('" + selector + "')" +
                lineBreak;
            return (expectedText +
                node.html +
                lineBreak +
                "Received:" +
                lineBreak +
                (violation.help + " (" + violation.id + ")") +
                lineBreak +
                node.failureSummary +
                lineBreak +
                (violation.helpUrl
                    ? "You can find more information on this issue here: \n" + violation.helpUrl
                    : ""));
        })
            .join(lineBreak);
        return errorBody;
    })
        .join(lineBreak + horizontalLine + lineBreak);
};
/**
 * Custom Jasmine expect matcher, that can check aXe results for violations.
 */
var toHaveNoViolationsMatcher = function () { return ({
    compare: function (results) {
        if (typeof results.violations === "undefined") {
            throw new Error("No violations found in aXe results object");
        }
        var violations = results.violations;
        return {
            message: reporter(violations),
            pass: violations.length === 0,
        };
    },
}); };
var toHaveLessThanXViolationsMatcher = function () { return ({
    compare: function (results, allowedViolations) {
        if (typeof results.violations === "undefined") {
            throw new Error("No violations found in aXe results object");
        }
        var violations = results.violations;
        return {
            message: reporter(violations, allowedViolations),
            pass: violations.length <= allowedViolations,
        };
    },
}); };
exports.toHaveNoViolations = {
    toHaveNoViolations: function () { return toHaveNoViolationsMatcher(); },
};
exports.toHaveLessThanXViolations = {
    toHaveLessThanXViolations: function () { return toHaveLessThanXViolationsMatcher(); },
};
exports.axe = exports.configureAxe();
