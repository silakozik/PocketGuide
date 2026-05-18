import type { UserDTO } from "./index";

export interface RegisterRequestDTO {
  email: string;
  password: string;
  userName: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  user: UserDTO;
  /** Mobil istemci için; web httpOnly cookie kullanır */
  accessToken?: string;
}

export interface AuthMeResponseDTO {
  user: UserDTO;
}
