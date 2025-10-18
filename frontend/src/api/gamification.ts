import { fetchApi } from "../utils/apiHandler";

// Achievement interface
export interface Achievement {
  title: string;
  description: string;
  achievedOn: string; // ISO string
}

// Gamification interface aligned with backend
export interface Gamification {
  _id?: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalTrades: number;
  achievements: Achievement[];
  level: number;
  points: number;
  createdAt?: string;
  updatedAt?: string;
}

// API wrapper
export const gamificationApi = {
  // Get gamification data for a user
  getByUser: (userId: string) =>
    fetchApi<Gamification>({
      url: `/gamification/${userId}`,
      method: "GET",
    }),

  // Update gamification data (for admin or backend sync, optional)
  update: (userId: string, data: Partial<Gamification>) =>
    fetchApi<Gamification>({
      url: `/gamification/${userId}`,
      method: "PUT",
      data,
    }),
};
