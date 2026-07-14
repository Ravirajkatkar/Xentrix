import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../navigation/navigation.index';

export default function DashboardLayout() {
    return (
        <div>
            <Navigation />
            <Outlet />
        </div>
    );
}
