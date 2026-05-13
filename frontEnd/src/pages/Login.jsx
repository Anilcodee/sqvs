import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataContext } from "../context/UserContext.jsx";
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Building2,
  Search,
  Crown,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const Login = () => {
  const { setUserData, serverUrl } = useContext(dataContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields (student)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Register fields (verifier)
  const [verOrgName, setVerOrgName] = useState("");
  const [verContactPerson, setVerContactPerson] = useState("");
  const [verEmail, setVerEmail] = useState("");
  const [verPhone, setVerPhone] = useState("");
  const [verCountry, setVerCountry] = useState("India");
  const [verType, setVerType] = useState("Employer");
  const [verPassword, setVerPassword] = useState("");
  const [verConfirmPassword, setVerConfirmPassword] = useState("");

  // Register fields (institution)
  const [instStep, setInstStep] = useState(1);
  const [instName, setInstName] = useState("");
  const [instType, setInstType] = useState("University");
  const [instLicense, setInstLicense] = useState("");
  const [instLocation, setInstLocation] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instAdminName, setInstAdminName] = useState("");
  const [instAdminEmail, setInstAdminEmail] = useState("");
  const [instAdminPhone, setInstAdminPhone] = useState("");
  const [instPassword, setInstPassword] = useState("");
  const [instConfirmPassword, setInstConfirmPassword] = useState("");

  const roles = [
    {
      value: "student",
      label: "Student",
      icon: <GraduationCap size={16} />,
      color: "from-blue-500 to-indigo-500",
    },
    {
      value: "verifier",
      label: "Verifier",
      icon: <Search size={16} />,
      color: "from-amber-500 to-orange-500",
    },
    {
      value: "staff",
      label: "Staff",
      icon: <Building2 size={16} />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      value: "institution",
      label: "Institution",
      icon: <Building2 size={16} />,
      color: "from-indigo-600 to-violet-600",
    },
    {
      value: "admin",
      label: "Admin",
      icon: <Crown size={16} />,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const activeRole = roles.find((r) => r.value === role);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        serverUrl + "/api/auth/login",
        { email, password, role },
        { withCredentials: true }
      );
      setUserData(data.user);
      localStorage.setItem("sqvs_user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      if (role === "student") navigate("/student/dashboard");
      else if (role === "staff") navigate("/staff/dashboard");
      else if (role === "verifier") navigate("/verifier/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === "student") {
        if (regPassword !== regConfirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data } = await axios.post(
          serverUrl + "/api/auth/register",
          {
            role: "student",
            name: regName,
            email: regEmail,
            phone: regPhone,
            aadhaar: regAadhaar,
            dob: regDob,
            address: regAddress,
            password: regPassword,
          },
          { withCredentials: true }
        );
        setUserData(data.user);
        localStorage.setItem("sqvs_user", JSON.stringify(data.user));
        toast.success("Registration successful!");
        navigate("/student/dashboard");
      } else if (role === "verifier") {
        if (verPassword !== verConfirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data } = await axios.post(
          serverUrl + "/api/auth/register",
          {
            role: "verifier",
            orgName: verOrgName,
            contactPerson: verContactPerson,
            email: verEmail,
            phone: verPhone,
            country: verCountry,
            verifierType: verType,
            password: verPassword,
          },
          { withCredentials: true }
        );
        setUserData(data.user);
        localStorage.setItem("sqvs_user", JSON.stringify(data.user));
        toast.success(data.message || "Registration successful! (Pending approval)");
        setTab("login");
      } else if (role === "institution") {
        if (instPassword !== instConfirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data } = await axios.post(
          serverUrl + "/api/auth/register",
          {
            role: "institution",
            instName,
            instType,
            license: instLicense,
            location: instLocation,
            contactEmail: instEmail,
            contactPhone: instPhone,
            adminName: instAdminName,
            adminEmail: instAdminEmail,
            adminPhone: instAdminPhone,
            adminPassword: instPassword,
          },
          { withCredentials: true }
        );
        toast.success(data.message || "Registration successful! Institution pending approval.");
        setTab("login");
        setInstStep(1);
      } else {
        toast.error("Only student and verifier registration is available");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-1 w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm";

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-gray-50 to-blue-50/40">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">

          {/* Header */}
          <div
            className={`py-8 px-6 text-center bg-gradient-to-r ${
              activeRole?.color || "from-blue-600 to-indigo-600"
            }`}
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              SQVS Portal Access
            </h1>
            <p className="text-sm text-white/80 mt-1">
              {tab === "login" ? "Secure login to your account" : "Create a new account"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${
                tab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LogIn size={15} /> Login
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${
                tab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <UserPlus size={15} /> Register
            </button>
          </div>

          {/* Body */}
          <div className="p-6">

            {/* Role selector */}
            <div className="mb-6 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Select User Role
              </p>
              <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3">
                {(tab === "register" ? roles.filter(r => r.value === "student" || r.value === "verifier" || r.value === "institution") : roles.filter(r => r.value !== "institution")).map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-[10px] sm:text-xs font-semibold transition ${
                      role === r.value
                        ? `bg-gradient-to-br ${r.color} text-white shadow-md scale-105`
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LOGIN FORM */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="Enter your email" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={loading}
                  className={`h-12 mt-2 rounded-xl font-bold text-white bg-gradient-to-r ${activeRole?.color || "from-blue-600 to-indigo-600"} hover:shadow-lg transition disabled:opacity-50 cursor-pointer`}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            )}

            {/* REGISTER FORM — Student */}
            {tab === "register" && role === "student" && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required className={inputClass} placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className={inputClass} placeholder="Enter your email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Phone <span className="text-red-500">*</span></label>
                    <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className={inputClass} placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Aadhaar Number <span className="text-red-500">*</span></label>
                  <input type="text" value={regAadhaar} onChange={(e) => setRegAadhaar(e.target.value)} required className={inputClass} placeholder="12-digit Aadhaar number" maxLength={12} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Address</label>
                  <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className={inputClass} placeholder="Your address (optional)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Password <span className="text-red-500">*</span></label>
                    <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className={inputClass} placeholder="Password" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Confirm <span className="text-red-500">*</span></label>
                    <input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className={inputClass} placeholder="Confirm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className={`h-12 mt-2 rounded-xl font-bold text-white bg-gradient-to-r ${activeRole?.color || "from-blue-600 to-indigo-600"} hover:shadow-lg transition disabled:opacity-50 cursor-pointer`}>
                  {loading ? "Registering..." : "Register as Student"}
                </button>
              </form>
            )}

            {/* REGISTER FORM — Verifier */}
            {tab === "register" && role === "verifier" && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Organization Name <span className="text-red-500">*</span></label>
                  <input type="text" value={verOrgName} onChange={(e) => setVerOrgName(e.target.value)} required className={inputClass} placeholder="e.g., TCS" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Contact Person <span className="text-red-500">*</span></label>
                  <input type="text" value={verContactPerson} onChange={(e) => setVerContactPerson(e.target.value)} required className={inputClass} placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={verEmail} onChange={(e) => setVerEmail(e.target.value)} required className={inputClass} placeholder="Email" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Phone</label>
                    <input type="tel" value={verPhone} onChange={(e) => setVerPhone(e.target.value)} className={inputClass} placeholder="Phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Country</label>
                    <input type="text" value={verCountry} onChange={(e) => setVerCountry(e.target.value)} className={inputClass} placeholder="Country" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Verifier Type</label>
                    <select value={verType} onChange={(e) => setVerType(e.target.value)} className={inputClass}>
                      <option>Employer</option>
                      <option>University</option>
                      <option>Government</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Password <span className="text-red-500">*</span></label>
                    <input type="password" value={verPassword} onChange={(e) => setVerPassword(e.target.value)} required className={inputClass} placeholder="Password" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Confirm <span className="text-red-500">*</span></label>
                    <input type="password" value={verConfirmPassword} onChange={(e) => setVerConfirmPassword(e.target.value)} required className={inputClass} placeholder="Confirm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className={`h-12 mt-2 rounded-xl font-bold text-white bg-gradient-to-r ${activeRole?.color || "from-blue-600 to-indigo-600"} hover:shadow-lg transition disabled:opacity-50 cursor-pointer`}>
                  {loading ? "Registering..." : "Register as Verifier"}
                </button>
              </form>
            )}

            {/* REGISTER FORM — Institution (Multi-step) */}
            {tab === "register" && role === "institution" && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="flex gap-2 mb-2">
                  <div className={`flex-1 h-1.5 rounded-full ${instStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 h-1.5 rounded-full ${instStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                </div>

                {instStep === 1 ? (
                  <>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Step 1: Institution Details</p>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Institution Name <span className="text-red-500">*</span></label>
                      <input type="text" value={instName} onChange={(e) => setInstName(e.target.value)} required className={inputClass} placeholder="e.g., National Institute of Technology" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Type <span className="text-red-500">*</span></label>
                        <select value={instType} onChange={(e) => setInstType(e.target.value)} className={inputClass}>
                          <option>University</option>
                          <option>College</option>
                          <option>School</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">License / Reg No <span className="text-red-500">*</span></label>
                        <input type="text" value={instLicense} onChange={(e) => setInstLicense(e.target.value)} required className={inputClass} placeholder="License ID" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Contact Email <span className="text-red-500">*</span></label>
                        <input type="email" value={instEmail} onChange={(e) => setInstEmail(e.target.value)} required className={inputClass} placeholder="Official email" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Contact Phone <span className="text-red-500">*</span></label>
                        <input type="tel" value={instPhone} onChange={(e) => setInstPhone(e.target.value)} required className={inputClass} placeholder="Phone number" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Location</label>
                      <input type="text" value={instLocation} onChange={(e) => setInstLocation(e.target.value)} className={inputClass} placeholder="City, State" />
                    </div>
                    <button type="button" onClick={() => setInstStep(2)} className="h-11 mt-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer">
                      Next: Admin Account
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Step 2: Administrator Profile</p>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Admin Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={instAdminName} onChange={(e) => setInstAdminName(e.target.value)} required className={inputClass} placeholder="Administrator name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-1">
                        <label className="text-sm text-gray-600 font-medium">Admin Work Email <span className="text-red-500">*</span></label>
                        <input type="email" value={instAdminEmail} onChange={(e) => setInstAdminEmail(e.target.value)} required className={inputClass} placeholder="admin@institution.edu" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-sm text-gray-600 font-medium">Admin Phone <span className="text-red-500">*</span></label>
                        <input type="tel" value={instAdminPhone} onChange={(e) => setInstAdminPhone(e.target.value)} required className={inputClass} placeholder="Admin phone" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Password <span className="text-red-500">*</span></label>
                        <input type="password" value={instPassword} onChange={(e) => setInstPassword(e.target.value)} required className={inputClass} placeholder="Password" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Confirm <span className="text-red-500">*</span></label>
                        <input type="password" value={instConfirmPassword} onChange={(e) => setInstConfirmPassword(e.target.value)} required className={inputClass} placeholder="Confirm" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => setInstStep(1)} className="flex-1 h-11 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer">
                        {loading ? "Creating..." : "Complete Registration"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Register — admin not allowed */}
            {tab === "register" && (role === "admin") && (
              <div className="text-center py-6 text-gray-500 text-sm">
                <p>Admin accounts can only be created by the system administrator.</p>
                <p className="mt-2">Please contact your ministry for access.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;