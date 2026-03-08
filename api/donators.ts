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
  tier: "Individual" | "Household" | "Family";
  discount: boolean;
  membershipLengthMonths: number;
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
  tier: "Individual" | "Household" | "Family";
  discount: boolean;
  membershipLengthMonths: number;
  membershipDateEnd: string;
  submittedDate: string;
  status: "Pending Giro" | "Pending e-Giro";
  householdMembers?: HouseholdMember[];
};

type DonatorState = {
  currentDonators: Donator[];
  incomingDonators: IncomingDonator[];
};

type UserPayload = {
  id?: string;
  name: string;
  tier: "Individual" | "Household" | "Family";
  discount?: boolean;
  membershipLengthMonths?: number;
  membershipLength?: number;
  membershipDateEnd?: string;
  monthlyAmount?: number;
  status?: "Pending Giro" | "Pending e-Giro";
  submittedDate?: string;
  householdMembers?: HouseholdMember[];
};

type ActionPayload =
  | {
      type: "ingest";
      user: UserPayload;
    }
  | {
      type: "ingestApproved";
      user: UserPayload;
    }
  | {
      type: "approved";
      user: UserPayload;
    }
  | { type: "approve"; id: string }
  | { type: "reject"; id: string }
  | { type: "deactivate"; id: string }
  | { type: "reactivate"; id: string };

declare global {
  // eslint-disable-next-line no-var
  var __DONATOR_MVP_STATE__: DonatorState | undefined;
}

const STATE_KEY = "donators_state_v1";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const SEED_STATE: DonatorState = {
  currentDonators: [
    {
      id: "1",
      name: "Ahmad bin Sulaiman",
      tier: "Individual",
      discount: false,
      membershipLengthMonths: 12,
      membershipDateEnd: "2027-03-31",
      monthlyAmount: 50,
      status: "Active",
      bounces: 0,
      history: [],
    },
  ],
  incomingDonators: [
    {
      id: "101",
      name: "Hassan Basri",
      tier: "Individual",
      discount: false,
      membershipLengthMonths: 12,
      membershipDateEnd: "2027-03-31",
      submittedDate: "2026-03-08",
      status: "Pending Giro",
    },
  ],
};

const send = (res: any, statusCode: number, payload: unknown) => {
  res.status(statusCode).json(payload);
};

const badRequest = (res: any, message: string) => {
  send(res, 400, { ok: false, error: message });
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

const resolveMembershipMonths = (user: UserPayload): number => {
  if (
    user.membershipLengthMonths !== undefined &&
    Number.isInteger(user.membershipLengthMonths)
  ) {
    return user.membershipLengthMonths;
  }
  if (user.membershipLength !== undefined && Number.isInteger(user.membershipLength)) {
    return user.membershipLength;
  }
  return 12;
};

const resolveMembershipEnd = (user: UserPayload, months: number): string => {
  if (user.membershipDateEnd) {
    return user.membershipDateEnd;
  }
  const now = new Date();
  now.setMonth(now.getMonth() + months);
  return now.toISOString().slice(0, 10);
};

const getKvUrl = () =>
  process.env.KV_REST_API_URL || process.env.dashboardo_KV_REST_API_URL;

const getKvToken = () =>
  process.env.KV_REST_API_TOKEN || process.env.dashboardo_KV_REST_API_TOKEN;

const hasKvConfig = () => Boolean(getKvUrl() && getKvToken());

const kvRequest = async (path: string) => {
  const url = getKvUrl();
  const token = getKvToken();
  if (!url || !token) {
    throw new Error("KV env vars are missing");
  }

  const response = await fetch(`${url}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV request failed: ${response.status} ${text}`);
  }

  return response.json();
};

const getMemoryState = (): DonatorState => {
  if (!globalThis.__DONATOR_MVP_STATE__) {
    globalThis.__DONATOR_MVP_STATE__ = clone(SEED_STATE);
  }
  return globalThis.__DONATOR_MVP_STATE__;
};

