// src/api/strategies.ts
import { fetchApi } from "../utils/apiHandler";

/* ---------- Types ---------- */

export interface Strategy {
  _id: string;
  userId: string;
  name: string;
  entryCriteria: string[];
  sltpCriteria: string[];
  managementRules: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategyPayload {
  name: string;
  entryCriteria?: string[];
  sltpCriteria?: string[];
  managementRules?: string[];
}

export interface UpdateStrategyPayload {
  name?: string;
  entryCriteria?: string[];
  sltpCriteria?: string[];
  managementRules?: string[];
  isActive?: boolean;
}

/* Generic response for add/remove operations */
export interface StrategySectionModifyResponse {
  success?: boolean;
  updated?: Strategy;
  message?: string;
  [key: string]: unknown;
}

/* ---------- CRUD ---------- */

export const getStrategies = async (includeInactive = false): Promise<Strategy[]> => {
  const params = includeInactive ? { includeInactive: "true" } : undefined;
  return await fetchApi<Strategy[]>({
    url: "/strategies",
    method: "GET",
    params,
  });
};

export const getStrategy = async (id: string): Promise<Strategy> => {
  if (!id) throw new Error("Strategy id is required");
  return await fetchApi<Strategy>({
    url: `/strategies/${id}`,
    method: "GET",
  });
};

export const createStrategy = async (payload: CreateStrategyPayload): Promise<Strategy> =>
  await fetchApi<Strategy>({
    url: "/strategies",
    method: "POST",
    data: payload,
  });

export const updateStrategy = async (
  id: string,
  payload: UpdateStrategyPayload
): Promise<Strategy> => {
  if (!id) throw new Error("Strategy id is required");

  return await fetchApi<Strategy>({
    url: `/strategies/${id}`,
    method: "PUT",
    data: payload,
  });
};

export const deleteStrategy = async (
  id: string
): Promise<{ message?: string }> => {
  if (!id) throw new Error("Strategy id is required");

  return await fetchApi<{ message?: string }>({
    url: `/strategies/${id}`,
    method: "DELETE",
  });
};

/* ---------- Micro section endpoints ---------- */

export const addSectionItem = async (
  strategyId: string,
  section: "entryCriteria" | "sltpCriteria" | "managementRules",
  item: string
): Promise<StrategySectionModifyResponse> => {
  if (!strategyId) throw new Error("Strategy id is required");
  if (!section) throw new Error("Section is required");
  if (!item || !item.trim()) throw new Error("Item is required");

  return await fetchApi<StrategySectionModifyResponse>({
    url: `/strategies/${strategyId}/sections/${section}/add`,
    method: "POST",
    data: { item },
  });
};

/**
 * Remove item at index
 */
export const removeSectionItem = async (
  strategyId: string,
  section: "entryCriteria" | "sltpCriteria" | "managementRules",
  index: number
): Promise<StrategySectionModifyResponse> => {
  if (!strategyId) throw new Error("Strategy id is required");
  if (!section) throw new Error("Section is required");
  if (typeof index !== "number" || index < 0)
    throw new Error("Valid index is required");

  return await fetchApi<StrategySectionModifyResponse>({
    url: `/strategies/${strategyId}/sections/${section}/${index}`,
    method: "DELETE",
  });
};

/* ---------- Default export ---------- */

const strategiesApi = {
  getStrategies,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  addSectionItem,
  removeSectionItem,
};

export default strategiesApi;
