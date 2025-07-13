export class SessionReadError extends Error {
  static {
    this.prototype.name = "ChatFileReadError";
  }

  readonly filePath: string;

  constructor(filePath: string, options?: ErrorOptions) {
    super(`Failed to read chat file: ${filePath}`, options);
    this.filePath = filePath;
  }
}

export class ConfigDirectoryDetectionError extends Error {
  static {
    this.prototype.name = "ConfigDirectoryDetectionError";
  }

  constructor() {
    super("Failed to detect Claude code config directory");
  }
}

export class NoMessageError extends Error {
  static {
    this.prototype.name = "NoMessageError";
  }

  readonly filePath?: string;

  constructor(filePath?: string) {
    let message = "No message provided";
    if (filePath) message += ` in file: ${filePath}`;
    super(message);
    this.filePath = filePath;
  }
}
