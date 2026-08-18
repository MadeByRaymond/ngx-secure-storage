/**
 * A utility class providing constants and helper methods for time conversions.
 * Including helper methods to convert the input time unit into milliseconds.
 */
export class TimeHelpers {
  /** Number of milliseconds in one second. */
  private static readonly SECOND = 1000;

  /** Number of milliseconds in one minute. */
  private static readonly MINUTE = 60 * TimeHelpers.SECOND;

  /** Number of milliseconds in one hour. */
  private static readonly HOUR   = 60 * TimeHelpers.MINUTE;

  /** Number of milliseconds in one day. */
  private static readonly DAY    = 24 * TimeHelpers.HOUR;

  /** Number of milliseconds in one week. */
  private static readonly WEEK   = 7  * TimeHelpers.DAY;

  /** Number of milliseconds in one standard month (assumed as 30 days). */
  private static readonly MONTH  = 30 * TimeHelpers.DAY;

  /** Number of milliseconds in one standard year (assumed as 365 days). */
  private static readonly YEAR   = 365 * TimeHelpers.DAY;

  /**
   * Converts seconds to milliseconds.
   * @param value - The number of seconds to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static secondsToMs(value: number): number { return value * TimeHelpers.SECOND; }

  /**
   * Converts minutes to milliseconds.
   * @param value - The number of minutes to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static minuteToMs(value: number): number { return value * TimeHelpers.MINUTE; }

  /**
   * Converts hours to milliseconds.
   * @param value - The number of hours to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static hoursToMs(value: number): number { return value * TimeHelpers.HOUR; }

  /**
   * Converts days to milliseconds.
   * @param value - The number of days to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static daysToMs(value: number): number { return value * TimeHelpers.DAY; }

  /**
   * Converts weeks to milliseconds.
   * @param value - The number of weeks to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static weeksToMs(value: number): number { return value * TimeHelpers.WEEK; }

  /**
   * Converts months to milliseconds based on a fixed 30-day month.
   * @param value - The number of months to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static monthsToMs(value: number): number { return value * TimeHelpers.MONTH; }

  /**
   * Converts years to milliseconds based on a fixed 365-day year.
   * @param value - The number of years to convert.
   * @returns The equivalent duration in milliseconds.
   */
  static yearsToMs(value: number): number { return value * TimeHelpers.YEAR; }
}
