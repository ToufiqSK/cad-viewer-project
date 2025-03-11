import React from 'react';
import ModelViewer from './components/ModelViewer';

function App() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-center text-2xl font-bold my-4">Web-based CAD Viewer</h1>
      <ModelViewer className="w-full h-full" />
    </div>
  );
}

export default App;
