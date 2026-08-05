import TvdManualAssignmentPage from "@/domains/superadmin/screens/TvdManualAssignmentPage";
import type {
  TvdAdminInstitutionListResponse,
  TvdAdminInstitutionWalletsResponse,
  TvdManualAssignmentResponse,
} from "@/store/tvd";
import { vi } from "vitest";
import { renderWithAuthStore } from "../../../utils/renderWithStore";

export type CapturedAssignmentRequest = {
  method: string;
  pathname: string;
  headers: Headers;
  body: unknown;
};

export type AssignmentFixtures = {
  institutions: TvdAdminInstitutionListResponse;
  wallets: TvdAdminInstitutionWalletsResponse;
  pendingAssignment: TvdManualAssignmentResponse;
  needsReviewAssignment: TvdManualAssignmentResponse;
};

export type AssignmentMockOptions = {
  fixtures?: AssignmentFixtures;
  captured?: CapturedAssignmentRequest[];
  createAssignment?: (
    request: CapturedAssignmentRequest,
  ) => Response | Promise<Response>;
  getAssignment?: () => Response | Promise<Response>;
  getInstitutions?: () => Response | Promise<Response>;
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export function createAssignmentFixtures(): AssignmentFixtures {
  const pendingAssignment: TvdManualAssignmentResponse = {
    id: "accreditation-1",
    sourceType: "MANUAL_GRANT",
    tenantId: "tenant-1",
    targetAssignmentId: "assignment-eligible",
    targetWallet: "0x2222222222222222222222222222222222222222",
    tokenAmount: "25.5",
    tokenAmountSmallestUnit: "25500000000000000000",
    status: "SUBMITTED",
    txHash: null,
    chainId: null,
    contractAddress: null,
    blockNumber: null,
    reason: "Asignación operativa piloto",
    attempts: 1,
    failureCategory: null,
    lastErrorCode: null,
    createdAt: "2026-07-22T10:00:00.000Z",
    updatedAt: "2026-07-22T10:00:00.000Z",
    submittedAt: "2026-07-22T10:01:00.000Z",
    confirmedAt: null,
  };

  return {
    institutions: {
      items: [
        {
          tenantId: "tenant-1",
          name: "Tribunal Supremo Electoral",
          active: true,
          assignmentsCount: 2,
          eligibleWalletsCount: 1,
        },
        {
          tenantId: "tenant-disabled",
          name: "Institución deshabilitada",
          active: false,
          assignmentsCount: 1,
          eligibleWalletsCount: 0,
        },
      ],
      page: 1,
      limit: 20,
      total: 2,
      hasNextPage: false,
    },
    wallets: {
      tenantId: "tenant-1",
      tenantName: "Tribunal Supremo Electoral",
      tenantActive: true,
      wallets: [
        {
          assignmentId: "assignment-eligible",
          userId: "user-eligible",
          institutionalRole: "TENANT_ADMIN",
          status: "APPROVED",
          active: true,
          userActive: true,
          wallet: "0x2222222222222222222222222222222222222222",
          walletNormalized: "0x2222222222222222222222222222222222222222",
          walletStatus: "VERIFIED",
          walletVerifiedAt: "2026-07-22T10:00:00.000Z",
          walletVerificationSource: "IDENTITY",
          eligible: true,
        },
        {
          assignmentId: "assignment-suspended",
          userId: "user-suspended",
          institutionalRole: "TENANT_ADMIN",
          status: "APPROVED",
          active: false,
          userActive: true,
          wallet: "0x3333333333333333333333333333333333333333",
          walletNormalized: "0x3333333333333333333333333333333333333333",
          walletStatus: "SUSPENDED",
          walletVerifiedAt: "2026-07-22T10:00:00.000Z",
          walletVerificationSource: "IDENTITY",
          eligible: false,
        },
        {
          assignmentId: "assignment-pending",
          userId: "user-pending",
          institutionalRole: "FINANCE_ADMIN",
          status: "PENDING",
          active: true,
          userActive: true,
          wallet: "0x4444444444444444444444444444444444444444",
          walletNormalized: "0x4444444444444444444444444444444444444444",
          walletStatus: "PENDING",
          walletVerifiedAt: null,
          walletVerificationSource: null,
          eligible: false,
        },
      ],
    },
    pendingAssignment,
    needsReviewAssignment: {
      ...pendingAssignment,
      status: "NEEDS_REVIEW",
      lastErrorCode: "TVD_RECEIPT_NOT_FOUND",
    },
  };
}

export function configureAssignmentMocks({
  fixtures = createAssignmentFixtures(),
  captured = [],
  createAssignment = () => jsonResponse(fixtures.pendingAssignment),
  getAssignment = () => jsonResponse(fixtures.pendingAssignment),
  getInstitutions = () => jsonResponse(fixtures.institutions),
}: AssignmentMockOptions = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const body = request.method === "POST" ? await request.clone().json() : null;
    const capturedRequest: CapturedAssignmentRequest = {
      method: request.method,
      pathname: url.pathname,
      headers: request.headers,
      body,
    };
    captured.push(capturedRequest);

    if (url.pathname === "/api/v1/tvd/admin/institutions") {
      return getInstitutions();
    }
    if (url.pathname === "/api/v1/tvd/admin/institutions/tenant-1/wallets") {
      return jsonResponse(fixtures.wallets);
    }
    if (url.pathname === "/api/v1/tvd/manual-assignments" && request.method === "POST") {
      return createAssignment(capturedRequest);
    }
    if (url.pathname === "/api/v1/tvd/manual-assignments/accreditation-1") {
      return getAssignment();
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("crypto", {
    randomUUID: () => "mx06-assignment-idempotency-key",
    getRandomValues: (bytes: Uint8Array) => bytes,
  });

  return { captured, fetchMock, fixtures };
}

export function renderAssignmentPage() {
  return renderWithAuthStore(<TvdManualAssignmentPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    availableContexts: [{ type: "GLOBAL_ADMIN", role: "SUPERADMIN" }],
    activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });
}

export function resetAssignmentMocks() {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
