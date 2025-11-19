import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Save, ArrowLeft } from 'lucide-react';


export default function MapBuilder({ onBack, customMaps, setCustomMaps }) {
  const [mapName, setMapName] = useState('');
  const [obstacles, setObstacles] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const canvasRef = useRef(null);


  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    const worldX = ((x / canvas.offsetWidth) * 100) - 50;
    const worldZ = ((y / canvas.offsetHeight) * 100) - 50;


    if (!isDrawing) {
      setIsDrawing(true);
      setDrawStart({ x: worldX, z: worldZ });
    } else {
      const width = Math.abs(worldX - drawStart.x);
      const depth = Math.abs(worldZ - drawStart.z);
      const centerX = (worldX + drawStart.x) / 2;
      const centerZ = (worldZ + drawStart.z) / 2;


      if (width > 2 && depth > 2) {
        setObstacles([...obstacles, {
          x: centerX,
          z: centerZ,
          width,
          depth
        }]);
      }
      setIsDrawing(false);
      setDrawStart(null);
    }
  };


  const saveMap = () => {
    if (!mapName.trim()) {
      alert('Please enter a map name!');
      return;
    }


    const mapId = mapName.toLowerCase().replace(/\s+/g, '_');
    const newMaps = {
      ...customMaps,
      [mapId]: {
        name: mapName,
        obstacles: obstacles,
        custom: true,
      }
    };


    setCustomMaps(newMaps);
    localStorage.setItem('customArenas', JSON.stringify(newMaps));
    alert('Map saved!');
    onBack();
  };


  const deleteMap = (mapId) => {
    const newMaps = { ...customMaps };
    delete newMaps[mapId];
    setCustomMaps(newMaps);
    localStorage.setItem('customArenas', JSON.stringify(newMaps));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={onBack}
          className="mb-6 bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>


        <div className="bg-black/40 backdrop-blur-lg border-2 border-purple-500/50 rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            🗺️ Map Builder
          </h1>


          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Create New Map</h2>
              <Input
                placeholder="Map Name"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className="mb-4 bg-white/10 text-white border-purple-400"
              />


              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <h3 className="text-white font-bold mb-2">Instructions:</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Click once to start drawing a wall</li>
                  <li>• Click again to finish the wall</li>
                  <li>• Draw multiple walls to create your map</li>
                  <li>• Avoid placing walls at spawn point (center)</li>
                </ul>
              </div>


              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                onClick={handleCanvasClick}
                className="w-full border-4 border-purple-400 rounded-lg cursor-crosshair bg-gradient-to-br from-slate-800 to-slate-900"
                onMouseMove={(e) => {
                  if (!canvasRef.current) return;
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext('2d');
                  const rect = canvas.getBoundingClientRect();
                 
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                 
                  // Draw grid
                  ctx.strokeStyle = '#333';
                  ctx.lineWidth = 1;
                  for (let i = 1; i < 10; i++) {
                    const pos = (i / 10) * canvas.width;
                    ctx.beginPath();
                    ctx.moveTo(pos, 0);
                    ctx.lineTo(pos, canvas.height);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(0, pos);
                    ctx.lineTo(canvas.width, pos);
                    ctx.stroke();
                  }


                  // Draw spawn point
                  ctx.fillStyle = '#4169e1';
                  ctx.beginPath();
                  ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
                  ctx.fill();


                  // Draw obstacles
                  ctx.fillStyle = '#8b4513';
                  obstacles.forEach(obs => {
                    const x = ((obs.x + 50) / 100) * canvas.width;
                    const z = ((obs.z + 50) / 100) * canvas.height;
                    const w = (obs.width / 100) * canvas.width;
                    const h = (obs.depth / 100) * canvas.height;
                    ctx.fillRect(x - w / 2, z - h / 2, w, h);
                  });


                  // Draw current drawing
                  if (isDrawing && drawStart) {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const startX = ((drawStart.x + 50) / 100) * canvas.width;
                    const startZ = ((drawStart.z + 50) / 100) * canvas.height;
                   
                    ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
                    ctx.fillRect(
                      Math.min(startX, x),
                      Math.min(startZ, y),
                      Math.abs(x - startX),
                      Math.abs(y - startZ)
                    );
                  }
                }}
              />


              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => setObstacles([])}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={saveMap}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={obstacles.length === 0 || !mapName.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Map
                </Button>
              </div>
            </div>


            <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Your Custom Maps</h2>
              {Object.keys(customMaps).length === 0 ? (
                <div className="bg-black/30 rounded-xl p-8 text-center text-gray-400">
                  No custom maps yet. Create one!
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(customMaps).map(([key, map]) => (
                    <div
                      key={key}
                      className="bg-black/30 border-2 border-purple-400/50 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-white font-bold text-lg">{map.name}</div>
                        <div className="text-gray-400 text-sm">
                          {map.obstacles.length} obstacles
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteMap(key)}
                        variant="destructive"
                        size="icon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}