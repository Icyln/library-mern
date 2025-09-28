import axios from "axios"; 
import { create } from "zustand"; 

const API_URL = "http://localhost:5000/api"
axios.defaults.withCredentials = true; 

export const useBookStore = create((set) => ({
    //initial states
    book: null, 
    books: [], 
    isLoading: false, 
    error: null, 
    message: null, 

    //functions
    //Add Book Function
    addBook: async (image, title, subtitle, author, link, review) => { 
        set({isLoading: true, error: null, message: null}) 
        try { 
            const response = await axios.post(`${API_URL}/add-book`, { 
                image, 
                title, 
                subtitle, 
                author, 
                link, 
                review, 
            }); 
            const {message, book} = response.data; 
            set({book, message, isLoading: false}); 
            return {message, book}; 
        } catch (error) { 
            set({ 
                isLoading: false, 
                error: error.response.data.message || "Error adding book" 
            }); 
            throw error; 
        } 
    }, 

    fetchBooks: async () => { 
        set({isLoading: true, error: null}); 
        try { 
            const response = await axios.get(`${API_URL}/fetch-books`); 
            set({books: response.data.books, isLoading: false}); 
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response.data.message || "Error fetching book" 
            }); 
            throw error; 
        } 
    }, 

    //Search Book Function
    searchBooks: async (searchTerm) => { 
        set({isLoading: true, error: null}); 
        try { 
            const response = await axios.get(`${API_URL}/search?${searchTerm}`); 
            set({books: response.data.books, isLoading: false}) 
        } catch (error) { 
            set({ 
                isLoading: false, 
                error: error.response.data.message || "Error Fetching Books", 
            }) 
        } 
    }, 

    //Book Details Function
    fetchBook: async (id) => { 
        set({isLoading: true, error: null}); 
        try { 
            const response = await axios.get(`${API_URL}/fetch-book/${id}`); 
            set({book: response.data.book, isLoading: false}); 
        } catch (error) { 
            set({ 
                isLoading: false, 
                error: error.response.data.message || "Error Fetching Book", 
            }) 
        } 
    }, 

    //Delete Book Function
    deleteBook: async (id) => { 
        set({isLoading: true, error: null, message: null}) 
        try { 
            const response = await axios.delete(`${API_URL}/delete-book/${id}`); 
            const {message} = response.data; 
            set({message, isLoading: false}); 
            return {message} 
        } catch (error) { 
            set({ 
                isLoading: false, 
                error: error.response.data.message || "Error deleting book", 
            }); 
            throw error; 
        } 
    },
    
    //Update Book Function
    updateBook: async (id, image, title, subtitle, author, link, review) => {
        set({isLoading: true, error: null, message: null});

        try {
            const response = await axios.post(`${API_URL}/update-book/${id}`, {
                image,
                title,
                subtitle,
                author,
                link,
                review,
            });
            const {message, book} = response.data;

            set({book, message, isLoading: false});
            return {message, book}
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error Uploading Book",
            });

            throw error;
        }
    },
}));
