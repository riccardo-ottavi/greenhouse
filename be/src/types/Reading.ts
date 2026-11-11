export type ReadingUnit = "°C" | "%" | "lux";

export type ReadingInput = {
    sensorId: number;
    value: number;
    unit: ReadingUnit;
    timestamp: string;
};

export type DeviceReadingInput = {
    deviceId: string;
    readings: ReadingInput[];
};

export type Reading = {
    id: number;
    sensorId: number;
    value: number;
    unit: ReadingUnit;
    timestamp: Date;
};

export type ReadingRange = "24h" | "7d" | "all";

export type ReadingHistoryQuery = {
    sensorId: number;
    from?: Date;
    cursor?: {
        timestamp: Date;
        id: number;
    };
    limit: number;
};

export type ReadingHistoryPage = {
    readings: Reading[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type ReadingAggregatePoint = {
    timestamp: Date;
    avg: number;
    min: number;
    max: number;
    count: number;
};

export type ReadingAggregate = {
    range: ReadingRange;
    bucketSeconds: number;
    points: ReadingAggregatePoint[];
};