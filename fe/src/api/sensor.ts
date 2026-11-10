import type {
  Reading,
  ReadingAggregate,
  ReadingHistory,
  ReadingHistoryPage,
  ReadingRange,
} from "../types/Reading";
import type { Sensor } from "../types/Sensor";
 
const API_URL = import.meta.env.VITE_API_URL;

export const HISTORY_PAGE_SIZE = 1000;
export const HISTORY_MAX_PAGES = 2;
 
export const LIVE_PAGE_SIZE = 100;
 
export async function getSensorsByDevice(
  deviceId: number
): Promise<Sensor[]> {
  const response = await fetch(
    `${API_URL}/devices/${deviceId}/sensors`
  );
 
  if (!response.ok) {
    throw new Error("Failed to fetch sensors for this device");
  }
 
  return response.json() as Promise<Sensor[]>;
}
 
interface ReadingsPageOptions {
  range?: ReadingRange;
  limit?: number;
  cursor?: string | null;
}
 
export async function getReadingsPage(
  sensorId: number,
  { range = "24h", limit = HISTORY_PAGE_SIZE, cursor }: ReadingsPageOptions = {}
): Promise<ReadingHistoryPage> {
  const params = new URLSearchParams({
    range,
    limit: String(limit),
  });
 
  if (cursor) {
    params.set("cursor", cursor);
  }
 
  const response = await fetch(
    `${API_URL}/sensors/${sensorId}/readings?${params.toString()}`
  );
 
  if (!response.ok) {
    throw new Error("Failed to fetch readings for this sensor");
  }
 
  const page = (await response.json()) as ReadingHistoryPage;
 
  if (!page || !Array.isArray(page.readings)) {
    throw new Error("Unexpected readings response");
  }
 
  return page;
}
 
interface ReadingsHistoryOptions {
  range?: ReadingRange;
  limit?: number;
  maxPages?: number;
}
 
export async function getReadingsBySensor(
  sensorId: number,
  {
    range = "24h",
    limit = LIVE_PAGE_SIZE,
    maxPages = 1,
  }: ReadingsHistoryOptions = {}
): Promise<ReadingHistory> {
  const readings: Reading[] = [];
  let cursor: string | null = null;
  let hasMore = false;
 
  for (let page = 0; page < maxPages; page += 1) {
    const result: ReadingHistoryPage = await getReadingsPage(sensorId, {
      range,
      limit,
      cursor,
    });
 
    readings.push(...result.readings);
    hasMore = result.hasMore;
    cursor = result.nextCursor;
 
    if (!hasMore || !cursor) {
      hasMore = false;
      break;
    }
  }
 
  return { readings, truncated: hasMore };
}
 
export async function getReadingsAggregate(
  sensorId: number,
  range: ReadingRange = "24h"
): Promise<ReadingAggregate> {
  const response = await fetch(
    `${API_URL}/sensors/${sensorId}/readings/aggregate?range=${range}`
  );
 
  if (!response.ok) {
    throw new Error("Failed to fetch reading aggregate for this sensor");
  }
 
  const aggregate = (await response.json()) as ReadingAggregate;
 
  if (!aggregate || !Array.isArray(aggregate.points)) {
    throw new Error("Unexpected aggregate response");
  }
 
  return aggregate;
}