import { NaiveDate, NaiveDatetime, Time } from "longport"

/**
 * 将YYYYMMDD格式的日期字符串转换为NaiveDate对象
 * @param dateStr 格式为"YYYYMMDD"的日期字符串
 * @returns NaiveDate对象
 * @throws Error 当输入格式无效时抛出错误
 */
export const parseNaiveDate = (dateStr: string): NaiveDate => {
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error('日期格式无效，应为"YYYYMMDD"')
  }

  const year = Number.parseInt(dateStr.substring(0, 4), 10)
  const month = Number.parseInt(dateStr.substring(4, 6), 10)
  const day = Number.parseInt(dateStr.substring(6, 8), 10)

  // 验证日期是否有效
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('无效的日期值')
  }

  return new NaiveDate(year, month, day)
}

/**
 * 将HHMMSS或HHMM格式的时间字符串转换为Time对象
 * @param timeStr 格式为"HHMMSS"或"HHMM"的时间字符串
 * @returns Time对象
 * @throws Error 当输入格式无效时抛出错误
 */
export const parseTime = (timeStr: string): Time => {
  if (!/^\d{4}(\d{2})?$/.test(timeStr)) {
    throw new Error('时间格式无效，应为"HHMM"或"HHMMSS"')
  }

  const hour = Number.parseInt(timeStr.substring(0, 2), 10)
  const minute = Number.parseInt(timeStr.substring(2, 4), 10)
  const second = timeStr.length > 4 ? Number.parseInt(timeStr.substring(4, 6), 10) : 0

  // 验证时间是否有效
  if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second) ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new Error('无效的时间值')
  }

  return new Time(hour, minute, second)
}

/**
 * 结合日期和时间字符串生成NaiveDatetime对象
 * @param dateStr 格式为"YYYYMMDD"的日期字符串
 * @param timeStr 格式为"HHMMSS"或"HHMM"的时间字符串
 * @returns NaiveDatetime对象
 * @throws Error 当输入格式无效时抛出错误
 */
export const parseNaiveDatetime = (dateStr: string, timeStr?: string): NaiveDatetime => {
  const date = parseNaiveDate(dateStr)
  const time = timeStr ? parseTime(timeStr) : new Time(0, 0, 0)
  return new NaiveDatetime(date, time)
}
