# jasmine-axe

[![npm version](https://img.shields.io/npm/v/jasmine-axe.svg)](https://www.npmjs.com/package/jasmine-axe)

Custom [Jasmine](https://jasmine.github.io/) matcher for [aXe](https://github.com/dequelabs/axe-core) for testing accessibility

## Installation:

```bash
npm install --save-dev jasmine-axe
```

## Usage:

```javascript
import { TestBed } from "@angular/core/testing";
import { axe, toHaveNoViolations } from "jasmine-axe";
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
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
```

### Axe configuration

The `axe` function allows options to be set with the [same options as documented in axe-core](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#options-parameter):

```javascript
import { axe, toHaveNoViolations } from "jasmine-axe";

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

The configuration object passed to `configureAxe` also accepts a `globalOptions` property to configure the format of the data used by axe and to add custom checks and rules. The property value is the same as the parameter passed to [axe.configure](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#parameters-1).

```javascript
// Global helper file (axe-helper.js)
import { configureAxe } from "jasmine-axe";

const axe = configureAxe({
  rules: {
    // for demonstration only, don't disable rules that need fixing.
    "image-alt": { enabled: false },
  },
  globalOptions: {
    checks: [
      /* custom checks definitions */
    ],
  },
});

export default axe;
```
