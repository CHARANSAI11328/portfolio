'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function SkillsGyro3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    keyLight.position.set(4, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.0);
    rimLight.position.set(-4, -2, 2);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Center Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.45, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      emissive: 0x312e81,
      roughness: 0.1,
      metalness: 0.4,
      clearcoat: 1.0,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreSphere);

    // 2. Gyro Ring 1 (Outer)
    const ring1Geo = new THREE.TorusGeometry(1.6, 0.05, 16, 80);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    // 3. Gyro Ring 2 (Middle)
    const ring2Geo = new THREE.TorusGeometry(1.2, 0.045, 16, 70);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.7,
      roughness: 0.25,
      transparent: true,
      opacity: 0.8,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    group.add(ring2);

    // 4. Gyro Ring 3 (Inner)
    const ring3Geo = new THREE.TorusGeometry(0.8, 0.035, 16, 60);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    group.add(ring3);

    // Satellite orb
    const satGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const satMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
    const sat = new THREE.Mesh(satGeo, satMat);
    sat.position.set(1.9, 0.4, 0);
    group.add(sat);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gyroscopic multi-axis rotations
      ring1.rotation.x = t * 0.4;
      ring1.rotation.y = t * 0.3;

      ring2.rotation.y = -t * 0.5;
      ring2.rotation.z = t * 0.35;

      ring3.rotation.x = -t * 0.6;
      ring3.rotation.z = -t * 0.45;

      coreSphere.position.y = Math.sin(t * 1.5) * 0.08;
      sat.position.y = 0.4 + Math.cos(t * 1.8) * 0.12;

      group.rotation.y = Math.sin(t * 0.2) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[320px] h-[320px] mx-auto flex items-center justify-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/20 to-purple-500/20 blur-2xl" />
      </div>

      {webglSupported ? (
        <div ref={mountRef} className="w-full h-full relative z-10" />
      ) : (
        <div className="w-48 h-48 rounded-full border-2 border-indigo-400/30 flex items-center justify-center animate-spin-slow">
          <div className="w-32 h-32 rounded-full border-2 border-sky-400/30 -rotate-45" />
          <div className="w-16 h-16 rounded-full bg-indigo-500/30 blur-sm" />
        </div>
      )}
    </div>
  );
}
