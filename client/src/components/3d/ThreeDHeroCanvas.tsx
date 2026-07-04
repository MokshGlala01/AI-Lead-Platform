'use client';

// Interactive WebGL Three.js Canvas rendering a glowing neural data network reacting to mouse movements
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeDHeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initial Scene Setup
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    // Fade out particles near borders with black fog
    scene.fog = new THREE.FogExp2(0x050816, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Generate Floating Particle System
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    // Spread particles in a 3D volume
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350;

      velocities.push({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.4,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(0, 229, 255, 1)');
      grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 4,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // 3. Generate Connecting Lines (Network Web)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    let lineMesh = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
    scene.add(lineMesh);

    // 4. Mouse Interactivity Vectors
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / width - 0.5) * 120;
      targetY = -((event.clientY - rect.top) / height - 0.5) * 120;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 5. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

      // Mouse Parallax easing
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Subtle rotation from mouse coordinates
      particleSystem.rotation.y = mouseX * 0.005;
      particleSystem.rotation.x = -mouseY * 0.005;
      lineMesh.rotation.y = mouseX * 0.005;
      lineMesh.rotation.x = -mouseY * 0.005;

      // Move individual particles and bounds check
      const linePositions: number[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        let x = posAttr.getX(i) + velocities[i].x;
        let y = posAttr.getY(i) + velocities[i].y;
        let z = posAttr.getZ(i) + velocities[i].z;

        // Bounce on boundary limits
        if (Math.abs(x) > 175) velocities[i].x *= -1;
        if (Math.abs(y) > 175) velocities[i].y *= -1;
        if (Math.abs(z) > 175) velocities[i].z *= -1;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      // Dynamic line links creation based on proximity
      for (let i = 0; i < particleCount; i++) {
        const x1 = posAttr.getX(i);
        const y1 = posAttr.getY(i);
        const z1 = posAttr.getZ(i);

        for (let j = i + 1; j < particleCount; j++) {
          const x2 = posAttr.getX(j);
          const y2 = posAttr.getY(j);
          const z2 = posAttr.getZ(j);

          const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
          if (dist < 45) {
            // Add connecting line segment vertices
            linePositions.push(x1, y1, z1, x2, y2, z2);
          }
        }
      }

      // Update lines buffer geometry
      if (lineMesh) {
        scene.remove(lineMesh);
        lineMesh.geometry.dispose();
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineMesh);

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default ThreeDHeroCanvas;
