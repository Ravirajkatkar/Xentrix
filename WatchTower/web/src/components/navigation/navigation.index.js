import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import './navigation.css';
import shield from '../../assets/images/shield.png';

export default function Navigation() {
    const { user, hasPermission, hasRole } = usePermissions();

    const navSections = [
        {
            title: 'Platform',
            items: [
                { label: 'Overview', path: '/dashboard' } // Everyone sees Dashboard
            ]
        },
        {
            title: 'Operations',
            items: [
                { label: 'Clients', path: '/dashboard/clients', perm: 'client:read' },
                { label: 'Sites & Posts', path: '/dashboard/sites', perm: 'site:read' },
                { label: 'Guards', path: '/dashboard/guards', perm: 'employee:read' },
                { label: 'Attendance', path: '/dashboard/attendance', perm: 'attendance:read' },
                { label: 'Patrols', path: '/dashboard/patrols', perm: 'patrol:read' },
                { label: 'Incidents', path: '/dashboard/incidents', perm: 'incident:read' }
            ]
        },
        {
            title: 'Finance & HR',
            items: [
                { label: 'Employees', path: '/dashboard/employees', perm: 'employee:read' },
                { label: 'Payroll', path: '/dashboard/payroll', role: 'ULTRA_SUPER_ADMIN' },
                { label: 'Invoices', path: '/dashboard/invoices', perm: 'invoice:read' }
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Reports', path: '/dashboard/reports' },
                { label: 'Users & Tenants', path: '/dashboard/tenants', role: 'ULTRA_SUPER_ADMIN' },
                { label: 'Settings', path: '/dashboard/settings', role: 'ULTRA_SUPER_ADMIN' }
            ]
        }
    ];

    if (!user) return null;

    // Filter sections based on permissions/roles
    const filteredSections = navSections.map(section => {
        const filteredItems = section.items.filter(item => {
            if (item.role && !hasRole([item.role])) return false;
            if (item.perm && !hasPermission(item.perm)) return false;
            return true;
        });
        return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={shield} alt="Watchtower Shield" />
                <span>WatchTower</span>
            </div>

            <div className="sidebar-scroll">
                {filteredSections.map((section, index) => (
                    <div key={index} className="nav-section">
                        <div className="nav-label">{section.title}</div>
                        <div className="nav-links">
                            {section.items.map(item => (
                                <NavLink 
                                    key={item.label} 
                                    to={item.path}
                                    end={item.path === '/dashboard'}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sidebar-foot">
                <div className="avatar">{(user?.name || 'US').substring(0, 2).toUpperCase()}</div>
                <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-role">{(user?.role || 'GUEST').replace(/_/g, ' ')}</span>
                </div>
            </div>
        </aside>
    );
}
