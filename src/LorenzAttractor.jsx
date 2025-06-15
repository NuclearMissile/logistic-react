import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';

const LorenzAttractor = () => {
    const mountRef = useRef(null);
    const animationRef = useRef(null);
    const pointsRef = useRef([]);
    const lineRef = useRef(null);

    const [speed, setSpeed] = useState(1);
    const [trailLength, setTrailLength] = useState(2000);

    // Lorenz system parameters
    const [sigma, setSigma] = useState(10);
    const [rho, setRho] = useState(28);
    const [beta, setBeta] = useState(8 / 3);

    // Current position
    const positionRef = useRef({x: 1, y: 1, z: 1});

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1e2939);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(50, 50, 50);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);

        // Create line geometry for the attractor trail
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create gradient material
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lineRef.current = line;

        // Initialize points array
        pointsRef.current = [];

        // Mouse controls for camera rotation and zoom
        let isDragging = false;
        let previousMousePosition = {x: 0, y: 0};
        let spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);

        const onMouseDown = (event) => {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onMouseMove = (event) => {
            if (!isDragging) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            // Update spherical coordinates
            spherical.theta -= deltaMove.x * 0.01;
            spherical.phi += deltaMove.y * 0.01;

            // Limit phi to prevent flipping
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            // Update camera position
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 20, 0);

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onWheel = (event) => {
            event.preventDefault();

            // Zoom in/out by adjusting radius
            const zoomSpeed = 0.1;
            spherical.radius += event.deltaY * zoomSpeed;

            // Limit zoom range
            spherical.radius = Math.max(20, Math.min(200, spherical.radius));

            // Update camera position
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 20, 0);
        };

        // Add event listeners
        mountRef.current.addEventListener('mousedown', onMouseDown);
        mountRef.current.addEventListener('mousemove', onMouseMove);
        mountRef.current.addEventListener('mouseup', onMouseUp);
        mountRef.current.addEventListener('wheel', onWheel, {passive: false});

        // Animation loop
        const animate = () => {

            // Lorenz equations
            const dt = 0.01 * speed;
            const {x, y, z} = positionRef.current;

            const dx = sigma * (y - x) * dt;
            const dy = (x * (rho - z) - y) * dt;
            const dz = (x * y - beta * z) * dt;

            positionRef.current.x += dx;
            positionRef.current.y += dy;
            positionRef.current.z += dz;

            // Add new point to trail
            pointsRef.current.push({
                x: positionRef.current.x,
                y: positionRef.current.y,
                z: positionRef.current.z
            });

            // Limit trail length
            if (pointsRef.current.length > trailLength) {
                pointsRef.current.shift();
            }

            // Update line geometry
            if (lineRef.current && pointsRef.current.length > 1) {
                const positions = lineRef.current.geometry.attributes.position.array;

                for (let i = 0; i < pointsRef.current.length; i++) {
                    const point = pointsRef.current[i];
                    positions[i * 3] = point.x;
                    positions[i * 3 + 1] = point.y;
                    positions[i * 3 + 2] = point.z;
                }

                lineRef.current.geometry.setDrawRange(0, pointsRef.current.length);
                lineRef.current.geometry.attributes.position.needsUpdate = true;
            }

            // Render the scene
            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            if (!mountRef.current) return;

            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            if (mountRef.current) {
                mountRef.current.removeEventListener('mousedown', onMouseDown);
                mountRef.current.removeEventListener('mousemove', onMouseMove);
                mountRef.current.removeEventListener('mouseup', onMouseUp);
                mountRef.current.removeEventListener('wheel', onWheel);
            }
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, [trailLength, speed, sigma, rho, beta]);

    // Update animation when parameters change
    useEffect(() => {
        if (lineRef.current) {
            // Create new gradient colors based on parameters
            const hue = (sigma + rho + beta * 10) % 360;
            lineRef.current.material.color.setHSL(hue / 360, 1, 0.5);
        }
    }, [sigma, rho, beta]);

    const resetAttractor = () => {
        positionRef.current = {x: 1, y: 1, z: 1};
        pointsRef.current = [];
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array;
            positions.fill(0);
            lineRef.current.geometry.setDrawRange(0, 0);
            lineRef.current.geometry.attributes.position.needsUpdate = true;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Lorenz Attractor System
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Visualize chaotic patterns in the Lorenz system of differential equations
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 border border-gray-700 p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                        System Parameters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                σ (Sigma): {sigma.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                step="0.1"
                                value={sigma}
                                onChange={(e) => setSigma(parseFloat(e.target.value))}
                                className="w-full bg-gray-700 accent-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                ρ (Rho): {rho.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="20"
                                max="35"
                                step="0.1"
                                value={rho}
                                onChange={(e) => setRho(parseFloat(e.target.value))}
                                className="w-full bg-gray-700 accent-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                β (Beta): {beta.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="0.01"
                                value={beta}
                                onChange={(e) => setBeta(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Speed: {speed.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="3"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-200 font-medium text-sm">
                                Trail Length: {trailLength}
                            </label>
                            <input
                                type="range"
                                min="500"
                                max="5000"
                                step="100"
                                value={trailLength}
                                onChange={(e) => setTrailLength(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={resetAttractor}
                            className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                            Reset Simulation
                        </button>
                    </div>
                </div>

                {/* Visualization */}
                <div className="bg-gray-800 border border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        3D Visualization
                    </h3>
                    <div className="text-sm text-gray-400 mb-4">
                        Drag to rotate | Scroll to zoom
                    </div>

                    <div className="h-190 w-full border border-gray-700"
                         ref={mountRef}
                         style={{cursor: 'grab'}}/>

                    <div className="mt-4 text-xs text-gray-500">
                        <p>• The Lorenz attractor is a set of chaotic solutions to the Lorenz system of differential equations</p>
                        <p>• It exhibits sensitive dependence on initial conditions (butterfly effect)</p>
                        <p>• The system creates a beautiful butterfly-shaped pattern in phase space</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LorenzAttractor;
