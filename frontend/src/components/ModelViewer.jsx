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

    loader.load(
      url,
      (model) => {
        let geometry;

        if (type === 'stl') {
          geometry = model;
          meshRef.current.geometry = geometry;
          meshRef.current.material = new THREE.MeshStandardMaterial();
        } else if (type === 'obj') {
          geometry = model.children[0].geometry;
          meshRef.current.geometry = geometry;
          meshRef.current.material = model.children[0].material;
        }

        if (geometry) {
          geometry.computeBoundingBox();
          geometry.center();

          const size = geometry.boundingBox.getSize(new THREE.Vector3());
          const maxAxis = Math.max(size.x, size.y, size.z);
          const scaleFactor = 2 / maxAxis;
          meshRef.current.scale.setScalar(scaleFactor);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        alert('Error loading model. Please check console for details.');
      }
    );
  }, [url, type]);

  return <mesh ref={meshRef} />;
}

export default function ModelViewer() {
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const controlsRef = useRef();
  const [activeTool, setActiveTool] = useState(null); // Track the active tool
  const [uploaded, setUploaded] = useState(false);
  const [models, setModels] = useState([]);

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
      fetchModels(); // Fetch models after uploading
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  const handleReset = () => {
    controlsRef.current.reset();
    setActiveTool(null); // Reset active tool
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool); // Set the active tool
  };

  const fetchModels = async () => {
    try {
      const res = await axios.get('http://localhost:5000/models');
      setModels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModel = async (filename) => {
    try {
      await axios.delete(`http://localhost:5000/models/${filename}`);
      fetchModels(); // Refresh the models list after deletion
      alert('Model deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete model');
    }
  };

  useEffect(() => {
    fetchModels(); // Fetch models on component mount
  }, []);

  const handleModelClick = (model) => {
    setFileUrl(model.url); // Use the full URL provided by backend
    setFileType(model.originalname.split('.').pop().toLowerCase());
    setUploaded(true);
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        
        {/* Uploaded Models List */}
        <div style={{ width: '20%', padding: '1rem', backgroundColor: '#f0f0f0', overflowY: 'auto' }}>
          <h2>Uploaded Models:</h2>
          <ul>
            {models.map((model) => (
              <li key={model.filename} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => handleModelClick(model)} style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#f0f0f0' }}>
                  {model.originalname}
                </button>
                <button onClick={() => handleDeleteModel(model.filename)} style={{ padding: '0.5rem', borderRadius: '4px', borderColor: '#ff4d4d', color: '#ff4d4d' }}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Model Viewer */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!uploaded || !fileUrl ? (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}>
              <input
                type="file"
                accept=".stl,.obj"
                onChange={handleUpload}
                style={{ padding:'1rem',borderRadius:'4px',border:'1px solid #ccc'}}
              />
            </div>
          ) : (
            <Canvas style={{ width:'100%',height:'100%' }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10,10,10]} />
              <OrbitControls
                ref={controlsRef}
                enableRotate={activeTool === null || activeTool === 'orbit'}
                enableZoom={activeTool === null || activeTool === 'zoom'}
                enablePan={activeTool === null || activeTool === 'pan'}
              />
              <Model url={fileUrl} type={fileType} />
            </Canvas>
          )}
        </div>
        
      </div>

      {/* Bottom Footer */}
      {uploaded && (
        <div style={{ width:'100%',padding:'1rem',backgroundColor:'#f0f0f0',display:'flex',justifyContent:'center',gap:'1rem'}}>
          
          {/* Reset Button */}
          <Tooltip message="Reset view and tools">
            <button onClick={handleReset} style={{padding:'0.5rem',borderRadius:'4px'}}>Reset</button>
          </Tooltip>

          {/* Orbit / Zoom / Pan Buttons */}
          {['orbit','zoom'].map((tool)=>(
            <Tooltip key={tool} message={`Activate ${tool}`}>
              <button
                onClick={()=>handleToolChange(tool)}
                style={{
                  padding:'0.5rem',
                  borderRadius:'4px',
                  border:`${activeTool===tool?'2px solid blue':'1px solid #ccc'}`,
                  backgroundColor:`${activeTool===tool?'#e6f7ff':'#fff'}`
                }}
              >
                {tool.charAt(0).toUpperCase()+tool.slice(1)}
              </button>
            </Tooltip>
          ))}

          {/* Pan Button with Tooltip */}
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
