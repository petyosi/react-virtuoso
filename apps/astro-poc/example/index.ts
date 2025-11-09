/**
 * Example function that demonstrates TypeDoc documentation
 * @param name - The name to greet
 * @returns A greeting message
 */
export function example(name: string): string {
  return `Hello, ${name}!`;
}

/**
 * A sample interface to demonstrate TypeDoc
 */
export interface ExampleConfig {
  /** The configuration name */
  name: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Example class with automatic TypeDoc documentation generation moo foo o.
 */
export class ExampleClass {
  private _value: string;

  /**
   * Creates an instance of ExampleClass
   * @param value - The initial value
   */
  constructor(value: string) {
    this._value = value;
  }

  /**
   * Gets the current value
   * @returns The current value
   */
  getValue(): string {
    return this._value;
  }

  /**
   * Sets a new value
   * @param value - The new value to set
   */
  setValue(value: string): void {
    this._value = value;
  }
}
