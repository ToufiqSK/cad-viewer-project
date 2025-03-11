import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import axios from 'axios';
import * as THREE from 'three';

function Model({ url, type }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!url) return;

    const loader = type === 'stl' ? new STLLoader() : new OBJLoader();
    loader.load(url, (model) => {
      let geometry;

      if (type === 'stl') {
        geometry = model;
      } else if (type === 'obj') {
        geometry = model.children[0].geometry;
      }

      // Center the geometry
      geometry.computeBoundingBox();
      geometry.center();

      // Scale down the model
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);
      const scaleFactor = 1 / maxAxis; // Adjust this factor as needed
      meshRef.current.scale.setScalar(scaleFactor);

      meshRef.current.geometry = geometry;
    });
  }, [url, type]);

  return (
    <mesh ref={meshRef}>
      <meshStandardMaterial color="skyblue" />
    </mesh>
  );
}

export default function ModelViewer() {
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('model', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      setFileUrl(res.data.fileUrl);
      setFileType(file.name.split('.').pop().toLowerCase());
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100">
      <input
        type="file"
        accept=".stl,.obj"
        onChange={handleUpload}
        className="mb-4 p-2 border rounded"
      />
      {fileUrl && (
        <Canvas className="w-full h-3/4 bg-white shadow-xl">
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />
          <Model url={fileUrl} type={fileType} />
        </Canvas>
      )}
    </div>
  );
}
