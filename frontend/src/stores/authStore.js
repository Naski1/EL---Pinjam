import { create } from 'zustand';
import { authAPI } from '../api';

const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login(username, password);
            const { access_token } = response.data;

            localStorage.setItem('access_token', access_token);

            // Get user info
            const userResponse = await authAPI.getMe();

            set({
                token: access_token,
                user: userResponse.data,
                isAuthenticated: true,
                isLoading: false,
            });

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.detail || 'Login gagal';
            set({ error: message, isLoading: false });
            return { success: false, error: message };
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    fetchUser: async () => {
        if (!get().token) return;

        set({ isLoading: true });
        try {
            const response = await authAPI.getMe();
            set({ user: response.data, isLoading: false });
        } catch (error) {
            // Token invalid, logout
            get().logout();
        }
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
