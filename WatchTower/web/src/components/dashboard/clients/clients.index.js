import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectClient, clearSelectedClient } from '../../../store/slices/clientSlice';
import { addClientToHierarchy, updateClientInHierarchy } from '../../../store/slices/deploymentSlice';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePermissions } from '../../../hooks/usePermissions';
import './clients.css';
import '../overview/overview.css'; // Reusing overview layout classes for dashboard tab

export default function Clients() {
    const dispatch = useDispatch();
    const clients = useSelector(state => state.deployment.hierarchy['T-001'] || []);
    const selectedClient = useSelector(state => state.clients.selectedClient);
    const { hasRole, hasPermission, hasScopeAccess } = usePermissions();

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelMode, setPanelMode] = useState('create'); // 'create', 'view', 'edit', 'settings'
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'settings'
    const [subClientFilter, setSubClientFilter] = useState('All');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', contractType: 'Per Guard Per Month', guards: '', billingRate: '', slaTarget: '95', contactPerson: '',
        settings: { faceRecognition: false, gpsTracking: false, autoSlaPenalties: false }
    });

    useEffect(() => {
        if (selectedClient) {
            setFormData({
                ...selectedClient,
                settings: selectedClient.settings || { faceRecognition: false, gpsTracking: false, autoSlaPenalties: false }
            });
            setIsPanelOpen(true);
            setPanelMode('view');
            setActiveTab('dashboard');
        }
    }, [selectedClient]);

    const handleRowClick = (client) => {
        dispatch(selectClient(client));
    };

    const handleCreateNew = () => {
        dispatch(clearSelectedClient());
        setFormData({
            name: '', contractType: 'Per Guard Per Month', guards: '', billingRate: '', slaTarget: '95', contactPerson: '',
            settings: { faceRecognition: false, gpsTracking: false, autoSlaPenalties: false }
        });
        setPanelMode('create');
        setActiveTab('details');
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => dispatch(clearSelectedClient()), 300); // delay clear until transition finishes
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, [field]: value }
        }));
    };

    const handleSave = () => {
        if (panelMode === 'create') {
            const newClient = {
                ...formData,
                id: `CL-00${clients.length + 1}`,
                subClients: [],
                status: 'Pending'
            };
            dispatch(addClientToHierarchy({ tenantId: 'T-001', client: newClient }));
        } else {
            dispatch(updateClientInHierarchy({ tenantId: 'T-001', client: formData }));
        }
        handleClosePanel();
    };

    return (
        <main className="clients-main">
            <header className="clients-header">
                <div className="clients-title">
                    <h1>Clients</h1>
                    <p>Manage organizations and contracts</p>
                </div>
                <div className="clients-actions">
                    {hasPermission('client:write') && (
                        <button className="btn-primary" onClick={handleCreateNew}>
                            Add New Client
                        </button>
                    )}
                </div>
            </header>

            <div className="list-card">
                <table className="list-table">
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Sites</th>
                            <th>Total Guards</th>
                            <th>Contract Type</th>
                            <th>SLA Target</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.filter(client => hasScopeAccess('CLIENT', [client.id])).map(client => (
                            <tr key={client.id} onClick={() => handleRowClick(client)}>
                                <td>
                                    <div className="client-name">
                                        {client.name}
                                        <span className="sub">{client.id}</span>
                                    </div>
                                </td>
                                <td className="td-num">{client.subClients?.length || 0}</td>
                                <td className="td-num">{client.guards}</td>
                                <td><span className="td-badge">{client.contractType}</span></td>
                                <td className="td-num">{client.slaTarget}</td>
                                <td>
                                    <span className="td-status">
                                        <span className={`status-dot ${client.status === 'Active' ? 'st-active' : 'st-pending'}`}></span>
                                        {client.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Side Panel Overlay */}
            <div className={`overlay ${isPanelOpen ? 'open' : ''}`} onClick={handleClosePanel}></div>

            {/* Side Panel */}
            <aside className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
                <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '20px 32px 0 32px' }}>
                    <div className="header-content">
                        <div>
                            {formData.parentId && (
                                <div style={{ fontSize: 12, color: 'var(--beacon)', cursor: 'pointer', marginBottom: 4, display: 'inline-block' }} onClick={() => {
                                    const parent = clients.find(c => c.id === formData.parentId);
                                    if (parent) dispatch(selectClient(parent));
                                }}>
                                    ← Back to Parent
                                </div>
                            )}
                            <h2>{panelMode === 'create' ? 'Create New Client' : formData.name}</h2>
                            <p>{panelMode === 'create' ? 'Fill out client details' : formData.id}</p>
                        </div>
                        <button className="close-btn" onClick={handleClosePanel}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    {panelMode !== 'create' && (
                        <div className="panel-tabs" style={{ width: '100%', marginTop: '24px', marginBottom: 0 }}>
                            <button 
                                className={`panel-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                Dashboard
                            </button>
                            {!formData.parentId && (
                                <button 
                                    className={`panel-tab ${activeTab === 'subclients' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('subclients')}
                                >
                                    Sub Clients
                                </button>
                            )}
                            <button 
                                className={`panel-tab ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                Basic Details
                            </button>
                            <button 
                                className={`panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                Settings
                            </button>
                        </div>
                    )}
                </div>

                <div className="panel-body">
                    <div>
                        {activeTab === 'dashboard' && formData.dashboard && (
                            <>
                                <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                                    <div className="kpi-card">
                                        <div className="kpi-label">Monthly Recurring Revenue</div>
                                        <div className="kpi-value-row">
                                            <div className="kpi-value">{formData.dashboard.kpis.mrr.value}</div>
                                            <div className="tag-pill">{formData.dashboard.kpis.mrr.trend}</div>
                                        </div>
                                        <div className="kpi-sub">Total MRR for this client</div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-label">Active Guards</div>
                                        <div className="kpi-value-row">
                                            <div className="kpi-value">{formData.dashboard.kpis.activeGuards.value}</div>
                                            <div className="tag-pill">{formData.dashboard.kpis.activeGuards.trend}</div>
                                        </div>
                                        <div className="kpi-sub">Currently deployed</div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-label">SLA Compliance</div>
                                        <div className="kpi-value-row">
                                            <div className="kpi-value">{formData.dashboard.kpis.slaCompliance.value}</div>
                                            <div className="tag-pill">{formData.dashboard.kpis.slaCompliance.trend}</div>
                                        </div>
                                        <div className="kpi-sub">Last 30 days</div>
                                    </div>
                                    <div className="kpi-card highlight">
                                        <div className="kpi-label">Open Incidents</div>
                                        <div className="kpi-value-row">
                                            <div className="kpi-value">{formData.dashboard.kpis.openIncidents.value}</div>
                                            <div className="tag-pill">{formData.dashboard.kpis.openIncidents.trend}</div>
                                        </div>
                                        <div className="kpi-sub">Requires attention</div>
                                    </div>
                                </div>
                                <div className="charts-row">
                                    <div className="chart-card">
                                        <div className="chart-head">
                                            <div>
                                                <div className="chart-title">Revenue YTD</div>
                                                <div className="chart-sub">last 12 months</div>
                                            </div>
                                            <div className="chart-val">{formData.dashboard.charts.revenueYTD} <span>YTD</span></div>
                                        </div>
                                        <div style={{ width: '100%', height: 200 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={formData.dashboard.charts.months.map((m, i) => ({ name: m, value: formData.dashboard.charts.revenueMonthly[i] }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 11}} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px' }}
                                                        itemStyle={{ color: 'var(--beacon)' }}
                                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                                    />
                                                    <Bar dataKey="value" fill="var(--beacon)" radius={[4, 4, 0, 0]} barSize={24} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="chart-card">
                                        <div className="chart-head">
                                            <div>
                                                <div className="chart-title">Recent Activity</div>
                                                <div className="chart-sub">last 7 days</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F44336', marginTop: 6 }}></div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>Guard No-Show at Site A</div>
                                                    <div style={{ fontSize: 11, color: 'var(--faint)' }}>2 hours ago</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', marginTop: 6 }}></div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>SLA restored to 98%</div>
                                                    <div style={{ fontSize: 11, color: 'var(--faint)' }}>1 day ago</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--beacon)', marginTop: 6 }}></div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>Monthly invoice generated</div>
                                                    <div style={{ fontSize: 11, color: 'var(--faint)' }}>3 days ago</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'subclients' && (
                            <div>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '0 4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}>
                                        <input type="radio" name="scFilter" value="All" checked={subClientFilter === 'All'} onChange={e => setSubClientFilter(e.target.value)} /> All
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}>
                                        <input type="radio" name="scFilter" value="Active" checked={subClientFilter === 'Active'} onChange={e => setSubClientFilter(e.target.value)} /> Active
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}>
                                        <input type="radio" name="scFilter" value="Deactive" checked={subClientFilter === 'Deactive'} onChange={e => setSubClientFilter(e.target.value)} /> Deactive
                                    </label>
                                </div>
                                {formData.subClients && formData.subClients.filter(sc => subClientFilter === 'All' || sc.status === subClientFilter).length > 0 ? (
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Branch Name</th>
                                                <th style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Sites</th>
                                                <th style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Active Guards</th>
                                                <th style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Status</th>
                                                <th style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.subClients.filter(sc => subClientFilter === 'All' || sc.status === subClientFilter).map(sc => (
                                                <tr key={sc.id} onClick={() => dispatch(selectClient(sc))} style={{ cursor: 'pointer' }}>
                                                    <td style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', fontWeight: 500, color: 'var(--text)' }}>{sc.name}</td>
                                                    <td style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{sc.sites}</td>
                                                    <td style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{sc.guards}</td>
                                                    <td style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                                                        <span className={`status-dot ${sc.status === 'Active' ? 'st-active' : 'st-past'}`}></span> 
                                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{sc.status}</span>
                                                    </td>
                                                    <td style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: 13 }}>{sc.contactPerson}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--faint)' }}>
                                        No sub-clients match this filter.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Organization Name</label>
                                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="form-group">
                                    <label>Contract Type</label>
                                    <select value={formData.contractType} onChange={e => handleChange('contractType', e.target.value)}>
                                        <option>Per Guard Per Month</option>
                                        <option>Per Guard Per Day</option>
                                        <option>Per Shift</option>
                                        <option>Attendance-Based</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Target Guard Headcount</label>
                                    <input type="number" value={formData.guards} onChange={e => handleChange('guards', e.target.value)} placeholder="Total required guards" />
                                </div>
                                <div className="form-group">
                                    <label>Base Billing Rate (INR)</label>
                                    <input type="number" value={formData.billingRate} onChange={e => handleChange('billingRate', e.target.value)} placeholder="Rate per unit" />
                                </div>
                                <div className="form-group">
                                    <label>SLA Threshold (%)</label>
                                    <input type="text" value={formData.slaTarget} onChange={e => handleChange('slaTarget', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input type="text" value={formData.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} placeholder="Client representative name" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span>Face Recognition Attendance</span>
                                        <small>Require guards to verify identity via face scan at check-in.</small>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={formData.settings.faceRecognition} onChange={e => handleSettingChange('faceRecognition', e.target.checked)} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span>GPS Geofencing</span>
                                        <small>Validate guard location is within site boundaries.</small>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={formData.settings.gpsTracking} onChange={e => handleSettingChange('gpsTracking', e.target.checked)} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span>Auto SLA Penalties</span>
                                        <small>Automatically calculate deductions on monthly invoice for SLA breaches.</small>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={formData.settings.autoSlaPenalties} onChange={e => handleSettingChange('autoSlaPenalties', e.target.checked)} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                {hasRole(['ULTRA_SUPER_ADMIN']) && (
                                    <>
                                        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '32px 0' }} />
                                        <h3 style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '16px' }}>Client Portal Access (Superadmin Only)</h3>
                                        
                                        <div className="setting-row">
                                            <div className="setting-info">
                                                <span>Enable AI Insights</span>
                                                <small>Allow client users to see AI-generated insights on their dashboard.</small>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={formData.settings.allowAiInsights} onChange={e => handleSettingChange('allowAiInsights', e.target.checked)} />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                        <div className="setting-row">
                                            <div className="setting-info">
                                                <span>Enable Invoice Approval</span>
                                                <small>Allow client users to view and approve invoices.</small>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={formData.settings.allowInvoiceApproval} onChange={e => handleSettingChange('allowInvoiceApproval', e.target.checked)} />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {(panelMode === 'create' || activeTab !== 'dashboard') && (
                    <div className="panel-footer">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn-secondary" onClick={handleClosePanel}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave}>
                                {panelMode === 'create' ? 'Create Client' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </main>
    );
}
