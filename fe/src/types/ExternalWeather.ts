export type WeatherSource = "OPEN_METEO" | "FALLBACK";

export interface ExternalWeather {
    temperature: number;
    humidity: number;
    source: WeatherSource;
    observedAt: string;
    receivedAt: string;
}