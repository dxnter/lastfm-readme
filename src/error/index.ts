export class InvalidInputError extends Error {
  constructor(message = 'InvalidInputError') {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class InvalidPeriodError extends Error {
  constructor(period: string) {
    super(
      `Invalid period provided provided: "${period}". Valid options are: "7day", "1month", "3month", "6month", "12month", "overall"`,
    );
    this.name = 'InvalidPeriodError';
  }
}

export class InvalidRowsError extends Error {
  constructor(rows: string) {
    super(
      `Invalid rows provided: "${rows}". Valid row range is between 1 and 50`,
    );
    this.name = 'InvalidRowsError';
  }
}

export class InvalidUserInfoDisplayError extends Error {
  constructor(option: string) {
    super(
      `Invalid display value provided: "${option}". Valid value is an array of strings`,
    );
    this.name = 'InvalidUserInfoDisplayError';
  }
}

export class InvalidUserInfoDisplayOptionError extends Error {
  constructor(options: string[]) {
    super(`Invalid display option provided: "${options}" `);
    this.name = 'InvalidUserInfoDisplayError';
  }
}
