export type SplashStep = 'code' | 'username' | 'pin' | 'pin-new' | 'reset-pin';

export interface User {
  username: string;
  pin: string;
}

export interface ImageItem {
  filename: string;
  url: string;
  prompt?: string;
  username: string;
  createdAt?: string;
}
