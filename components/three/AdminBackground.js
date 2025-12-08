'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticles({ count = 3000 }) {
  const points = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      
      const color = new THREE.Color();
      const hue = Math.random() * 0.3 + 0.5; // Blue to purple range
      color.setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.x += delta * 0.08;
      points.current.rotation.y += delta * 0.12;
      points.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <Points ref={points} positions={particles.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.12}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingShapes() {
  const shapes = useRef([]);
  
  useFrame((state, delta) => {
    shapes.current.forEach((shape, i) => {
      if (shape) {
        shape.rotation.x += delta * (0.4 + i * 0.08);
        shape.rotation.y += delta * (0.3 + i * 0.1);
        shape.rotation.z += delta * (0.2 + i * 0.05);
        shape.position.y = Math.sin(state.clock.elapsedTime * 0.5 + i) * 1;
        shape.position.x = Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.8;
        shape.scale.setScalar(1 + Math.sin(state.clock.elapsedTime + i) * 0.2);
      }
    });
  });

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];
  
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <Sphere
          key={i}
          ref={(el) => (shapes.current[i] = el)}
          args={[0.4 + i * 0.1, 32, 32]}
          position={[
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
          ]}
        >
          <meshStandardMaterial
            color={colors[i % colors.length]}
            emissive={colors[i % colors.length]}
            emissiveIntensity={0.7}
            transparent
            opacity={0.7}
            metalness={0.9}
            roughness={0.1}
          />
        </Sphere>
      ))}
    </>
  );
}

function FloatingTorus() {
  const torusRef = useRef();
  
  useFrame((state, delta) => {
    if (torusRef.current) {
      torusRef.current.rotation.x += delta * 0.3;
      torusRef.current.rotation.y += delta * 0.4;
      torusRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });

  return (
    <mesh ref={torusRef} position={[-8, 2, -5]}>
      <torusGeometry args={[1.5, 0.5, 16, 100]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#a855f7"
        emissiveIntensity={0.6}
        transparent
        opacity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function FloatingRing() {
  const ringRef = useRef();
  
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
      ringRef.current.rotation.x += delta * 0.15;
      ringRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.5;
    }
  });

  return (
    <mesh ref={ringRef} position={[8, -2, -5]}>
      <torusGeometry args={[2, 0.3, 16, 100]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

function AnimatedGrid() {
  const gridRef = useRef();
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[20, 20, '#3b82f6', '#6366f1']}
      position={[0, 0, -5]}
    />
  );
}

export default function AdminBackground() {
  return (
    <div className="fixed inset-0 -z-10 opacity-70" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#6366f1" />
        <pointLight position={[0, 10, 0]} intensity={1.3} color="#8b5cf6" />
        <pointLight position={[0, -10, 0]} intensity={1} color="#a855f7" />
        <pointLight position={[10, 0, -10]} intensity={0.9} color="#ec4899" />
        <FloatingParticles count={3000} />
        <FloatingShapes />
        <FloatingTorus />
        <FloatingRing />
        <AnimatedGrid />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

