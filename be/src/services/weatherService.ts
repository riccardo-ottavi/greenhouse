
export type WeatherSource = "OPEN_METEO" | "FALLBACK";

export interface ExternalWeather {
    temperature: number;
    humidity: number;
    source: WeatherSource;
    observedAt: string;
    receivedAt: string;
}

let latestWeather: ExternalWeather | null = null;

export function updateExternalWeather(
    weather: Omit<ExternalWeather, "receivedAt">
): ExternalWeather {
    latestWeather = {
        ...weather,
        receivedAt: new Date().toISOString()
    };

    return latestWeather;
}

export function getExternalWeather(): ExternalWeather | null {
    return latestWeather;
}
