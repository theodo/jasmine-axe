# axe-for-jasmine

[![npm version](https://img.shields.io/npm/v/axe-for-jasmine.svg)](https://www.npmjs.com/package/axe-for-jasmine)
![node](https://img.shields.io/node/v/axe-for-jasmine)

Custom [Jasmine](https://jasmine.github.io/) matcher for [aXe](https://github.com/dequelabs/axe-core) for testing accessibility

## Installation:

```bash
npm install --save-dev axe-for-jasmine
```

If you're using [TypeScript](https://www.typescriptlang.org/) you will need to add a `d.ts` with the following lines:

```javascript
declare module jasmine {
    interface Matchers<T> {
        toHaveNoViolations(): void;
    }
}
```

## Usage:

```javascript
import { axe, toHaveNoViolations } from "axe-for-jasmine";
import TestComponent from "./TestComponent.component";

describe("TestComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
    });
    TestBed.compileComponents();
    jasmine.addMatchers(toHaveNoViolations);
  });

  it("should pass accessibility test", async () => {
    const fixture = TestBed.createComponent(TestComponent);
    const render = () => fixture.nativeElement;
    const html = render();

    expect(await axe(html)).toHaveNoViolations();
  });
});
```

### Axe configuration

The `axe` function allows options to be set with the [same options as documented in axe-core](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#options-parameter):

```javascript
import { axe, toHaveNoViolations } from "axe-for-jasmine";

describe("TestComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
    });
    TestBed.compileComponents();
    jasmine.addMatchers(toHaveNoViolations);
  });

  it("should demonstrate this matcher`s usage with a custom config", async () => {
    const render = () => `
        <div>
            <img src="#"/>
        </div>
    `;
    const html = render();

    const results = await axe(html, {
      rules: {
        // for demonstration only, don't disable rules that need fixing.
        "image-alt": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
```

## Setting global configuration

If you find yourself repeating the same options multiple times, you can export a version of the `axe` function with defaults set.

Note: You can still pass additional options to this new instance; they will be merged with the defaults.

This could be done in [Jest's setup step](https://jestjs.io/docs/en/setup-teardown)

```javascript
// Global helper file (axe-helper.js)
import { configureAxe } from "axe-for-jasmine";

const axe = configureAxe({
  rules: {
    // for demonstration only, don't disable rules that need fixing.
    "image-alt": { enabled: false },
  },
});

export default axe;
```

```javascript
// Individual test file (test.js)
import { toHaveNoViolations } from "axe-for-jasmine";
import axe from "./axe-helper.js";

describe("TestComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
    });
    TestBed.compileComponents();
    jasmine.addMatchers(toHaveNoViolations);
  });

  it("should demonstrate this matcher`s usage with a default config", async () => {
    const render = () => `
        <div>
            <img src="#"/>
        </div>
    `;
    const html = render();

    expect(await axe(html)).toHaveNoViolations();
  });
});
```

### Setting custom rules and checks.

The configuration object passed to `configureAxe`, accepts a `globalOptions` property to configure the format of the data used by axe and to add custom checks and rules. The property value is the same as the parameter passed to [axe.configure](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#parameters-1).

```javascript
// Global helper file (axe-helper.js)
import { configureAxe } from "axe-for-jasmine";

const axe = configureAxe({
  globalOptions: {
    checks: [
      /* custom checks definitions */
    ],
  },
  // ...
});

export default axe;
```

### Setting the level of user impact.

An array which defines which [impact](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) level should be considered. This ensures that only violations with a specific impact on the user are considered. The level of impact can be "minor", "moderate", "serious", or "critical".

```javascript
// Global helper file (axe-helper.js)
import { configureAxe } from "axe-for-jasmine";

const axe = configureAxe({
  impactLevels: ["critical"],
  // ...
});

export default axe;
```

Refer to [Developing Axe-core Rules](https://github.com/dequelabs/axe-core/blob/master/doc/rule-development.md) for instructions on how to develop custom rules and checks.
