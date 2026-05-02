import React, { useState, useRef, useEffect } from 'react';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [notification, setNotification] = useState('');

    const notify = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 4000);
    };

    return (
        <div className="flex min-h-screen bg-gray-900 text-white font-sans selection:bg-green-500 selection:text-white">
            <aside className="w-64 bg-gray-800 shadow-xl flex flex-col border-r border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-green-400">AMS <span className="text-white">Pro</span></h1>
                    <p className="text-xs text-gray-400 mt-1">Face Recognition System</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Dashboard" />
                    <NavItem active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon="👤" label="Enroll Student" />
                    <NavItem active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon="📸" label="Mark Attendance" />
                </nav>
            </aside>

            <main className="flex-1 p-8 relative overflow-y-auto">
                {notification && (
                    <div className="absolute top-4 right-8 bg-green-500/90 backdrop-blur border border-green-400 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-medium">
                        {notification}
                    </div>
                )}
                {activeTab === 'dashboard' && <DashboardView notify={notify} />}
                {activeTab === 'register' && <RegisterView notify={notify} />}
                {activeTab === 'attendance' && <AttendanceView notify={notify} />}
            </main>
        </div>
    );
}

function NavItem({ active, onClick, icon, label }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${active ? 'bg-green-600 shadow-lg text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
            <span className="mr-3 text-lg">{icon}</span><span className="font-medium">{label}</span>
        </button>
    );
}

