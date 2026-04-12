export type TransferType = 'all' | 'airport' | 'intercity' | 'city';
export type TransferMode = 'metro' | 'bus' | 'train' | 'ferry' | 'taxi' | 'tram';

export interface RouteStep {
  instruction: string;
  subInstruction?: string;
}

export interface TransferRoute {
  id: string;
  city: string;
  type: Exclude<TransferType, 'all'>;
  mode: TransferMode;
  name: string;
  from: string;
  to: string;
  duration: number; // in minutes
  fee: string;
  frequency: string;
  hours: string;
  steps: RouteStep[];
  isNight?: boolean;
}

export interface TransportCard {
  city: string;
  name: string;
  whereToBuy: string;
  howToTopUp: string;
  initialCost: string;
  depositWarning?: string;
}
