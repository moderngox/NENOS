import { getUserById } from "../../users-db";
import { buildKidProfile } from "../me-profile";
import { buildBooksList } from "../me-books";
import { requireAdmin, jsonResponse } from "./guard";

// Reuses the exact same "kid profile" + order-list builders the customer's
// own account dashboard calls (worker/routes/me-profile.ts,
// worker/routes/me-books.ts) — just keyed by an arbitrary userId instead of
// the session's own id, so an admin can see any customer's avatar and order
// history without duplicating that aggregation logic.
export async function handleGetAdminCustomerDetail(userId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const user = await getUserById(env.DB, userId);
  if (!user) return jsonResponse({ error: "Customer not found." }, 404);

  const [profile, orders] = await Promise.all([buildKidProfile(env.DB, userId), buildBooksList(env.DB, userId)]);

  return jsonResponse({
    id: user.id,
    email: user.email,
    name: user.name,
    profile,
    orders,
  });
}
