import React, { useState, useRef, useEffect } from 'react';
import { sounds } from './SoundManager';
import { Move, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset zoom & offsets when image source changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    sounds.playTick();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setOffset({ x: newX, y: newY });
  };

  const handleApplyCrop = () => {
    sounds.playPunchyCTA();
    const image = imgRef.current;
    if (!image) return;

    // Create a 300x300 canvas for the profile picture
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background (in case of transparency)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 300, 300);

    // Viewport is 200x200 in the UI, canvas output is 300x300.
    // Calculate the drawn dimensions relative to 300x300.
    const uiViewportSize = 200;
    const scaleFactor = 300 / uiViewportSize;

    // Get original image natural dimensions
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // The image fits within 200x200 UI container centered by default.
    // Let's compute default displayed size of the image inside 200x200 viewport.
    let displayWidth = uiViewportSize;
    let displayHeight = uiViewportSize;

    const ratio = naturalWidth / naturalHeight;
    if (ratio > 1) {
      displayHeight = uiViewportSize / ratio;
    } else {
      displayWidth = uiViewportSize * ratio;
    }

    // Centered start coords in UI
    const defaultX = (uiViewportSize - displayWidth) / 2;
    const defaultY = (uiViewportSize - displayHeight) / 2;

    // Apply zoom and offset in UI coordinates, then upscale to canvas size (300x300)
    const finalWidth = displayWidth * zoom * scaleFactor;
    const finalHeight = displayHeight * zoom * scaleFactor;

    // Center pivot of zoom
    const zoomOffsetX = (displayWidth * (1 - zoom)) / 2;
    const zoomOffsetY = (displayHeight * (1 - zoom)) / 2;

    const finalX = (defaultX + zoomOffsetX + offset.x) * scaleFactor;
    const finalY = (defaultY + zoomOffsetY + offset.y) * scaleFactor;

    try {
      ctx.drawImage(image, finalX, finalY, finalWidth, finalHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCropComplete(dataUrl);
    } catch (e) {
      console.error('Failed to crop image:', e);
      alert('FAILED TO PROCESS IMAGE CROP PROTOCOL. PLEASE CHOOSE A LOCAL FILE.');
    }
  };

  return (
    <div className="border border-shonen-orange/30 bg-orange-50/50 p-4 rounded-none space-y-4">
      <div className="text-center">
        <span className="font-mono text-[9px] text-shonen-orange font-black uppercase tracking-widest block">
          ⚡ NEURAL ALIGNMENT INTERFACE (DRAG & ZOOM CROPPER)
        </span>
        <span className="font-mono text-[8px] text-gray-400 uppercase tracking-wider block mt-0.5">
          CHOOSE A SPECIFIC SEGMENT OF YOUR PICTURE & SAVE IT PERMANENTLY
        </span>
      </div>

      {/* Visual Crop Viewport Container */}
      <div className="flex justify-center items-center">
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          className="w-[200px] h-[200px] border-4 border-black relative overflow-hidden bg-zinc-900 cursor-move shrink-0 shadow-md select-none group"
        >
          {/* Inner Grid Crosshair */}
          <div className="absolute inset-0 pointer-events-none border border-dashed border-white/20 z-10" />
          <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none border-t border-dashed border-white/30 z-10" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none border-l border-dashed border-white/30 z-10" />

          {/* Centered Image */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="To Crop"
            draggable={false}
            className="absolute max-w-none origin-center pointer-events-none select-none transition-shadow duration-100"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              left: '50%',
              top: '50%',
              transformOrigin: 'center',
              // Calculate default center position
              marginLeft: imgRef.current ? `-${imgRef.current.clientWidth / 2}px` : '-100px',
              marginTop: imgRef.current ? `-${imgRef.current.clientHeight / 2}px` : '-100px',
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              const ratio = img.naturalWidth / img.naturalHeight;
              if (ratio > 1) {
                img.style.height = '200px';
                img.style.width = 'auto';
              } else {
                img.style.width = '200px';
                img.style.height = 'auto';
              }
            }}
          />

          {/* Micro overlay instruction */}
          <div className="absolute bottom-2 left-2 right-2 bg-black/65 py-1 px-1.5 text-center text-[7px] font-mono text-white/90 uppercase tracking-wider rounded-xs pointer-events-none transition-opacity group-hover:opacity-100 flex items-center justify-center gap-1">
            <Move className="w-2.5 h-2.5 text-shonen-orange" />
            DRAG TO ALIGN PORTRAIT
          </div>
        </div>
      </div>

      {/* Control Panel: Zoom Slider & Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-2">
          <ZoomIn className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="font-mono text-[9px] font-bold text-gray-500 uppercase shrink-0">ZOOM LEVEL: {zoom.toFixed(1)}x</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={zoom}
            onChange={(e) => {
              sounds.playTick();
              setZoom(parseFloat(e.target.value));
            }}
            className="flex-1 accent-shonen-orange cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTick();
              onCancel();
            }}
            className="bg-white border border-gray-300 text-gray-700 hover:border-black font-mono text-[9px] font-black py-2 uppercase tracking-wider text-center cursor-pointer"
          >
            [ DISCARD ]
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="bg-shonen-orange text-white border-2 border-black hover:bg-black font-mono text-[9px] font-black py-1.5 uppercase tracking-wider text-center cursor-pointer"
          >
            [ SAVE CROP OPTION ]
          </button>
        </div>
      </div>
    </div>
  );
}
