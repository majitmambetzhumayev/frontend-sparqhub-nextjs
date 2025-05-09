// types/auth.ts

export interface AuthFormProps {
    mode: 'login' | 'register';
  };

export interface AuthFormData {
    email: string;
    password: string;
    username?: string;
  }
  