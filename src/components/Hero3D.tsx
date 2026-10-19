'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 2. Renderer with antialias and alpha
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting matching reference image (pale blue, soft violet, specular highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x818cf8, 2.5); // Indigo/violet key light
    dirLight1.position.set(5, 6, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 2.0); // Soft cyan/blue fill light
    dirLight2.position.set(-5, -4, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xa78bfa, 3, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 4. Object Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // --- Object A: Floating Translucent Crystal / Beveled Cube (Top Right) ---
    const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.85,
      opacity: 0.95,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.52,
      thickness: 1.2,
      specularIntensity: 1.0,
      specularColor: 0xffffff,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(2.4, 2.0, 0);
    cube.rotation.set(0.6, 0.8, 0.3);
    mainGroup.add(cube);

    // Wireframe edge highlight for the crystal cube
    const wireGeo = new THREE.EdgesGeometry(cubeGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.6 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    cube.add(wireframe);

    // --- Object B: Iridescent Floating Sphere (Bottom Left) ---
    const sphereGeo = new THREE.SphereGeometry(0.75, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      emissive: 0x2e1065,
      emissiveIntensity: 0.4,
      transmission: 0.6,
      transparent: true,
      roughness: 0.12,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const bottomSphere = new THREE.Mesh(sphereGeo, sphereMat);
    bottomSphere.position.set(-2.2, -1.8, 0.5);
    mainGroup.add(bottomSphere);

    // --- Object C: Dimensional Orbiting Rings (Center Composition) ---
    const ringGeo = new THREE.TorusGeometry(2.1, 0.035, 24, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.8;
    ring1.rotation.y = Math.PI / 7;
    mainGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.025, 20, 80),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.9,
        roughness: 0.15,
        transparent: true,
        opacity: 0.65,
      })
    );
    ring2.rotation.x = -Math.PI / 3.2;
    ring2.rotation.y = -Math.PI / 5;
    mainGroup.add(ring2);

    // Floating micro crystal prism
    const prismGeo = new THREE.OctahedronGeometry(0.4, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      metalness: 0.6,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.set(-1.8, 1.6, -0.5);
    mainGroup.add(prism);

    // Small floating satellite particles
    const particleCount = 20;
    const particleGroup = new THREE.Group();
    const pGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.4 + (Math.sin(i * 3) * 0.5);
      p.position.set(
        Math.cos(angle) * radius,
        (Math.sin(i * 2) * 1.2),
        Math.sin(angle) * radius * 0.6
      );
      particleGroup.add(p);
    }
    mainGroup.add(particleGroup);

    // 5. Mouse Parallax Interaction
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.45;
      targetY = y * 0.45;
    };

    window.addEventListener('mousemove', handlePointerMove);

    // 6. Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer parallax damping
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      mainGroup.rotation.y = currentX * 0.7 + elapsedTime * 0.05;
      mainGroup.rotation.x = -currentY * 0.5 + Math.sin(elapsedTime * 0.3) * 0.04;

      // Subtle autonomous floating physics for each object
      cube.rotation.x += 0.006;
      cube.rotation.y += 0.008;
      cube.position.y = 2.0 + Math.sin(elapsedTime * 1.2) * 0.12;

      bottomSphere.position.y = -1.8 + Math.cos(elapsedTime * 1.4) * 0.14;
      bottomSphere.rotation.y += 0.01;

      prism.rotation.x += 0.01;
      prism.rotation.z += 0.008;
      prism.position.y = 1.6 + Math.sin(elapsedTime * 1.5 + 1) * 0.1;

      ring1.rotation.z = elapsedTime * 0.08;
      ring2.rotation.z = -elapsedTime * 0.06;

      particleGroup.rotation.y = elapsedTime * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px] flex items-center justify-center">
      {/* Soft atmospheric radial backglow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-sky-400/20 blur-3xl" />
      </div>

      {webglSupported ? (
        <div ref={mountRef} className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing" />
      ) : (
        /* Graceful CSS 3D Fallback when WebGL is unavailable */
        <div className="relative w-72 h-72 rounded-full border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center animate-spin-slow">
          <div className="w-48 h-48 rounded-full border border-sky-400/40 rotate-45" />
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 backdrop-blur-md border border-white/40 shadow-xl" />
        </div>
      )}
    </div>
  );
}
