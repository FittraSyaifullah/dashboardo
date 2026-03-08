import {
  MOCK_CURRENT_DONATORS,
  MOCK_INCOMING_DONATORS,
  Donator,
  IncomingDonator,
} from "../src/data";
import { randomUUID } from "node:crypto";

type DonatorState = {
  currentDonators: Donator[];
  incomingDonators: IncomingDonator[];
};

type ActionPayload =
  | {
      type: "ingest";
      user: {
        id?: string;
        name: string;
        tier: "Individual" | "Household";
        discount?: boolean;
        status?: "Pending Giro" | "Pending e-Giro";
        submittedDate?: string;
        householdMembers?: IncomingDonator["householdMembers"];
      };
    }
  | { type: "approve"; id: string }
  | { type: "reject"; id: string }
  | { type: "deactivate"; id: string }
  | { type: "reactivate"; id: string };

declare global {
  // eslint-disable-next-line no-var
  var __DONATOR_MVP_STATE__: DonatorState | undefined;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const getState = (): DonatorState => {
  if (!globalThis.__DONATOR_MVP_STATE__) {
    globalThis.__DONATOR_MVP_STATE__ = {
      currentDonators: clone(MOCK_CURRENT_DONATORS),
      incomingDonators: clone(MOCK_INCOMING_DONATORS),
    };
  }
  return globalThis.__DONATOR_MVP_STATE__;
};

const send = (res: any, statusCode: number, payload: unknown) => {
  res.status(statusCode).json(payload);
};

const parseBody = (body: unknown): ActionPayload | null => {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as ActionPayload;
    } catch {
      return null;
    }
  }
  return body as ActionPayload;
};

const badRequest = (res: any, message: string) => {
  send(res, 400, { ok: false, error: message });
};

export default function handler(req: any, res: any) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-api-key");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    const state = getState();

    if (req.method === "GET") {
      return send(res, 200, { ok: true, ...state });
    }

    if (req.method !== "POST") {
      return send(res, 405, { ok: false, error: "Method not allowed" });
    }

    const expectedApiKey = process.env.MVP_API_KEY;
    if (expectedApiKey && req.headers["x-api-key"] !== expectedApiKey) {
      return send(res, 401, { ok: false, error: "Unauthorized" });
    }

    const payload = parseBody(req.body);
    if (!payload || typeof payload !== "object" || !("type" in payload)) {
      return badRequest(res, "Invalid payload");
    }

    if (payload.type === "ingest") {
      if (!payload.user?.name || !payload.user?.tier) {
        return badRequest(res, "name and tier are required");
      }

      const incoming: IncomingDonator = {
        id: payload.user.id || randomUUID(),
        name: payload.user.name,
        tier: payload.user.tier,
        discount: Boolean(payload.user.discount),
        submittedDate:
          payload.user.submittedDate || new Date().toISOString().slice(0, 10),
        status: payload.user.status || "Pending Giro",
        householdMembers: payload.user.householdMembers,
      };

      state.incomingDonators.unshift(incoming);
      return send(res, 201, { ok: true, added: incoming, ...state });
    }

    if (payload.type === "approve") {
      const incomingIndex = state.incomingDonators.findIndex(
        (d) => d.id === payload.id,
      );
      if (incomingIndex === -1) {
        return send(res, 404, { ok: false, error: "Incoming donator not found" });
      }

      const incoming = state.incomingDonators[incomingIndex];
      const newDonator: Donator = {
        id: incoming.id,
        name: incoming.name,
        tier: incoming.tier,
        discount: incoming.discount,
        monthlyAmount: incoming.tier === "Individual" ? 50 : 100,
        status: "Active",
        bounces: 0,
        history: [],
        householdMembers: incoming.householdMembers,
      };

      state.currentDonators.unshift(newDonator);
      state.incomingDonators.splice(incomingIndex, 1);
      return send(res, 200, { ok: true, ...state });
    }

    if (payload.type === "reject") {
      state.incomingDonators = state.incomingDonators.filter(
        (d) => d.id !== payload.id,
      );
      return send(res, 200, { ok: true, ...state });
    }

    if (payload.type === "deactivate" || payload.type === "reactivate") {
      const newStatus = payload.type === "deactivate" ? "Inactive" : "Active";
      state.currentDonators = state.currentDonators.map((d) =>
        d.id === payload.id ? { ...d, status: newStatus } : d,
      );
      return send(res, 200, { ok: true, ...state });
    }

    return badRequest(res, "Unsupported action type");
  } catch (error: any) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error?.message || "Unknown error";
    return send(res, 500, { ok: false, error: message });
  }
}
