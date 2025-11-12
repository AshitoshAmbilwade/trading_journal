// src/api/strategies.ts
import { fetchApi } from "../utils/apiHandler";

/**
 * Strategy API client
 *
 * Note:
 * - Auth header is attached by apiHandler interceptor (reads token from localStorage).
 * - Errors from fetchApi will throw the backend payload (or a friendly error).
 */

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

/* ---------- CRUD ---------- */

export const getStrategies = async (includeInactive = false): Promise<Strategy[]> => {
  const params = includeInactive ? { includeInactive: "true" } : undefined;
  const data = await fetchApi<Strategy[]>({
    url: "/strategies",
    method: "GET",
    params,
  });
  return data;
};

export const getStrategy = async (id: string): Promise<Strategy> => {
  if (!id) throw new Error("Strategy id is required");
  const data = await fetchApi<Strategy>({
    url: `/strategies/${id}`,
    method: "GET",
  });
  return data;
};

export const createStrategy = async (payload: CreateStrategyPayload): Promise<Strategy> => {
  const data = await fetchApi<Strategy>({
    url: "/strategies",
    method: "POST",
    data: payload,
  });
  return data;
};

export const updateStrategy = async (id: string, payload: UpdateStrategyPayload): Promise<Strategy> => {
  if (!id) throw new Error("Strategy id is required");
  const data = await fetchApi<Strategy>({
    url: `/strategies/${id}`,
    method: "PUT",
    data: payload,
  });
  return data;
};

export const deleteStrategy = async (id: string): Promise<{ message?: string }> => {
  if (!id) throw new Error("Strategy id is required");
  const data = await fetchApi<{ message?: string }>({
    url: `/strategies/${id}`,
    method: "DELETE",
  });
  return data;
};

/* ---------- Micro section endpoints (add/remove single item) ---------- */

/**
 * Add a single item to a section (entryCriteria | sltpCriteria | managementRules)
 * section must be one of: "entryCriteria" | "sltpCriteria" | "managementRules"
 */
export const addSectionItem = async (strategyId: string, section: "entryCriteria" | "sltpCriteria" | "managementRules", item: string) => {
  if (!strategyId) throw new Error("Strategy id is required");
  if (!section) throw new Error("Section is required");
  if (!item || !item.trim()) throw new Error("Item is required");

  const data = await fetchApi<any>({
    url: `/strategies/${strategyId}/sections/${section}/add`,
    method: "POST",
    data: { item },
  });
  return data;
};

/**
 * Remove item at index from a section
 * index is number (0-based)
 */
export const removeSectionItem = async (strategyId: string, section: "entryCriteria" | "sltpCriteria" | "managementRules", index: number) => {
  if (!strategyId) throw new Error("Strategy id is required");
  if (!section) throw new Error("Section is required");
  if (typeof index !== "number" || isNaN(index) || index < 0) throw new Error("Valid index is required");

  const data = await fetchApi<any>({
    url: `/strategies/${strategyId}/sections/${section}/${index}`,
    method: "DELETE",
  });
  return data;
};

/* ---------- Export default (optional) ---------- */

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
