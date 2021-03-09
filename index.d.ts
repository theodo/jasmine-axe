import { ImpactValue, RunOptions, Spec } from "axe-core";
export interface JasmineAxeConfigureOptions extends RunOptions {
    globalOptions?: Spec;
    impactLevels?: ImpactValue[];
}
/**
 * Small wrapper for axe-core#run that enables promises,
 * default options and injects html to be tested
 */
export declare const configureAxe: (options?: JasmineAxeConfigureOptions) => (html: Element, additionalOptions?: {}) => Promise<unknown>;
export declare const toHaveNoViolations: jasmine.CustomMatcherFactories;
export declare const toHaveLessThanXViolations: jasmine.CustomMatcherFactories;
export declare const axe: (html: Element, additionalOptions?: {}) => Promise<unknown>;
declare global {
    namespace jasmine {
        interface Matchers<T> {
            toHaveNoViolations(): void;
            toHaveLessThanXViolations(allowedViolations: number): void;
        }
    }
    interface Node {
    }
}