// --- DASHBOARD (Now with Add Subject) ---
function DashboardView({ notify }) {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [newSubjectText, setNewSubjectText] = useState('');

    const fetchSubjects = () => {
        fetch('http://localhost:5000/api/subjects')
            .then(res => res.json())
            .then(data => setSubjects(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchSubjects(); }, []);

    const handleSubjectClick = async (subject) => {
        setSelectedSubject(subject);
        try {
            const res = await fetch(`http://localhost:5000/api/students/${subject}`);
            const data = await res.json();
            setEnrolledStudents(data);
        } catch (e) { notify("Error fetching students."); }
    };

    const handleAddSubject = async () => {
        if (!newSubjectText) return;
        try {
            const res = await fetch('http://localhost:5000/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: newSubjectText })
            });
            const data = await res.json();
            notify(data.message);
            setNewSubjectText('');
            fetchSubjects(); // Refresh list
        } catch (e) { notify("Error adding subject."); }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">System Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md col-span-1 flex flex-col">
                    <h3 className="text-gray-300 font-bold mb-4 flex items-center"><span className="mr-2">📚</span> Subjects Manager</h3>

                    {/* Add Subject Input */}
                    <div className="flex gap-2 mb-4">
                        <input type="text" value={newSubjectText} onChange={(e) => setNewSubjectText(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm text-white uppercase focus:border-green-500" placeholder="New Subject" />
                        <button onClick={handleAddSubject} className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-sm font-bold">+</button>
                    </div>

                    <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                        {subjects.map(sub => (
                            <button key={sub} onClick={() => handleSubjectClick(sub)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedSubject === sub ? 'bg-green-900/40 border-green-500 text-green-400 font-bold' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md col-span-2 min-h-[400px]">
                    {selectedSubject ? (
                        <>
                            <h3 className="text-xl font-bold text-white mb-4">Students in <span className="text-green-400">{selectedSubject}</span></h3>
                            {enrolledStudents.length === 0 ? (
                                <p className="text-gray-400">No students enrolled yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {enrolledStudents.map((student, idx) => (
                                        <div key={idx} className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex justify-between">
                                            <span className="font-medium text-gray-200">{student.Name}</span>
                                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">ID: {student.Enrollment}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <span className="text-4xl mb-3">👈</span><p>Select a subject to view enrolled students.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- ENROLL STUDENT (Now uses Dropdown for Subject) ---
function RegisterView({ notify }) {
    const [enrollment, setEnrollment] = useState('');
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [subjectsList, setSubjectsList] = useState([]);

    const [progress, setProgress] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [captureComplete, setCaptureComplete] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/subjects')
            .then(res => res.json())
            .then(data => setSubjectsList(data));
        return () => stopCamera();
    }, []);

    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true); setCaptureComplete(false);
        }).catch(err => notify("Camera access denied."));
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const handleCapture = async () => {
        if (!enrollment || !name || !subject) return notify("Please fill all fields!");
        setIsCapturing(true); setProgress(0); notify(`Starting capture...`);

        let count = 0;
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const captureInterval = setInterval(async () => {
            if (count >= 50) {
                clearInterval(captureInterval); setIsCapturing(false); stopCamera(); setCaptureComplete(true);
                notify(`Successfully enrolled! Click 'Train AI Model' to finalize.`);
                return;
            }
            if (videoRef.current && isCameraActive) {
                canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg');
                count++; setProgress(count);
                try {
                    await fetch('http://localhost:5000/register_frame', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData, enrollment, name, subject, frameCount: count })
                    });
                } catch (e) { }
            }
        }, 150);
    };

    const handleTrainModel = async () => {
        setIsTraining(true); notify("Training AI... Please wait.");
        try {
            const response = await fetch('http://localhost:5000/train', { method: 'POST' });
            const data = await response.json(); notify(data.message);
            setCaptureComplete(false); setEnrollment(''); setName(''); setSubject('');
        } catch (error) { notify("Error connecting to server."); }
        setIsTraining(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight">Enroll New Student</h2>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700/50 shadow-xl flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-5">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Enrollment ID</label>
                        <input type="text" value={enrollment} onChange={(e) => setEnrollment(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-green-500" disabled={isCapturing} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-green-500" disabled={isCapturing} />
                    </div>

                    {/* THE NEW DROPDOWN */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Select Subject</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isCapturing}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-green-500 appearance-none">
                            <option value="">-- Choose Subject --</option>
                            {subjectsList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>

                    {isCapturing && (
                        <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700 overflow-hidden">
                            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${(progress / 50) * 100}%` }}></div>
                        </div>
                    )}

                    {captureComplete ? (
                        <button onClick={handleTrainModel} disabled={isTraining} className={`w-full py-4 rounded-lg font-bold shadow-lg ${isTraining ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500 animate-pulse'}`}>
                            {isTraining ? 'Compiling Logic...' : '🧠 Train AI Model Now'}
                        </button>
                    ) : (
                        <div className="flex gap-3 pt-2">
                            {!isCameraActive ? (
                                <button onClick={startCamera} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg shadow-lg">📷 Start Camera</button>
                            ) : (
                                <button onClick={handleCapture} disabled={isCapturing} className={`flex-1 py-3 rounded-lg font-bold shadow-lg ${isCapturing ? 'bg-gray-700' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                                    {isCapturing ? `Scanning (${progress}/50)...` : 'Scan Face'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-black rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center relative min-h-[250px]">
                    {!isCameraActive && !captureComplete && <div className="absolute text-gray-500 text-center z-10"><span className="text-4xl">📷</span><p>Offline</p></div>}
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90"></video>
                    {isCapturing && <div className="absolute inset-0 border-4 border-green-500/50 animate-pulse rounded-lg z-20"></div>}
                </div>
            </div>
        </div>
    );
}

// --- ATTENDANCE VIEW (Now with Pre-Session Spreadsheet) ---
function AttendanceView({ notify }) {
    const [subject, setSubject] = useState('');
    const [subjectsList, setSubjectsList] = useState([]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [allStudents, setAllStudents] = useState([]);
    const [presentIds, setPresentIds] = useState([]);
    const videoRef = useRef(null);

    // 1. Fetch available subjects on load
    useEffect(() => {
        fetch('http://localhost:5000/api/subjects')
            .then(res => res.json())
            .then(data => setSubjectsList(data));
        return () => stopSession();
    }, []);

    // 2. THE NEW SPREADSHEET LOGIC: Fetch data the moment a subject is selected
    useEffect(() => {
        if (subject) {
            fetchStudents();
            fetchLiveAttendance();
        } else {
            setAllStudents([]);
            setPresentIds([]);
        }
    }, [subject]);

    const fetchStudents = async () => {
        try { const res = await fetch(`http://localhost:5000/api/students/${subject}`); setAllStudents(await res.json()); } catch (e) { }
    };

    const fetchLiveAttendance = async () => {
        try { const res = await fetch(`http://localhost:5000/api/attendance/${subject}`); setPresentIds(await res.json()); } catch (e) { }
    };

    const startSession = () => {
        setIsSessionActive(true);
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(err => notify("Camera access denied."));
    };

    const stopSession = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsSessionActive(false);
        // Refresh the spreadsheet when closing the camera
        if (subject) fetchLiveAttendance();
    };

    const handleMarkAttendance = async () => {
        setIsVerifying(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            const response = await fetch('http://localhost:5000/verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageData, subject })
            });
            const data = await response.json();
            if (data.message.includes("Success")) { notify(data.message); fetchLiveAttendance(); }
            else { notify(data.message); }
        } catch (error) { notify("Network error."); }
        setIsVerifying(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Daily Attendance</h2>

                {/* Active Session Close Button */}
                {isSessionActive && (
                    <button onClick={stopSession} className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-lg flex items-center shadow-lg transition-all">
                        <span className="mr-2">✖</span> Close Camera Session
                    </button>
                )}
            </div>

            {/* --- PRE-SESSION SPREADSHEET VIEW --- */}
            {!isSessionActive && (
                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700/50 shadow-xl flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Select Subject Roster</label>
                            <select value={subject} onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white appearance-none focus:border-green-500 transition-all cursor-pointer">
                                <option value="">-- Choose Subject --</option>
                                {subjectsList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                        {subject && (
                            <button onClick={startSession} className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-all flex items-center">
                                <span className="mr-2 text-xl">📷</span> Start Live Scanner
                            </button>
                        )}
                    </div>

                    {subject && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700/50 shadow-xl overflow-hidden animate-fade-in">
                            <div className="p-6 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Attendance Spreadsheet: <span className="text-green-400">{subject}</span></h3>
                                <span className="bg-gray-900 px-3 py-1 rounded text-sm text-gray-400 font-medium">
                                    {presentIds.length} / {allStudents.length} Present
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900 text-gray-400 text-sm tracking-wide">
                                            <th className="p-4 border-b border-gray-700">Enrollment ID</th>
                                            <th className="p-4 border-b border-gray-700">Student Name</th>
                                            <th className="p-4 border-b border-gray-700">Today's Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-8 text-center text-gray-500">No students enrolled in {subject}.</td>
                                            </tr>
                                        ) : (
                                            allStudents.map((student) => {
                                                const isPresent = presentIds.includes(student.Enrollment);
                                                return (
                                                    <tr key={student.Enrollment} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                                        <td className="p-4 text-gray-400 font-mono">{student.Enrollment}</td>
                                                        <td className="p-4 text-gray-200 font-medium">{student.Name}</td>
                                                        <td className="p-4">
                                                            {isPresent
                                                                ? <span className="inline-block bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.1)]">PRESENT</span>
                                                                : <span className="inline-block bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">ABSENT</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- ACTIVE SESSION CAMERA VIEW (Unchanged) --- */}
            {isSessionActive && (
                <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
                    <div className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700/50 shadow-xl space-y-6">
                        <div className="bg-black rounded-lg overflow-hidden border border-gray-700 aspect-video relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                        </div>
                        <button onClick={handleMarkAttendance} disabled={isVerifying} className={`w-full py-4 rounded-lg font-bold shadow-lg transition-all ${isVerifying ? 'bg-gray-700 text-gray-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                            {isVerifying ? 'Analyzing Frame...' : 'Verify Face & Mark Present'}
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700/50 shadow-xl flex flex-col max-h-[600px]">
                        <h3 className="text-xl font-bold text-gray-200 mb-6 flex justify-between items-center">
                            Live Roster
                            <span className="text-sm bg-gray-900 px-3 py-1 rounded-full text-green-400 border border-gray-700">{presentIds.length} Present</span>
                        </h3>
                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                {allStudents.map((student) => {
                                    const isPresent = presentIds.includes(student.Enrollment);
                                    return (
                                        <div key={student.Enrollment} className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${isPresent ? 'bg-green-900/20 border-green-500/50' : 'bg-gray-900 border-gray-700'}`}>
                                            <div>
                                                <p className={`font-bold ${isPresent ? 'text-green-400' : 'text-gray-200'}`}>{student.Name}</p>
                                                <p className="text-sm text-gray-500">ID: {student.Enrollment}</p>
                                            </div>
                                            {isPresent ? <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]">PRESENT</span> : <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">ABSENT</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}