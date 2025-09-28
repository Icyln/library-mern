import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Route, Routes } from 'react-router'
import Homepage from './pages/Homepage';
import Addbook from './pages/Addbook';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Searchpage from './pages/Searchpage';
import Footer from './components/Footer';
import {Toaster} from 'react-hot-toast'
import { useAuthStore } from './store/authStore';
import RedirectAuthenticatedUsers from './providers/RedirectAuthenticatedUsers';
import RedirectUnAuthenticatedUsers from './providers/RedirectUnAuthenticatedUsers';
import Bookpage from './pages/Bookpage';
import Updatepage from './pages/Updatepage';


const App = () => {
  const {fetchUser, fetchingUser} = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if(fetchingUser){
    return <p>Loading...</p>
  }

  return (
    <>
    <Toaster/>
    <Navbar/>

    <Routes>
      <Route path={"/"} element={<Homepage/>}/>
      <Route path={"/add-book"} element={<RedirectUnAuthenticatedUsers>
        <Addbook/>
      </RedirectUnAuthenticatedUsers>}/>
      <Route path={"/log-in"} element={<RedirectAuthenticatedUsers>
        <LoginPage/></RedirectAuthenticatedUsers>}/>
      <Route path={"/signup"} element={<RedirectAuthenticatedUsers>
        <SignupPage/>
      </RedirectAuthenticatedUsers>}/>
      <Route path="/search" element={<Searchpage/>}/>
      <Route path="/book/:id" element={<Bookpage/>}/>
      <Route path="book/:id/update" element={<Updatepage/>}/>
    </Routes>

    
    <Footer/>


    </>
  )
}

export default App