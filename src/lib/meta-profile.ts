/**
 * Messenger Profile API — best-effort customer profile enrichment.
 * GET /{psid}?fields=first_name,last_name,profile_pic,locale,timezone,gender
 */
import { graphRequest } from "@/lib/meta";

export interface MessengerProfile {
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  locale?: string;
  timezone?: number;
  gender?: string;
}

export async function getMessengerProfile(pageToken: string, psid: string): Promise<MessengerProfile> {
  return graphRequest<MessengerProfile>(
    psid,
    pageToken,
    { query: { fields: "first_name,last_name,profile_pic,locale,timezone,gender" } }
  );
}
