import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';

const LorenzAttractor = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
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
        scene.background = new THREE.Color(0x0a0a0a);
        sceneRef.current = scene;

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
        rendererRef.current = renderer;

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

        // Touch controls for mobile
        let touches = [];
        let lastTouchDistance = 0;

        const onTouchStart = (event) => {
            event.preventDefault();
            touches = Array.from(event.touches);

            if (touches.length === 1) {
                isDragging = true;
                previousMousePosition = {
                    x: touches[0].clientX,
                    y: touches[0].clientY
                };
            } else if (touches.length === 2) {
                isDragging = false;
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            touches = Array.from(event.touches);

            if (touches.length === 1 && isDragging) {
                // Single touch - rotate
                const deltaMove = {
                    x: touches[0].clientX - previousMousePosition.x,
                    y: touches[0].clientY - previousMousePosition.y
                };

                spherical.theta -= deltaMove.x * 0.01;
                spherical.phi += deltaMove.y * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

                camera.position.setFromSpherical(spherical);
                camera.lookAt(0, 20, 0);

                previousMousePosition = {
                    x: touches[0].clientX,
                    y: touches[0].clientY
                };
            } else if (touches.length === 2) {
                // Two touches - zoom
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDistance > 0) {
                    const delta = distance - lastTouchDistance;
                    spherical.radius -= delta * 0.5;
                    spherical.radius = Math.max(20, Math.min(200, spherical.radius));

                    camera.position.setFromSpherical(spherical);
                    camera.lookAt(0, 20, 0);
                }

                lastTouchDistance = distance;
            }
        };

        const onTouchEnd = (event) => {
            event.preventDefault();
            isDragging = false;
            touches = [];
            lastTouchDistance = 0;
        };

        // Add event listeners
        mountRef.current.addEventListener('mousedown', onMouseDown);
        mountRef.current.addEventListener('mousemove', onMouseMove);
        mountRef.current.addEventListener('mouseup', onMouseUp);
        mountRef.current.addEventListener('wheel', onWheel, {passive: false});
        mountRef.current.addEventListener('touchstart', onTouchStart, {passive: false});
        mountRef.current.addEventListener('touchmove', onTouchMove, {passive: false});
        mountRef.current.addEventListener('touchend', onTouchEnd, {passive: false});

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
                mountRef.current.removeEventListener('touchstart', onTouchStart);
                mountRef.current.removeEventListener('touchmove', onTouchMove);
                mountRef.current.removeEventListener('touchend', onTouchEnd);
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
        <div className="w-full h-screen bg-gray-900 relative overflow-hidden">
            <div
                ref={mountRef}
                className="w-full h-full"
                style={{cursor: 'grab'}}
            />

            {/* Control Panel */}
            <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-cyan-400">Lorenz Attractor</h2>

                <div className="space-y-3">
                    <div className="flex items-center justify-center">
                        <button
                            onClick={resetAttractor}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium transition-colors"
                        >
                            Reset
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
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

                    <div>
                        <label className="block text-sm font-medium mb-1">
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

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            σ (Sigma): {sigma.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="20"
                            step="0.1"
                            value={sigma}
                            onChange={(e) => setSigma(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ρ (Rho): {rho.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="20"
                            max="35"
                            step="0.1"
                            value={rho}
                            onChange={(e) => setRho(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
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
            </div>

            {/* Info Panel */}
            <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-xs">
                <h3 className="text-lg font-semibold mb-2 text-cyan-400">About</h3>
                <p className="text-sm text-gray-300">
                    The Lorenz attractor is a set of chaotic solutions to the Lorenz system of differential equations.
                    It exhibits sensitive dependence on initial conditions and creates a beautiful butterfly-shaped
                    pattern.
                </p>
            </div>
        </div>
    );
};

export default LorenzAttractor;