export interface User {
    id: number;
    email: string;
    username: string;
  }
  
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  }
  