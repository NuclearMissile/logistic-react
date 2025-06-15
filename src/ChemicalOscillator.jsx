import React, {useCallback, useEffect, useRef, useState} from 'react';

const ChemicalOscillator = () => {
    // State management
    const [parameters, setParameters] = useState({
        B: 5.5,
        A: 2.0,
        k1: 1.0,
        k2: 1.0,
        k3: 1.0,
        k4: 1.0
    });
    const [isPaused, setIsPaused] = useState(false);
    const [status, setStatus] = useState('');

    // Canvas refs
    const phaseCanvasRef = useRef(null);
    const timeCanvasRef = useRef(null);

    // System state refs
    const systemStateRef = useRef({
        X: 1.0,
        Y: 1.0,
        time: 0,
        phasePoints: [],
        timePoints: [],
        animationId: null
    });

    // Constants
    const dt = 0.01;
    const maxPoints = 1000;

    // Differential equations
    const derivatives = useCallback((x, y, params) => {
        const {A, B, k1, k2, k3, k4} = params;
        const dxdt = k1 * A - k2 * B * x + k3 * x * x * y - k4 * x;
        const dydt = k2 * B * x - k3 * x * x * y;
        return [dxdt, dydt];
    }, []);

    // Runge-Kutta integration
    const rungeKutta = useCallback((x, y, dt, params) => {
        const [k1x, k1y] = derivatives(x, y, params);
        const [k2x, k2y] = derivatives(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, params);
        const [k3x, k3y] = derivatives(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, params);
        const [k4x, k4y] = derivatives(x + dt * k3x, y + dt * k3y, params);

        const newX = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
        const newY = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);

        return [Math.max(0, newX), Math.max(0, newY)];
    }, [derivatives]);

    // Update system state
    const updateSystem = useCallback(() => {
        if (isPaused) return;

        const state = systemStateRef.current;
        [state.X, state.Y] = rungeKutta(state.X, state.Y, dt, parameters);
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
    }, [isPaused, parameters, rungeKutta]);

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
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px';
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
        ctx.font = '12px';
        ctx.fillText('X', 20, 30);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('Y', 20, 50);
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText('Time', canvas.width - 40, canvas.height - 10);
    }, []);

    // Animation loop
    const animate = useCallback(() => {
        const state = systemStateRef.current;

        updateSystem();
        drawPhase();
        drawTimeSeries();

        // Update status
        const statusText = `B = ${parameters.B.toFixed(1)}, X = ${state.X.toFixed(2)}, Y = ${state.Y.toFixed(2)}, t = ${state.time.toFixed(1)}`;
        setStatus(statusText);

        state.animationId = requestAnimationFrame(animate);
    }, [updateSystem, drawPhase, drawTimeSeries, parameters.B]);

    // Reset simulation
    const resetSimulation = useCallback(() => {
        const state = systemStateRef.current;
        state.X = 1.0;
        state.Y = 1.0;
        state.time = 0;
        state.phasePoints = [];
        state.timePoints = [];
    }, []);

    // Reset parameters
    const resetParameters = () => {
        setParameters({
            B: 5.0,
            A: 2.0,
            k1: 1.0,
            k2: 1.0,
            k3: 1.0,
            k4: 1.0
        });
        resetSimulation();
    };

    // Toggle pause
    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    const updateParameter = (key, value) => {
        setParameters(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Brusselator Simulation
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Visualize the Brusselator chemical reaction dynamics in phase space and time series
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 border border-gray-700 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Parameter B
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={parameters.B}
                                onChange={(e) => updateParameter('B', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Parameter A
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="5"
                                value={parameters.A}
                                onChange={(e) => updateParameter('A', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Rate k₁
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="3"
                                value={parameters.k1}
                                onChange={(e) => updateParameter('k1', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Rate k₂
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="3"
                                value={parameters.k2}
                                onChange={(e) => updateParameter('k2', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Rate k₃
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="3"
                                value={parameters.k3}
                                onChange={(e) => updateParameter('k3', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Rate k₄
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="3"
                                value={parameters.k4}
                                onChange={(e) => updateParameter('k4', e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={resetParameters}
                            className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Reset Parameters
                        </button>
                        <button
                            onClick={resetSimulation}
                            className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Reset Simulation
                        </button>
                        <button
                            onClick={togglePause}
                            className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <div className="text-sm text-gray-400 flex items-center">
                            {status}
                        </div>
                    </div>
                </div>

                {/* Visualization Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-800 border border-gray-700 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Phase Portrait (X vs Y)
                        </h3>
                        <div className="text-sm text-gray-400 mb-4">
                            Trajectory in concentration phase space
                        </div>
                        <canvas
                            ref={phaseCanvasRef}
                            width="400"
                            height="300"
                            className="w-full border border-gray-600 bg-gray-900"
                        />
                    </div>

                    <div className="bg-gray-800 border border-gray-700 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Time Series
                        </h3>
                        <div className="text-sm text-gray-400 mb-4">
                            Concentration oscillations over time
                        </div>
                        <canvas
                            ref={timeCanvasRef}
                            width="400"
                            height="300"
                            className="w-full border border-gray-600 bg-gray-900"
                        />
                    </div>
                </div>

                {/* Chemical Reactions Panel */}
                <div className="bg-gray-800 border border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        Brusselator Reaction Scheme
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-700 p-3 text-center font-mono text-sm">
                            A → X
                        </div>
                        <div className="bg-gray-700 p-3 text-center font-mono text-sm">
                            B + X → Y + D
                        </div>
                        <div className="bg-gray-700 p-3 text-center font-mono text-sm">
                            2X + Y → 3X
                        </div>
                        <div className="bg-gray-700 p-3 text-center font-mono text-sm">
                            X → E
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        <p>• The Brusselator is a theoretical model for autocatalytic chemical reactions</p>
                        <p>• Parameter B controls the oscillation behavior - try values around 5-6 for limit cycles</p>
                        <p>• The phase portrait shows the system's trajectory in X-Y concentration space</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChemicalOscillator;