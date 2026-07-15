import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePermissions } from '../../../hooks/usePermissions';
import './overview.css';

export default function Overview() {
    const { kpis, charts } = useSelector(state => state.overview.data);
    const clients = useSelector(state => state.deployment.hierarchy['T-001'] || []);
    const employees = useSelector(state => state.employees.employees || []);
    const { hasScopeAccess } = usePermissions();

    // ABAC Scoping
    const filteredClients = clients.filter(client => hasScopeAccess('CLIENT', [client.id]));
    const filteredEmployees = employees.filter(emp => {
        const assignedClient = clients.find(c => c.name === emp.site);
        return assignedClient ? hasScopeAccess('CLIENT', [assignedClient.id]) : true;
    });

    const totalClientsCount = filteredClients.length;
    const totalBranchesCount = filteredClients.reduce((acc, c) => acc + (c.subClients?.length || 0), 0);
    const totalEmployeesCount = filteredEmployees.length;

    return (
        <main className="dashboard-main">
            <header className="dash-header">
                <div className="dash-title">
                    <h1>Overview</h1>
                    <p>Platform-wide attendance & billing</p>
                </div>
                <div className="dash-controls">
                    <input type="text" className="dash-search" placeholder="Search clients..." />
                    <button className="dash-date">Jun 2026</button>
                </div>
            </header>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Total Clients</div>
                    <div className="kpi-value-row">
                        <div className="kpi-value">{totalClientsCount}</div>
                        <div className="tag-pill">{kpis.totalClients.trend}</div>
                    </div>
                    <div className="kpi-sub">{kpis.totalClients.subtext}</div>
                </div>
                
                <div className="kpi-card">
                    <div className="kpi-label">Active Branches</div>
                    <div className="kpi-value-row">
                        <div className="kpi-value">{totalBranchesCount}</div>
                        <div className="tag-pill">{kpis.activeBranches.trend}</div>
                    </div>
                    <div className="kpi-sub">{kpis.activeBranches.subtext}</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-label">Total Employees</div>
                    <div className="kpi-value-row">
                        <div className="kpi-value">{totalEmployeesCount.toLocaleString()}</div>
                        <div className="tag-pill">{kpis.totalEmployees.trend}</div>
                    </div>
                    <div className="kpi-sub">{kpis.totalEmployees.subtext}</div>
                </div>

                <div className="kpi-card highlight">
                    <div className="kpi-label">Monthly Revenue</div>
                    <div className="kpi-value-row">
                        <div className="kpi-value">{kpis.monthlyRevenue.value}</div>
                        <div className="tag-pill">{kpis.monthlyRevenue.trend}</div>
                    </div>
                    <div className="kpi-sub">{kpis.monthlyRevenue.subtext}</div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-head">
                        <div>
                            <div className="chart-title">Recurring revenue</div>
                            <div className="chart-sub">last 12 months</div>
                        </div>
                        <div className="chart-val">{charts.revenueYTD} <span>YTD</span></div>
                    </div>
                    
                    <div style={{ width: '100%', height: 160, marginTop: 16 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.months.map((m, i) => ({ name: m, value: charts.revenueMonthly[i] }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--beacon)' }}
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                />
                                <Bar dataKey="value" fill="var(--beacon)" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-head">
                        <div>
                            <div className="chart-title">Plan mix</div>
                            <div className="chart-sub">{charts.planMix.total} active subscriptions</div>
                        </div>
                    </div>
                    
                    <div className="donut-stage" style={{ marginTop: -16 }}>
                        <div style={{ width: 140, height: 140, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Enterprise', value: charts.planMix.enterprise, color: '#F7A742' },
                                            { name: 'Growth', value: charts.planMix.growth, color: '#9AA0A6' },
                                            { name: 'Starter', value: charts.planMix.starter, color: '#3C4043' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={65}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        <Cell fill="#F7A742" />
                                        <Cell fill="#9AA0A6" />
                                        <Cell fill="#3C4043" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                                <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text)', fontWeight: 600 }}>{charts.planMix.total}</h3>
                                <p style={{ fontSize: 9, margin: 0, opacity: 0.6 }}>clients</p>
                            </div>
                        </div>
                        <div className="donut-legend">
                            <div className="legend-item"><span className="legend-dot" style={{background: '#F7A742'}}></span> Enterprise <span className="legend-val">· {charts.planMix.enterprise}</span></div>
                            <div className="legend-item"><span className="legend-dot" style={{background: '#9AA0A6'}}></span> Growth <span className="legend-val">· {charts.planMix.growth}</span></div>
                            <div className="legend-item"><span className="legend-dot" style={{background: '#3C4043'}}></span> Starter <span className="legend-val">· {charts.planMix.starter}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-head">
                    <h2>Clients</h2>
                    <button className="view-all">View all →</button>
                </div>
                
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Branches</th>
                            <th>Employees</th>
                            <th>Plan</th>
                            <th>Avg Attendance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map(client => {
                            const initials = client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const clientEmployeesCount = employees.filter(emp => emp.site === client.name).length;
                            return (
                                <tr key={client.id}>
                                    <td>
                                        <div className="client-cell">
                                            <div className="client-avatar">{initials}</div>
                                            <span className="client-name">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="td-num">{client.subClients?.length || 0}</td>
                                    <td className="td-num">{clientEmployeesCount.toLocaleString()}</td>
                                    <td><span className="td-plan">{client.plan || 'Enterprise'}</span></td>
                                    <td className="td-bold">{client.attendance || '95%'}</td>
                                    <td className="td-status">
                                        <span className={`status-dot ${client.status === 'Active' ? 'st-active' : 'st-past'}`}></span> 
                                        {client.status}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
