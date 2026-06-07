import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        organizationType: 'ngo',
        email: '',
        phone: '',
        registrationNumber: '',
        address: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        // In a real app this would send data to backend to become a partner
        alert("Registration submitted for review!");
        navigate('/');
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header">
                    <h2>Partner Registration</h2>
                    <p>Join StrayCare to help strays around your area.</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Organization Name</label>
                            <input 
                                type="text" 
                                name="organizationName" 
                                value={formData.organizationName} 
                                onChange={handleChange} 
                                placeholder="Care Foundation" 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Organization Type</label>
                            <select 
                                name="organizationType" 
                                value={formData.organizationType} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="ngo">NGO</option>
                                <option value="vet">Vet Clinic</option>
                                <option value="hospital">Hospital</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="contact@example.com" 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                placeholder="+1 234 567 890" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Registration Number</label>
                        <input 
                            type="text" 
                            name="registrationNumber" 
                            value={formData.registrationNumber} 
                            onChange={handleChange} 
                            placeholder="Government/License Registration No." 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Address</label>
                        <textarea 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="Full physical address" 
                            rows="2"
                            required 
                        ></textarea>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="Create a strong password" 
                                    required 
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    placeholder="Confirm your password" 
                                    required 
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="register-submit-btn">Register as Partner</button>
                </form>
                
                {/* <div className="register-circle circle-1">
                    <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400&h=400" alt="Stray Dog" />
                </div>
                <div className="register-circle circle-2">
                    <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400&h=400" alt="Stray Cat" />
                </div>
                <div className="register-circle circle-3">
                    <img src="https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=400&h=400" alt="Rescued Dog" />
                </div>
                <div className="register-circle circle-4">
                    <img src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=400&h=400" alt="Rescued Cat" />
                </div> */}
                
            </div>
        </div>
    );
};

export default Register;