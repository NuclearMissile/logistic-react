import React, {useCallback, useEffect, useRef, useState} from 'react';

const ChemicalOscillator = () => {
    // State management
    const [B, setB] = useState(5.0);
    const [isPaused, setIsPaused] = useState(false);
    const [status, setStatus] = useState('');

    // Canvas refs
    const phaseCanvasRef = useRef(null);
    const timeCanvasRef = useRef(null);

    // System state refs
    const systemStateRef = useRef({
        A: 2.0,
        X: 1.0,
        Y: 1.0,
        time: 0,
        phasePoints: [],
        timePoints: [],
        animationId: null
    });

    // Constants
    const k1 = 1.0, k2 = 1.0, k3 = 1.0, k4 = 1.0;
    const dt = 0.01;
    const maxPoints = 1000;

    // Differential equations
    const derivatives = useCallback((x, y, b) => {
        const dxdt = k1 * systemStateRef.current.A - k2 * b * x + k3 * x * x * y - k4 * x;
        const dydt = k2 * b * x - k3 * x * x * y;
        return [dxdt, dydt];
    }, []);

    // Runge-Kutta integration
    const rungeKutta = useCallback((x, y, dt, b) => {
        const [k1x, k1y] = derivatives(x, y, b);
        const [k2x, k2y] = derivatives(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, b);
        const [k3x, k3y] = derivatives(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, b);
        const [k4x, k4y] = derivatives(x + dt * k3x, y + dt * k3y, b);

        const newX = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
        const newY = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);

        return [Math.max(0, newX), Math.max(0, newY)];
    }, [derivatives]);

    // Update system state
    const updateSystem = useCallback(() => {
        if (isPaused) return;

        const state = systemStateRef.current;
        [state.X, state.Y] = rungeKutta(state.X, state.Y, dt, B);
        state.time += dt;

        // Store trajectory points
        state.phasePoints.push({x: state.X, y: state.Y});
        state.timePoints.push({time: state.time, x: state.X, y: state.Y});

        // Limit stored points
        if (state.phasePoints.length > maxPoints) {
            state.phasePoints.shift();
        }
        if (state.timePoints.length > maxPoints) {
            state.timePoints.shift();
        }
    }, [isPaused, B, rungeKutta]);

    // Draw phase diagram
    const drawPhase = useCallback(() => {
        const canvas = phaseCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const state = systemStateRef.current;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * canvas.width;
            const y = (i / 10) * canvas.height;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (state.phasePoints.length < 2) return;

        // Draw trajectory
        const maxVal = Math.max(...state.phasePoints.map(p => Math.max(p.x, p.y)), 5);

        for (let i = 1; i < state.phasePoints.length; i++) {
            const alpha = i / state.phasePoints.length;
            const hue = (240 + alpha * 120) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.8 + 0.2})`;
            ctx.lineWidth = 2;

            const x1 = (state.phasePoints[i - 1].x / maxVal) * canvas.width;
            const y1 = canvas.height - (state.phasePoints[i - 1].y / maxVal) * canvas.height;
            const x2 = (state.phasePoints[i].x / maxVal) * canvas.width;
            const y2 = canvas.height - (state.phasePoints[i].y / maxVal) * canvas.height;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Draw current point
        if (state.phasePoints.length > 0) {
            const current = state.phasePoints[state.phasePoints.length - 1];
            const x = (current.x / maxVal) * canvas.width;
            const y = canvas.height - (current.y / maxVal) * canvas.height;

            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Add glow effect
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw axis labels
        ctx.fillStyle = '#4a9eff';
        ctx.font = '14px Arial';
        ctx.fillText('X', canvas.width - 20, canvas.height - 10);
        ctx.fillText('Y', 10, 20);
    }, []);

    // Draw time series
    const drawTimeSeries = useCallback(() => {
        const canvas = timeCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const state = systemStateRef.current;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * canvas.width;
            const y = (i / 10) * canvas.height;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (state.timePoints.length < 2) return;

        const timeRange = Math.max(state.timePoints[state.timePoints.length - 1].time - state.timePoints[0].time, 10);
        const maxVal = Math.max(...state.timePoints.map(p => Math.max(p.x, p.y)), 5);

        // Draw X concentration curve
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < state.timePoints.length; i++) {
            const point = state.timePoints[i];
            const x = ((point.time - state.timePoints[0].time) / timeRange) * canvas.width;
            const y = canvas.height - (point.x / maxVal) * canvas.height;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Y concentration curve
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < state.timePoints.length; i++) {
            const point = state.timePoints[i];
            const x = ((point.time - state.timePoints[0].time) / timeRange) * canvas.width;
            const y = canvas.height - (point.y / maxVal) * canvas.height;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw legend
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '14px Arial';
        ctx.fillText('X', 20, 30);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('Y', 20, 50);
        ctx.fillStyle = '#4a9eff';
        ctx.fillText('Time', canvas.width - 40, canvas.height - 10);
    }, []);

    // Animation loop
    const animate = useCallback(() => {
        const state = systemStateRef.current;

        updateSystem();
        drawPhase();
        drawTimeSeries();

        // Update status
        const statusText = `B = ${B.toFixed(1)}, X = ${state.X.toFixed(2)}, Y = ${state.Y.toFixed(2)}, t = ${state.time.toFixed(1)}`;
        setStatus(statusText);

        state.animationId = requestAnimationFrame(animate);
    }, [updateSystem, drawPhase, drawTimeSeries, B]);

    // Reset simulation
    const resetSimulation = useCallback(() => {
        const state = systemStateRef.current;
        state.X = 1.0;
        state.Y = 1.0;
        state.time = 0;
        state.phasePoints = [];
        state.timePoints = [];
    }, []);

    // Toggle pause
    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    // Effect to start/stop animation
    useEffect(() => {
        const state = systemStateRef.current;

        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }

        state.animationId = requestAnimationFrame(animate);

        return () => {
            if (state.animationId) {
                cancelAnimationFrame(state.animationId);
            }
        };
    }, [animate]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <h1 className="text-4xl font-bold text-center text-blue-400 mb-8 drop-shadow-lg">
                    Chemical Oscillator
                </h1>

                <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
                    <div
                        className="flex items-center gap-4 bg-gray-600/60 p-4 rounded-xl border border-blue-400/20">
                        <label className="font-bold text-gray-300 min-w-20">B Concentration:</label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={B}
                            onChange={(e) => setB(parseFloat(e.target.value))}
                            className="w-48 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #4a9eff 0%, #4a9eff ${(B / 5) * 100}%, #444 ${(B / 5) * 100}%, #444 100%)`
                            }}
                        />
                        <span
                            className="bg-blue-400/20 text-blue-400 px-4 py-2 rounded-lg font-mono font-bold border border-blue-400/30">
              {B.toFixed(1)}
            </span>
                    </div>

                    <button
                        onClick={resetSimulation}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        Reset
                    </button>

                    <button
                        onClick={togglePause}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                </div>

                <div className="flex justify-center gap-8 flex-wrap">
                    <div className="bg-gray-900/80 rounded-xl p-5 border border-blue-400/20 shadow-xl">
                        <div className="text-center text-blue-400 mb-4 text-xl font-bold">
                            X vs Y
                        </div>
                        <canvas
                            ref={phaseCanvasRef}
                            width="400"
                            height="400"
                            className="border-2 border-gray-600 rounded-lg bg-gray-900"
                        />
                    </div>

                    <div className="bg-gray-900/80 rounded-xl p-5 border border-blue-400/20 shadow-xl">
                        <div className="text-center text-blue-400 mb-4 text-xl font-bold">
                            Time Series
                        </div>
                        <canvas
                            ref={timeCanvasRef}
                            width="400"
                            height="400"
                            className="border-2 border-gray-600 rounded-lg bg-gray-900"
                        />
                    </div>
                </div>

                <div className="mt-6 bg-gray-600/40 p-5 rounded-xl border border-blue-400/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div
                            className="bg-gray-700/60 p-3 rounded-lg text-center font-mono text-green-400 border border-green-400/20">
                            A → X
                        </div>
                        <div
                            className="bg-gray-700/60 p-3 rounded-lg text-center font-mono text-green-400 border border-green-400/20">
                            B + X → Y + D
                        </div>
                        <div
                            className="bg-gray-700/60 p-3 rounded-lg text-center font-mono text-green-400 border border-green-400/20">
                            2X + Y → 3X
                        </div>
                        <div
                            className="bg-gray-700/60 p-3 rounded-lg text-center font-mono text-green-400 border border-green-400/20">
                            X → E
                        </div>
                    </div>
                    <div
                        className="text-center p-3 bg-blue-400/10 rounded-lg text-blue-400 font-bold border border-blue-400/30">
                        {status || 'System running - Adjust B concentration to observe oscillation behavior'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChemicalOscillator;