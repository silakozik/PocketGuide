import { SmartRouteRequest } from '../services/routing.service';

export interface RouteGenerationJobData {
  userId: string;
  cityId: string;
  isPremium: boolean;
  preferences: SmartRouteRequest;
}

export type RouteGenerationResultPayload = {
  cityId: string;
  route: unknown;
  recommendations: unknown;
};
