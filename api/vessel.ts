import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MarineTrafficService } from "../lib/MarineTrafficService"; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const vesselId = req.query.vesselId as string;

    if (!vesselId) {
      return res.status(400).json({ error: "Missing vesselId in query" });
    }

    const service = new MarineTrafficService();
    const result = await service.fetchVesselAll(vesselId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
