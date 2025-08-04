import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';

const fetchUser = async () => {
    try {
        const api = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
            withCredentials: true,
        });
        const { data } = await api.get('/auth/me');
        return data.data;
    } catch (error) {
        return null;
    }
};

export const withAuth = (WrappedComponent, allowedRoles = []) => {
    const Wrapper = (props) => {
        const router = useRouter();
        const { data: user, isLoading } = useQuery('user', fetchUser, {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
        });

        useEffect(() => {
            if (!isLoading && !user) {
                router.replace('/auth/login');
            } else if (!isLoading && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                router.replace('/unauthorized'); // O una página 404
            }
        }, [user, isLoading, router]);

        if (isLoading || !user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
            return <div className="flex justify-center items-center h-screen">Cargando...</div>;
        }

        return <WrappedComponent {...props} user={user} />;
    };

    return Wrapper;
};