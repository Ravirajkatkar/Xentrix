import React from 'react';
import { NavLink } from 'react-router-dom';
import './navigation.css';
import shield from '../../assets/images/shield.png';

export default function Navigation() {
    const navSections = [
        {
            title: 'Platform',
            items: [
                { label: 'Overview', path: '/dashboard' }
            ]
        },
        {
            title: 'Operations',
            items: [
                { label: 'Clients', path: '/dashboard/clients' },
                { label: 'Sites & Posts', path: '/dashboard/sites' },
                { label: 'Guards', path: '/dashboard/guards' },
                { label: 'Attendance', path: '/dashboard/attendance' },
                { label: 'Patrols', path: '/dashboard/patrols' },
                { label: 'Incidents', path: '/dashboard/incidents' }
            ]
        },
        {
            title: 'Finance & HR',
            items: [
                { label: 'Employees', path: '/dashboard/employees' },
                { label: 'Payroll', path: '/dashboard/payroll' },
                { label: 'Invoices', path: '/dashboard/invoices' }
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Reports', path: '/dashboard/reports' },
                { label: 'Settings', path: '/dashboard/settings' }
            ]
        }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={shield} alt="Watchtower Shield" />
                <span>WatchTower</span>
            </div>

            <div className="sidebar-scroll">
                {navSections.map((section, index) => (
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
                <div className="avatar">SA</div>
                <div className="user-info">
                    <span className="user-name">Superadmin</span>
                    <span className="user-role">Platform owner</span>
                </div>
            </div>
        </aside>
    );
}
