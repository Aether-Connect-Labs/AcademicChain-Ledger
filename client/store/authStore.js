
import create from 'zustand';
import { persist } from 'zustand/middleware';
import jwt_decode from 'jwt-decode';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => {
        try {
          const decoded = jwt_decode(token);
          set({ token, user: decoded, isAuthenticated: true });
        } catch (error) {
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // unique name
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useAuthStore;
