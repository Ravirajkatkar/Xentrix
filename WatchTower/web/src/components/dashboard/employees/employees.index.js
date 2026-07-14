import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectEmployee, clearSelectedEmployee } from '../../../store/slices/employeeSlice';
import './employees.css';
import '../clients/clients.css'; // Reusing some base styles for side panel

export default function Employees() {
    const dispatch = useDispatch();
    const employees = useSelector(state => state.employees.employees);
    const selectedEmployee = useSelector(state => state.employees.selectedEmployee);

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const handleRowClick = (employee) => {
        dispatch(selectEmployee(employee));
        setActiveTab('profile');
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => dispatch(clearSelectedEmployee()), 300);
    };

    return (
        <main className="employees-container fade-in">
            <header className="employees-header">
                <div>
                    <h1>Employees</h1>
                    <p>Manage personnel and attendance</p>
                </div>
            </header>

            <div className="table-container">
                <table className="list-table">
                    <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>ROLE</th>
                            <th>SITE</th>
                            <th>SHIFT</th>
                            <th>ATTENDANCE</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} onClick={() => handleRowClick(emp)}>
                                <td>
                                    <div className="client-name">{emp.name}</div>
                                    <div className="client-id">{emp.id}</div>
                                </td>
                                <td>{emp.role}</td>
                                <td>{emp.site}</td>
                                <td><span className="badge-outline">{emp.shift}</span></td>
                                <td>{emp.attendance}</td>
                                <td>
                                    <span className={`status-dot ${emp.status.toLowerCase().replace(' ', '-')}`}></span>
                                    {emp.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Side Panel */}
            <aside className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <div className="header-content">
                        <div>
                            <h2>{selectedEmployee?.name}</h2>
                            <p className="client-id">{selectedEmployee?.id} · {selectedEmployee?.role}</p>
                        </div>
                        <button className="close-btn" onClick={handleClosePanel}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 32px' }}>
                    <div>
                        <div className="panel-tabs" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                            <button 
                                className={`panel-tab ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                Profile
                            </button>
                            <button 
                                className={`panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                Settings
                            </button>
                        </div>
                    </div>
                </div>

                <div className="panel-body">
                    <div>
                        {activeTab === 'profile' && selectedEmployee && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" value={selectedEmployee.name} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <input type="text" value={selectedEmployee.role} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Assigned Site</label>
                                    <input type="text" value={selectedEmployee.site} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" value={selectedEmployee.phone} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Join Date</label>
                                    <input type="text" value={selectedEmployee.joinDate} readOnly />
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && selectedEmployee && (
                            <div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span>Biometric Access</span>
                                        <small>Allow access via fingerprint and face scan.</small>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={selectedEmployee.settings.biometricAccess} readOnly />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span>Overtime Allowed</span>
                                        <small>Employee can be scheduled for double shifts.</small>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={selectedEmployee.settings.overtimeAllowed} readOnly />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel-footer">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn-secondary" onClick={handleClosePanel}>Close</button>
                    </div>
                </div>
            </aside>
        </main>
    );
}
