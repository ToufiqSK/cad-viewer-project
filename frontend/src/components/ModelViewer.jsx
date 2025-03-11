import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import axios from 'axios';
import * as THREE from 'three';
import Tooltip from './Tooltip';
import logo from '../assets/images/logo.png'; // Adjust the path as needed

function Model({ url, type }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!url) return;

    const loader = type === 'stl' ? new STLLoader() : new OBJLoader();
    loader.load(url, (model) => {
      let geometry;

      if (type === 'stl') {
        geometry = model;
        meshRef.current.geometry = geometry;
        meshRef.current.material = new THREE.MeshStandardMaterial(); // Default material for STL
      } else if (type === 'obj') {
        geometry = model.children[0].geometry;
        meshRef.current.geometry = geometry;
        meshRef.current.material = model.children[0].material; // Preserve OBJ material
      }

      // Center and scale the geometry dynamically
      if (geometry) {
        geometry.computeBoundingBox();
        geometry.center();

        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        const scaleFactor = 2 / maxAxis; // Dynamically adjust scale factor
        meshRef.current.scale.setScalar(scaleFactor);
      }
    });
  }, [url, type]);

  return <mesh ref={meshRef} />;
}

export default function ModelViewer() {
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const controlsRef = useRef();
  const [activeTool, setActiveTool] = useState(null);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('model', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      setFileUrl(res.data.fileUrl);
      setFileType(file.name.split('.').pop().toLowerCase());
      setUploaded(true);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  const handleReset = () => {
    controlsRef.current.reset();
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <div style={{ width: '100%', padding: '1rem', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src={logo} alt="Logo" style={{ height: '50px' }} />
        {uploaded && (
          <input
            type="file"
            accept=".stl,.obj"
            onChange={handleUpload}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {!uploaded ? (
          <input
            type="file"
            accept=".stl,.obj"
            onChange={handleUpload}
            style={{ padding: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls ref={controlsRef} enableDamping={true} />
              <Model url={fileUrl} type={fileType} />
            </Canvas>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      {uploaded && (
        <div style={{ width: '100%', padding: '1rem', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Tooltip message="Click to reset the model view to its original state">
            <button onClick={handleReset} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>Reset</button>
          </Tooltip>
          <Tooltip message="Use mouse drag to orbit around the model">
            <button
              onClick={() => handleToolChange('orbit')}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: activeTool === 'orbit' ? '2px solid blue' : '1px solid #ccc',
                backgroundColor: activeTool === 'orbit' ? '#e6f7ff' : '#fff',
              }}
            >
              Orbit
            </button>
          </Tooltip>
          <Tooltip message="Use mouse wheel to zoom in and out">
            <button
              onClick={() => handleToolChange('zoom')}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: activeTool === 'zoom' ? '2px solid blue' : '1px solid #ccc',
                backgroundColor: activeTool === 'zoom' ? '#e6f7ff' : '#fff',
              }}
            >
              Zoom
            </button>
          </Tooltip>
          <Tooltip message="Hold right mouse button and drag to pan the model">
            <button
              onClick={() => handleToolChange('pan')}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: activeTool === 'pan' ? '2px solid blue' : '1px solid #ccc',
                backgroundColor: activeTool === 'pan' ? '#e6f7ff' : '#fff',
              }}
            >
              Pan
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
