import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginRequest, clearError } from '../../store/slices/authSlice';
import './login.css';
import logo from '../../assets/images/watchtower.png';
import shield from '../../assets/images/shield.png';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, error } = useSelector(state => state.auth);
    
    const [activeScreen, setActiveScreen] = useState('signin');
    const [passVisible, setPassVisible] = useState({});
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = () => {
        dispatch(loginRequest({ email, password }));
    };
    const [crPass, setCrPass] = useState('');
    const [rsPass, setRsPass] = useState('');
    const [rsConfirm, setRsConfirm] = useState('');

    const codeInputsRef = useRef([]);

    const go = (name) => {
        setActiveScreen(name);
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (name === 'verify') {
            setTimeout(() => {
                if (codeInputsRef.current[0]) {
                    codeInputsRef.current[0].focus();
                }
            }, 80);
        }
    };

    const togglePass = (id) => {
        setPassVisible((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const scorePw = (v) => {
        let s = 0;
        if (v.length >= 8) s++;
        if (v.length >= 12) s++;
        if (/[0-9]/.test(v) && /[a-z]/i.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        return Math.min(s, 4);
    };

    const renderMeter = (value, idPrefix) => {
        const s = scorePw(value);
        const labels = ['', 'Weak', 'Fair', 'Strong', 'Excellent'];
        const colors = ['', 'var(--alert)', 'var(--beacon)', 'var(--ok)', 'var(--ok)'];

        let labelText = idPrefix === 'cr' ? 'Use 8+ characters with a number and a symbol.' : 'Strength will show as you type.';
        let labelColor = 'var(--faint)';

        if (value.length > 0) {
            labelText = labels[s] + ' password';
            labelColor = s >= 3 ? 'var(--ok)' : s === 2 ? 'var(--beacon)' : 'var(--alert)';
        }

        return (
            <>
                <div className="meter" id={`${idPrefix}-meter`}>
                    {[0, 1, 2, 3].map((i) => (
                        <span
                            key={i}
                            className="seg"
                            style={{ background: i < s ? colors[s] : 'var(--line)' }}
                        ></span>
                    ))}
                </div>
                <div className="meter-label" id={`${idPrefix}-meter-label`} style={{ color: labelColor }}>
                    {labelText}
                </div>
            </>
        );
    };

    const renderMatch = () => {
        if (!rsConfirm) return <div className="hint" id="rs-match"></div>;
        if (rsPass === rsConfirm) {
            return <div className="hint" id="rs-match" style={{ color: 'var(--ok)' }}>Passwords match.</div>;
        }
        return <div className="hint" id="rs-match" style={{ color: 'var(--alert)' }}>Passwords don't match yet.</div>;
    };

    const handleCodeInput = (e, i) => {
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
        e.target.value = val;
        if (val && i < 5 && codeInputsRef.current[i + 1]) {
            codeInputsRef.current[i + 1].focus();
        }
    };

    const handleCodeKeyDown = (e, i) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) {
            codeInputsRef.current[i - 1].focus();
        }
    };

    const handleCodePaste = (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6).split('');
        digits.forEach((d, j) => {
            if (codeInputsRef.current[j]) {
                codeInputsRef.current[j].value = d;
            }
        });
        const next = Math.min(digits.length, 5);
        if (codeInputsRef.current[next]) {
            codeInputsRef.current[next].focus();
        }
    };

    return (
        <div className="stage">
            {/* ============ LEFT WATCH PANEL ============ */}
            <aside className="watch">
                <div className="brand">
                    <img src={logo} alt="Watchtower Logo" style={{ width: "50%" }} />
                </div>

                <div className="beacon-field">
                    <div className="rings">
                        <span className="ring r1"></span>
                        <span className="ring r2"></span>
                        <span className="ring r3"></span>
                    </div>
                    <div className="beacon-halo"></div>
                    <img className="tower" src={shield} alt="Watchtower Shield" style={{ width: "18%", height: 'auto', top: 7, right: 2, position: 'relative', zIndex: 2 }} />
                </div>

                <div className="panel-foot">
                    <p className="tagline">Everything you guard, watched from one post.</p>
                    <div className="status">
                        <span className="dot-live"></span>
                        <span><b>Perimeter secure</b> · 1,204 signals · 04:12 UTC</span>
                    </div>
                </div>
            </aside>

            {/* ============ RIGHT CONSOLE ============ */}
            <main className="console">
                <div className="mobile-brand">
                    <img src="../src/assets/images/watchtower.png" alt="Watchtower Logo" style={{ height: '32px' }} />
                </div>

                <div className="card">

                    {/* 1 · SIGN IN */}
                    <section className={`screen ${activeScreen === 'signin' ? 'active' : ''}`} data-screen="signin">
                        <div className="eyebrow">Secure access</div>
                        <h1>Return to your watch</h1>
                        <p className="sub">Sign in to reach the console and pick up where the last shift left off.</p>

                        {error && <div style={{ color: 'var(--alert)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
                        
                        <div className="field">
                            <div className="row"><label htmlFor="si-email">Email</label></div>
                            <div className="input-wrap">
                                <input className="f" id="si-email" type="email" placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }} />
                            </div>
                        </div>

                        <div className="field">
                            <div className="row">
                                <label htmlFor="si-pass">Password</label>
                                <button className="link" onClick={() => go('forgot')}>Forgot?</button>
                            </div>
                            <div className="input-wrap has-eye">
                                <input className="f" id="si-pass" type={passVisible['si-pass'] ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }} />
                                <button className="eye" onClick={() => togglePass('si-pass')} aria-label={passVisible['si-pass'] ? 'Hide password' : 'Show password'} style={{ color: !passVisible['si-pass'] ? '' : 'var(--beacon)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </button>
                            </div>
                        </div>

                        <label className="check" style={{ marginTop: '4px' }}>
                            <input type="checkbox" />
                            <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l5 5L20 6" /></svg></span>
                            <span>Trust this device for 30 days</span>
                        </label>

                        <button className="btn btn-primary mt" onClick={handleLogin}>Sign in</button>

                    </section>

                    {/* 2 · CREATE ACCOUNT */}
                    <section className={`screen ${activeScreen === 'create' ? 'active' : ''}`} data-screen="create">
                        <div className="eyebrow">Join the watch</div>
                        <h1>Create your account</h1>
                        <p className="sub">Set up your credentials to start monitoring. You'll confirm your email in the next step.</p>

                        <div className="field">
                            <div className="row"><label htmlFor="cr-name">Full name</label></div>
                            <div className="input-wrap"><input className="f" id="cr-name" type="text" placeholder="Dana Reyes" autoComplete="name" /></div>
                        </div>

                        <div className="field">
                            <div className="row"><label htmlFor="cr-email">Work email</label></div>
                            <div className="input-wrap"><input className="f" id="cr-email" type="email" placeholder="you@company.com" autoComplete="email" /></div>
                        </div>

                        <div className="field">
                            <div className="row"><label htmlFor="cr-pass">Password</label></div>
                            <div className="input-wrap has-eye">
                                <input className="f" id="cr-pass" type={passVisible['cr-pass'] ? 'text' : 'password'} placeholder="Create a password" autoComplete="new-password" value={crPass} onChange={(e) => setCrPass(e.target.value)} />
                                <button className="eye" onClick={() => togglePass('cr-pass')} aria-label={passVisible['cr-pass'] ? 'Hide password' : 'Show password'} style={{ color: !passVisible['cr-pass'] ? '' : 'var(--beacon)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </button>
                            </div>
                            {renderMeter(crPass, 'cr')}
                        </div>

                        <label className="check" style={{ marginTop: '6px' }}>
                            <input type="checkbox" />
                            <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l5 5L20 6" /></svg></span>
                            <span>I agree to the <button type="button" className="link" onClick={(e) => e.preventDefault()}>Terms</button> and <button type="button" className="link" onClick={(e) => e.preventDefault()}>Security Policy</button></span>
                        </label>

                        <button className="btn btn-primary mt" onClick={() => go('verify')}>Create account</button>
                        <p className="foot-note">Already have access? <button className="link" onClick={() => go('signin')}>Sign in</button></p>
                    </section>

                    {/* 3 · FORGOT PASSWORD */}
                    <section className={`screen ${activeScreen === 'forgot' ? 'active' : ''}`} data-screen="forgot">
                        <button className="back" onClick={() => go('signin')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg> Back to sign in</button>
                        <div className="eyebrow">Recovery</div>
                        <h1>Reset your password</h1>
                        <p className="sub">Enter the email on your account and we'll send a 6-digit recovery code to verify it's you.</p>

                        <div className="field">
                            <div className="row"><label htmlFor="fg-email">Email</label></div>
                            <div className="input-wrap"><input className="f" id="fg-email" type="email" placeholder="you@company.com" autoComplete="email" /></div>
                        </div>

                        <button className="btn btn-primary mt" onClick={() => go('verify')}>Send recovery code</button>
                        <p className="foot-note">Remembered it? <button className="link" onClick={() => go('signin')}>Sign in instead</button></p>
                    </section>

                    {/* 4 · VERIFY (2FA) */}
                    <section className={`screen ${activeScreen === 'verify' ? 'active' : ''}`} data-screen="verify">
                        <button className="back" onClick={() => go('signin')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg> Back</button>
                        <div className="eyebrow">Verify identity</div>
                        <h1>Enter your code</h1>
                        <p className="sub">We sent a 6-digit code to your device. It expires in 10 minutes.</p>

                        <div className="code" id="code">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <input
                                    key={i}
                                    inputMode="numeric"
                                    maxLength="1"
                                    aria-label={`Digit ${i + 1}`}
                                    ref={(el) => (codeInputsRef.current[i] = el)}
                                    onInput={(e) => handleCodeInput(e, i)}
                                    onKeyDown={(e) => handleCodeKeyDown(e, i)}
                                    onPaste={handleCodePaste}
                                />
                            ))}
                        </div>
                        <p className="resend">Didn't get it? <button className="link" onClick={(e) => e.preventDefault()}>Resend in 0:28</button></p>

                        <button className="btn btn-primary mt" onClick={() => go('reset')}>Verify</button>
                    </section>

                    {/* 5 · RESET PASSWORD */}
                    <section className={`screen ${activeScreen === 'reset' ? 'active' : ''}`} data-screen="reset">
                        <div className="eyebrow">Recovery</div>
                        <h1>Set a new password</h1>
                        <p className="sub">Choose a strong password you haven't used here before. This ends all other active sessions.</p>

                        <div className="field">
                            <div className="row"><label htmlFor="rs-pass">New password</label></div>
                            <div className="input-wrap has-eye">
                                <input className="f" id="rs-pass" type={passVisible['rs-pass'] ? 'text' : 'password'} placeholder="New password" autoComplete="new-password" value={rsPass} onChange={(e) => setRsPass(e.target.value)} />
                                <button className="eye" onClick={() => togglePass('rs-pass')} aria-label={passVisible['rs-pass'] ? 'Hide password' : 'Show password'} style={{ color: !passVisible['rs-pass'] ? '' : 'var(--beacon)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </button>
                            </div>
                            {renderMeter(rsPass, 'rs')}
                        </div>

                        <div className="field">
                            <div className="row"><label htmlFor="rs-confirm">Confirm password</label></div>
                            <div className="input-wrap"><input className="f" id="rs-confirm" type="password" placeholder="Re-enter password" autoComplete="new-password" value={rsConfirm} onChange={(e) => setRsConfirm(e.target.value)} /></div>
                            {renderMatch()}
                        </div>

                        <button className="btn btn-primary mt" onClick={() => go('done')}>Update password</button>
                    </section>

                    {/* 6 · CONFIRMATION */}
                    <section className={`screen ${activeScreen === 'done' ? 'active' : ''}`} data-screen="done">
                        <div className="done-wrap">
                            <div className="seal">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 12l5 5L20 6" /></svg>
                            </div>
                            <h1>You're back on watch</h1>
                            <p className="sub" style={{ marginInline: 'auto' }}>Your password is updated and every other session has been signed out.</p>
                            <div className="receipt">
                                <span><b>Session</b> · restored</span>
                                <span>04:12 UTC</span>
                            </div>
                            <button className="btn btn-primary mt" onClick={() => go('signin')}>Go to console</button>
                        </div>
                    </section>

                </div>
            </main>


        </div>
    );
}
