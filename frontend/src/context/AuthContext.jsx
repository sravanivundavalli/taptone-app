import React, { createContext, useState, useContext, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await client.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const response = await client.post(`/auth/login?remember_me=${rememberMe}`, { 
      email, 
      password, 
      first_name: '', 
      last_name: '' 
    });
    setUser(response.data.user);
    return response.data;
  };

  const signup = async (email, password, firstName, lastName) => {
    const response = await client.post('/auth/signup', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