const getState = async (): Promise<DonatorState> => {
  if (!hasKvConfig()) {
    return getMemoryState();
  }

  try {
    const payload = await kvRequest(`/get/${STATE_KEY}`);
    const stored = payload?.result;
    if (stored && typeof stored === "object") {
      return stored as DonatorState;
    }
    if (typeof stored === "string") {
      const parsed = JSON.parse(stored) as DonatorState;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed if KV call fails once.
  }

  const seeded = clone(SEED_STATE);
  await setState(seeded);
  return seeded;
};

const setState = async (state: DonatorState): Promise<void> => {
  if (!hasKvConfig()) {
    globalThis.__DONATOR_MVP_STATE__ = state;
    return;
  }

  const serialized = encodeURIComponent(JSON.stringify(state));
  await kvRequest(`/set/${STATE_KEY}/${serialized}`);
};

export default async function handler(req: any, res: any) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-api-key");
    res.setHeader("Cache-Control", "no-store, max-age=0");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return send(res, 405, { ok: false, error: "Method not allowed" });
    }

    const expectedApiKey = process.env.MVP_API_KEY;
    if (
      req.method === "POST" &&
      expectedApiKey &&
      req.headers["x-api-key"] !== expectedApiKey
    ) {
      return send(res, 401, { ok: false, error: "Unauthorized" });
    }

    const state = await getState();

    if (req.method === "GET") {
      return send(res, 200, {
        ok: true,
        ...state,
        storage: hasKvConfig() ? "vercel-kv" : "memory-fallback",
      });
    }

    const payload = parseBody(req.body);
    if (!payload || typeof payload !== "object" || !("type" in payload)) {
      return badRequest(res, "Invalid payload");
    }

    if (payload.type === "ingest") {
      if (!payload.user?.name || !payload.user?.tier) {
        return badRequest(res, "name and tier are required");
      }

      const membershipLengthMonths = resolveMembershipMonths(payload.user);
      const incoming: IncomingDonator = {
        id: payload.user.id || randomUUID(),
        name: payload.user.name,
        tier: payload.user.tier,
        discount: Boolean(payload.user.discount),
        membershipLengthMonths,
        membershipDateEnd: resolveMembershipEnd(payload.user, membershipLengthMonths),
        submittedDate: payload.user.submittedDate || new Date().toISOString().slice(0, 10),
        status: payload.user.status || "Pending Giro",
        householdMembers: payload.user.householdMembers,
      };

      state.incomingDonators.unshift(incoming);
      await setState(state);
      return send(res, 201, { ok: true, added: incoming, ...state });
    }

    if (payload.type === "ingestApproved" || payload.type === "approved") {
      if (!payload.user?.name || !payload.user?.tier) {
        return badRequest(res, "name and tier are required");
      }

      const membershipLengthMonths = resolveMembershipMonths(payload.user);
      const id = payload.user.id || randomUUID();
      const defaultAmount = payload.user.tier === "Individual" ? 50 : 100;
      const approvedDonator: Donator = {
        id,
        name: payload.user.name,
        tier: payload.user.tier,
        discount: Boolean(payload.user.discount),
        membershipLengthMonths,
        membershipDateEnd: resolveMembershipEnd(payload.user, membershipLengthMonths),
        monthlyAmount: payload.user.monthlyAmount ?? defaultAmount,
        status: "Active",
        bounces: 0,
        history: [],
        householdMembers: payload.user.householdMembers,
      };

      state.currentDonators = state.currentDonators.filter((d) => d.id !== id);
      state.incomingDonators = state.incomingDonators.filter((d) => d.id !== id);
      state.currentDonators.unshift(approvedDonator);

      await setState(state);
      return send(res, 201, { ok: true, added: approvedDonator, ...state });
    }

    if (payload.type === "approve") {
      const incomingIndex = state.incomingDonators.findIndex((d) => d.id === payload.id);
      if (incomingIndex === -1) {
        return send(res, 404, { ok: false, error: "Incoming donator not found" });
      }

      const incoming = state.incomingDonators[incomingIndex];
      const newDonator: Donator = {
        id: incoming.id,
        name: incoming.name,
        tier: incoming.tier,
        discount: incoming.discount,
        membershipLengthMonths: incoming.membershipLengthMonths,
        membershipDateEnd: incoming.membershipDateEnd,
        monthlyAmount: incoming.tier === "Individual" ? 50 : 100,
        status: "Active",
        bounces: 0,
        history: [],
        householdMembers: incoming.householdMembers,
      };

      state.currentDonators.unshift(newDonator);
      state.incomingDonators.splice(incomingIndex, 1);
      await setState(state);
      return send(res, 200, { ok: true, ...state });
    }

    if (payload.type === "reject") {
      state.incomingDonators = state.incomingDonators.filter((d) => d.id !== payload.id);
      await setState(state);
      return send(res, 200, { ok: true, ...state });
    }

    if (payload.type === "deactivate" || payload.type === "reactivate") {
      const newStatus = payload.type === "deactivate" ? "Inactive" : "Active";
      state.currentDonators = state.currentDonators.map((d) =>
        d.id === payload.id ? { ...d, status: newStatus } : d,
      );
      await setState(state);
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
