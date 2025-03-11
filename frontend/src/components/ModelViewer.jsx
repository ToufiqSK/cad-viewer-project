import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import axios from 'axios';
import Tooltip from './Tooltip';
import logo from '../assets/images/logo.png'; // Adjust the path as needed
import * as THREE from 'three';
import { Orbit, ZoomIn, Move, RefreshCw, Upload } from 'lucide-react';

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
  const [activeTool, setActiveTool] = useState(null);
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
      fetchModels();
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  const handleReset = () => {
    controlsRef.current.reset();
    setActiveTool(null);
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool);
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
      fetchModels();
      alert('Model deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete model');
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleModelClick = (model) => {
    setFileUrl(model.url);
    setFileType(model.originalname.split('.').pop().toLowerCase());
    setUploaded(true);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-100">

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-lg border-b border-gray-200">
        <img src={logo} alt="Logo" className="w-[170px] h-auto" />

        {uploaded && (
          <label className="flex items-center gap-2 px-4 py-2 text-white bg-[#00BFFF] rounded-md cursor-pointer hover:bg-blue-700 transition duration-200 shadow-md">
            <Upload size={20} /> Upload Model
            <input
              type="file"
              accept=".stl,.obj"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Uploaded Models Section */}
        <div className="w-1/5 p-4 bg-white shadow-md overflow-y-auto">
          <h2 className="mb-4 text-lg font-semibold">Uploaded Models</h2>
          <ul>
            {models.map((model) => (
              <li key={model.filename} className="flex items-center justify-between mb-4">
                <button onClick={() => handleModelClick(model)} className="px-3 py-2 text-white bg-[#00BFFF] rounded-md hover:bg-blue-700">
                  {model.originalname}
                </button>
                <button onClick={() => handleDeleteModel(model.filename)} className="px-3 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-100">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Model Viewer */}
        <div className="flex-grow p-4 bg-gray-50 shadow-md relative">
          {!uploaded || !fileUrl ? (
            <div className="flex flex-col items-center justify-center h-full">
              <label className="flex items-center gap-2 px-6 py-3 text-white bg-[#00BFFF] rounded-lg cursor-pointer hover:bg-blue-400 transition duration-200 shadow-md text-lg">
                <Upload size={20} /> Upload Model
                <input
                  type="file"
                  accept=".stl,.obj"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-sm text-gray-500">Supported formats: <span className="font-medium text-gray-700">.STL, .OBJ</span></p>
            </div>

          ) : (
            <Canvas className="w-full h-full bg-gray-100">
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <gridHelper args={[20, 20, "#cccccc", "#666666"]} />
              <axesHelper args={[5]} />

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
        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-white shadow-md">
          <Tooltip message="Reset model to original state">
            <button
              onClick={handleReset}
              className={`flex items-center gap-2 px-4 py-2 border border-black rounded-md transition-all ${activeTool === null ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-200'
                }`}
            >
              <RefreshCw size={18} /> Reset
            </button>
          </Tooltip>

          {[
            { tool: 'orbit', label: 'Orbit', icon: <Orbit size={18} />, message: 'Activate Orbit' },
            { tool: 'zoom', label: 'Zoom', icon: <ZoomIn size={18} />, message: 'Activate Zoom' },
            { tool: 'pan', label: 'Pan', icon: <Move size={18} />, message: 'Right-click and drag to Pan' }
          ].map(({ tool, label, icon, message }) => (
            <Tooltip key={tool} message={message}>
              <button
                onClick={() => handleToolChange(tool)}
                className={`flex items-center gap-2 px-4 py-2 border border-black rounded-md transition-all ${activeTool === tool ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                {icon} {label}
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
