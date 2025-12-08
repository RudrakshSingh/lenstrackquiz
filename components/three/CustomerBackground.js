'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

function CustomerParticles({ count = 4000 }) {
  const points = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
      
      const color = new THREE.Color();
      const hue = Math.random() * 0.4 + 0.45; // Blue to purple to pink
      color.setHSL(hue, 0.9, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.x += delta * 0.06;
      points.current.rotation.y += delta * 0.1;
      points.current.rotation.z += delta * 0.04;
    }
  });

  return (
    <Points ref={points} positions={particles.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingOrbs() {
  const orbs = useRef([]);
  
  useFrame((state, delta) => {
    orbs.current.forEach((orb, i) => {
      if (orb) {
        orb.rotation.x += delta * (0.4 + i * 0.06);
        orb.rotation.y += delta * (0.3 + i * 0.08);
        orb.rotation.z += delta * (0.2 + i * 0.04);
        orb.position.y = Math.sin(state.clock.elapsedTime * 0.6 + i) * 1.5;
        orb.position.x = Math.cos(state.clock.elapsedTime * 0.4 + i) * 1;
        orb.position.z = Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.8;
        orb.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.3);
      }
    });
  });

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#fb7185', '#f97316'];
  
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <Sphere
          key={i}
          ref={(el) => (orbs.current[i] = el)}
          args={[0.5 + i * 0.08, 32, 32]}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
          ]}
        >
          <meshStandardMaterial
            color={colors[i % colors.length]}
            emissive={colors[i % colors.length]}
            emissiveIntensity={0.8}
            transparent
            opacity={0.7}
            metalness={0.95}
            roughness={0.05}
          />
        </Sphere>
      ))}
    </>
  );
}

function RotatingRings() {
  const rings = useRef([]);
  
  useFrame((state, delta) => {
    rings.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x += delta * (0.2 + i * 0.1);
        ring.rotation.y += delta * (0.15 + i * 0.1);
        ring.rotation.z += delta * (0.1 + i * 0.05);
      }
    });
  });

  return (
    <>
      {[...Array(3)].map((_, i) => (
        <Torus
          key={i}
          ref={(el) => (rings.current[i] = el)}
          args={[2 + i * 0.5, 0.1, 16, 100]}
          position={[
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
          ]}
        >
          <meshStandardMaterial
            color={i === 0 ? '#3b82f6' : i === 1 ? '#6366f1' : '#8b5cf6'}
            emissive={i === 0 ? '#3b82f6' : i === 1 ? '#6366f1' : '#8b5cf6'}
            emissiveIntensity={0.4}
            transparent
            opacity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </Torus>
      ))}
    </>
  );
}

export default function CustomerBackground() {
  return (
    <div className="fixed inset-0 -z-10 opacity-70" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#6366f1" />
        <pointLight position={[0, 10, 0]} intensity={1.2} color="#8b5cf6" />
        <pointLight position={[0, -10, 0]} intensity={1} color="#a855f7" />
        <pointLight position={[10, 0, -10]} intensity={0.8} color="#ec4899" />
        <CustomerParticles count={4000} />
        <FloatingOrbs />
        <RotatingRings />
      </Canvas>
    </div>
  );
}

