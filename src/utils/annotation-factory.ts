type Constructor = { new (...args: any[]): any };

interface AnnotatorOptions {
  message?: string;
  description?: string;
  tags?: { [key: string]: string };
  preserveTypes?: boolean;
}

interface Annotated {
  __doc__?: string;
}

class Annotator {
  private label: string;

  constructor(label: string, private options: AnnotatorOptions = {}) {
    this.label = label;
  }

  static forClass(className: string, options?: AnnotatorOptions) {
    return new Annotator(`Class: ${className}`, options);
  }

  static forMethod(methodName: string, options?: AnnotatorOptions) {
    return new Annotator(`Method: ${methodName}`, options);
  }

  static forFunction(options?: AnnotatorOptions) {
    return new Annotator("Function", options);
  }

  static forProperty(propertyName: string, options?: AnnotatorOptions) {
    return new Annotator(`Property: ${propertyName}`, options);
  }

  withDescription(description: string) {
    this.label += `\n\n${description}`;
    return this;
  }

  withTag(tagName: string, tagValue: string) {
    this.label += `\n\n@${tagName} ${tagValue}`;
    return this;
  }

  withPreserveTypes() {
    this.label += `\n\n@type ${this.getType()}`;
    return this;
  }

  decorate<T extends Constructor>(constructor: T): T;
  decorate(target: object, propertyKey: string | symbol): void;
  decorate(target: Function): Function;
  decorate(
    target: object | Function,
    propertyKey?: string | symbol
  ): Function | void {
    if (typeof target === "function" && propertyKey === undefined) {
      const self = this;

      const decoratedFunction = function(...args: any[]) {
        return target.apply(this, args);
      };

      decoratedFunction.__doc__ = self.label;

      return decoratedFunction;
    } else {
      const self = this;

      if (propertyKey === undefined) {
        target.__doc__ = self.label;
        return target;
      } else {
        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

        if (descriptor && typeof descriptor.value === "function") {
          const originalMethod = descriptor.value;

          descriptor.value = function(...args: any[]) {
            this.__doc__ = self.label;
            return originalMethod.apply(this, args);
          };

          return descriptor;
        } else {
          Object.defineProperty(target, propertyKey, {
            get() {
              return this[`_${propertyKey}`];
            },
            set(value) {
              this[`_${propertyKey}`] = value;
              this.__doc__ = self.label;
            },
            enumerable: true,
            configurable: true
          });
        }
      }
    }
  }

  private getType(): string {
    const types = {
      "number": "Number",
      "string": "String",
      "boolean": "Boolean"
    };

    const type = types[typeof this.options.preserveTypes] || "unknown";

    if (
      type === "unknown" &&
      this.options.preserveTypes &&
      this.options.preserveTypes.constructor &&
      typeof this.options.preserveTypes.constructor === "function"
    ) {
      return this.options.preserveTypes.constructor.name;
    }

    return type;
  }

  private formatTags(): string {
    if (!this.options.tags) {
      return "";
    }

    return Object.entries(this.options.tags)
      .map(([name, value]) => `@${name} ${value}`)
      .join("\n");
  }

  toString(): string {
    const { message, description } = this.options;

    let label = this.label;

    if (message) {
      label += ` (${message})`;
    }

    if (description) {
      label += `\n\n${description}`;
    }

    label += `\n\n${this.formatTags()}`;

    if (this.options.preserveTypes) {
      label += `\n\n@type ${this.getType()}`;
    }

    return label;
  }
}

// Example usage:

// const MyClass = Annotator.forClass("MyClass", {
//   message: "This is my class.",
//   description: "This is a test class.",
//   tags: {
//     author: "John Doe",
//     version: "1.0.0"
//   },
//   preserveTypes: true
// }).decorate(
//   class MyClass {
//     @Annotator.forMethod("myMethod", {
//       description: "This is a test method.",
//       tags: { param: "myParam - This is a test parameter." },
//       preserveTypes: true
//     })
//     myMethod(myParam: string): void {
//       console.log(`MyClass.myMethod(${myParam})`);
//     }

//     @Annotator.forProperty("myProperty", {
//       description: "This is a test property.",
//       tags: { readonly: "This property is read-only." },
//       preserveTypes: true
//     })
//     readonly myProperty: string = "test";
//   }
// );

// const myFunction = Annotator.forFunction({
//   message: "This is my function.",
//   description: "This is a test function.",
//   tags: {
//     author: "John Doe",
//     version: "1.0.0"
//   },
//   preserveTypes: true
// }).decorate(function myFunction(myParam: string): void {
//   console.log(`myFunction(${myParam})`);
// });

// const myObject = Annotator.forProperty("myProperty", {
//   description: "This is a test property.",
//   tags: { readonly: "This property is read-only." },
//   preserveTypes: true
// }).decorate({}, "myProperty");

// console.log(MyClass.prototype.myMethod.__doc__);
// console.log(MyClass.prototype.myProperty.__doc__);
// console.log(myFunction.__doc__);
// console.log(myObject.__doc__);

