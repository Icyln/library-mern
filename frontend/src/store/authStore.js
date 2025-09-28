import {create} from "zustand";
import axios from "axios";

const API_URL="https://library-mern-c5wa.onrender.com/api";
axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
    //initial state
    user: null,
    isLoading: false,
    error: null,
    message: null,
    fetchingUser: true,

    //functions
    //Sign Up Function
    singup: async (username, email, password) => {
        set({ isLoading: true, message: null });

        try {
            const response = await axios.post(`${API_URL}/signup`, {
                username, 
                email, 
                password,
            });

            set({
                user: response.data.user,
                isLoading: false,
            });

        } catch (error) {
            set({isLoading: false, 
                error: error.response.data.message || "Error signing up",
            });
            throw error;

        }
    },

    //Login Function
    login: async (email, password) => {
        set({isLoading: true, message: null});

        try{
            const response = await axios.post(`${API_URL}/log-in`, {
                email,
                password,
            });

            const {user, message} = response.data;

            set({user, isLoading: false, message});

            return response.data;

        } catch (error) {set({isLoading: false, 
                error: error.response.data.message || "Error logging in",
            });
            throw error;

        }
    },

    //Fetch User Function
    fetchUser: async () => {
        set({fetchingUser: true, error: null});

        try {
            const response = await axios.get(`${API_URL}/fetch-user`);

            set({user: response.data.user, fetchingUser: false});
        } catch (error) {
            set({
                fetchingUser: false, 
                error: null,
                user: null,
            });
            throw error;
        }
    },

    //Log out Functions
    logout: async () => {
        set({isLoading: true, message: null, error: null});

        try {
            const response = await axios.post(`${API_URL}/logout`);

            const {message} = response.data;

            set({message, isLoading: false, user: null, error: null});
            return(message);
        } catch (error) {set({isLoading: false, 
                error: error.response.data.message || "Error logging out",
            });
            throw error;
        }
    }
}));