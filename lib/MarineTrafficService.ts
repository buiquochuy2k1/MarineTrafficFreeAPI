import axios, { AxiosResponse } from "axios";
import fs from "fs";
import path from "path";

interface CookieData {
  name: string;
  value: string;
}

interface VesselGeneral {
  shipId: number;
  name: string;
  imo: number;
  mmsi: number;
  country: string;
  yearBuilt?: number | null;
  type: string;
  last_updated: string;
}

interface VesselPosition {
  shipId: number;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  timestamp: number;
}

interface VesselVoyage {
  [key: string]: any; // dữ liệu trả về phức tạp, bạn có thể định nghĩa chi tiết sau
}

interface VesselSummary {
  [key: string]: any; // dữ liệu trả về phức tạp, bạn có thể định nghĩa chi tiết sau
}

interface FetchResult<T> {
  success: boolean;
  timestamp: string;
  [key: string]: T | boolean | string;
}

export class MarineTrafficService {
  private cookieHeader: string = "";

  constructor() {
    this.loadCookies();
  }

  private loadCookies(): void {
    try {
      const cookieFilePath = path.resolve(process.cwd(), "public/cookie.json");

      if (fs.existsSync(cookieFilePath)) {
        const cookieData = fs.readFileSync(cookieFilePath, "utf8");
        const cookies: CookieData[] = JSON.parse(cookieData);
        this.cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      } else {
        console.warn("⚠️ Cookie file not found, requests may fail without authentication");
      }
    } catch (error) {
      console.error("Error loading cookies:", error);
    }
  }

  private getRequestHeaders() {
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: this.cookieHeader,
    };
  }

  async fetchVesselGeneral(vesselId: string): Promise<FetchResult<VesselGeneral>> {
    const url = `https://www.marinetraffic.com/en/vessels/${vesselId}/general`;
    try {
      const response: AxiosResponse<any> = await axios.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 30000,
      });

      return {
        vessel: {
          shipId: response.data.shipId,
          name: response.data.name || "Unknown",
          imo: response.data.imo,
          mmsi: response.data.mmsi,
          country: response.data.country,
          yearBuilt: response.data.yearBuilt,
          type: response.data.type,
          last_updated: new Date().toISOString(),
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch vessel general data: ${error.response?.status} ${error.response?.statusText || error.message}`
      );
    }
  }

  async fetchVesselPosition(vesselId: string): Promise<FetchResult<VesselPosition>> {
    const url = `https://www.marinetraffic.com/en/vessels/${vesselId}/position`;
    try {
      const response: AxiosResponse<any> = await axios.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 30000,
      });

      return {
        position: {
          shipId: response.data.shipId,
          lat: response.data.lat,
          lon: response.data.lon,
          speed: response.data.speed,
          course: response.data.course,
          timestamp: response.data.timestamp,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch vessel position data: ${error.response?.status} ${error.response?.statusText || error.message}`
      );
    }
  }

  async fetchVesselVoyage(vesselId: string): Promise<FetchResult<VesselVoyage>> {
    const url = `https://www.marinetraffic.com/en/vessels/${vesselId}/voyage`;
    try {
      const response: AxiosResponse<any> = await axios.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 30000,
      });
      return {
        voyage: response.data,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch vessel voyage data: ${error.response?.status} ${error.response?.statusText || error.message}`
      );
    }
  }

  async fetchVesselSummary(vesselId: string): Promise<FetchResult<VesselSummary>> {
    const url = `https://www.marinetraffic.com/en/vessels/${vesselId}/summary`;
    try {
      const response: AxiosResponse<any> = await axios.get(url, {
        headers: this.getRequestHeaders(),
        timeout: 30000,
      });
      return {
        summary: response.data,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch vessel summary data: ${error.response?.status} ${error.response?.statusText || error.message}`
      );
    }
  }

  async fetchVesselAll(vesselId: string): Promise<any> {
    try {
      const [general, position, voyage, summary] = await Promise.allSettled([
        this.fetchVesselGeneral(vesselId),
        this.fetchVesselPosition(vesselId),
        this.fetchVesselVoyage(vesselId),
        this.fetchVesselSummary(vesselId),
      ]);

      const result: any = {
        vesselId,
        data: {},
        timestamp: new Date().toISOString(),
      };

      result.data.general =
        general.status === "fulfilled" ? general.value.vessel : { error: (general.reason as Error).message };
      result.data.position =
        position.status === "fulfilled" ? position.value.position : { error: (position.reason as Error).message };
      result.data.voyage =
        voyage.status === "fulfilled" ? voyage.value.voyage : { error: (voyage.reason as Error).message };
      result.data.summary =
        summary.status === "fulfilled" ? summary.value.summary : { error: (summary.reason as Error).message };

      return result;
    } catch (error: any) {
      throw new Error(`Failed to fetch all vessel data: ${error.message}`);
    }
  }
}
