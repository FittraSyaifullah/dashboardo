import { randomUUID } from "node:crypto";

type HouseholdMember = {
  name: string;
  relationship: "Immediate Family" | "Parent/In-law";
};

type PaymentRecord = {
  date: string;
  amount: number;
  status: "Paid" | "Bounced" | "No Record";
};

type Donator = {
  id: string;
  name: string;
  tier: "Individual" | "Household";
  discount: boolean;
  membershipLength: number;
  membershipDateEnd: string;
  monthlyAmount: number;
  status: "Active" | "Inactive";
  bounces: 0 | 1 | 2;
  history: PaymentRecord[];
  householdMembers?: HouseholdMember[];
};

type IncomingDonator = {
  id: string;
  name: string;
  tier: "Individual" | "Household";
  discount: boolean;
  membershipLength: number;
  membershipDateEnd: string;
  submittedDate: string;
  status: "Pending Giro" | "Pending e-Giro";
  householdMembers?: HouseholdMember[];
};

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
        membershipLength?: number;
        membershipDateEnd?: string;
        status?: "Pending Giro" | "Pending e-Giro";
        submittedDate?: string;
        householdMembers?: IncomingDonator["householdMembers"];
      };
    }
  | {
      type: "ingestApproved";
      user: {
        id?: string;
        name: string;
        tier: "Individual" | "Household";
        discount?: boolean;
        membershipLength?: number;
        membershipDateEnd?: string;
        monthlyAmount?: number;
        householdMembers?: Donator["householdMembers"];
      };
    }
  | {
      type: "approved";
      user: {
        id?: string;
        name: string;
        tier: "Individual" | "Household";
        discount?: boolean;
        membershipLength?: number;
        membershipDateEnd?: string;
        monthlyAmount?: number;
        householdMembers?: Donator["householdMembers"];
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

const SEED_CURRENT_DONATORS: Donator[] = [
  {
    id: "1",
    name: "Ahmad bin Sulaiman",
    tier: "Individual",
    discount: false,
    membershipLength: 12,
    membershipDateEnd: "2027-03-31",
    monthlyAmount: 50,
    status: "Active",
    bounces: 0,
    history: [],
  },
];

const SEED_INCOMING_DONATORS: IncomingDonator[] = [
  {
    id: "101",
    name: "Hassan Basri",
    tier: "Individual",
    discount: false,
    membershipLength: 12,
    membershipDateEnd: "2027-03-31",
    submittedDate: "2026-03-08",
    status: "Pending Giro",
  },
];

const getState = (): DonatorState => {
  if (!globalThis.__DONATOR_MVP_STATE__) {
    globalThis.__DONATOR_MVP_STATE__ = {
      currentDonators: clone(SEED_CURRENT_DONATORS),
      incomingDonators: clone(SEED_INCOMING_DONATORS),
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
        membershipLength:
          payload.user.membershipLength && Number.isInteger(payload.user.membershipLength)
            ? payload.user.membershipLength
            : 12,
        membershipDateEnd:
          payload.user.membershipDateEnd ||
          new Date(new Date().setMonth(new Date().getMonth() + 12))
            .toISOString()
            .slice(0, 10),
        submittedDate:
          payload.user.submittedDate || new Date().toISOString().slice(0, 10),
        status: payload.user.status || "Pending Giro",
        householdMembers: payload.user.householdMembers,
      };

      state.incomingDonators.unshift(incoming);
      return send(res, 201, { ok: true, added: incoming, ...state });
    }

    if (payload.type === "ingestApproved" || payload.type === "approved") {
      if (!payload.user?.name || !payload.user?.tier) {
        return badRequest(res, "name and tier are required");
      }

      const id = payload.user.id || randomUUID();
      const defaultAmount = payload.user.tier === "Individual" ? 50 : 100;
      const approvedDonator: Donator = {
        id,
        name: payload.user.name,
        tier: payload.user.tier,
        discount: Boolean(payload.user.discount),
        membershipLength:
          payload.user.membershipLength && Number.isInteger(payload.user.membershipLength)
            ? payload.user.membershipLength
            : 12,
        membershipDateEnd:
          payload.user.membershipDateEnd ||
          new Date(new Date().setMonth(new Date().getMonth() + 12))
            .toISOString()
            .slice(0, 10),
        monthlyAmount: payload.user.monthlyAmount ?? defaultAmount,
        status: "Active",
        bounces: 0,
        history: [],
        householdMembers: payload.user.householdMembers,
      };

      state.currentDonators = state.currentDonators.filter((d) => d.id !== id);
      state.incomingDonators = state.incomingDonators.filter((d) => d.id !== id);
      state.currentDonators.unshift(approvedDonator);

      return send(res, 201, { ok: true, added: approvedDonator, ...state });
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
        membershipLength: incoming.membershipLength,
        membershipDateEnd: incoming.membershipDateEnd,
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
