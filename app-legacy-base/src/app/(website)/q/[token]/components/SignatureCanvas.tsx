'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

interface Point {
    x: number;
    y: number;
}

type Stroke = Point[];

interface SignatureCanvasProps {
    width?: number; // Logical width (CSS pixels)
    height?: number; // Logical height (CSS pixels)
    onSignatureChange?: (hasSignature: boolean) => void;
    className?: string;
}

export interface SignatureCanvasRef {
    toDataURL: () => string;
    clear: () => void;
    undo: () => void;
    isEmpty: () => boolean;
    fromDataURL: (dataUrl: string) => void;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>((props, ref) => {
    const { width = 600, height = 200, onSignatureChange, className = "" } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke>([]);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and redraw all strokes
        ctx.clearRect(0, 0, width, height);

        // We need to use the latest strokes state, but since this might be called in Effect, 
        // it's better to pass it or use a ref for drawing if performance is an issue.
        // For now, we'll rely on the state-based redraw logic below.
    }, [height, width]);

    // Setup canvas high-DPI support
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Initial styles
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Redraw if orientation/DPI changes or initial load
        redraw();
    }, [height, redraw, width]);

    // Redraw when strokes change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // Draw past strokes
        strokes.forEach(stroke => drawStroke(ctx, stroke));

        // Draw current stroke
        if (currentStroke.length > 0) {
            drawStroke(ctx, currentStroke);
        }

        onSignatureChange?.(strokes.length > 0 || currentStroke.length > 0);
    }, [currentStroke, height, onSignatureChange, strokes, width]);

    const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const midX = (points[i].x + points[i + 1].x) / 2;
            const midY = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
    };

    const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        const pos = getPointerPos(e);
        setCurrentStroke([pos]);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const pos = getPointerPos(e);
        setCurrentStroke(prev => [...prev, pos]);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        canvasRef.current?.releasePointerCapture(e.pointerId);

        if (currentStroke.length > 1) {
            setStrokes(prev => [...prev, currentStroke]);
        }
        setCurrentStroke([]);
    };

    useImperativeHandle(ref, () => ({
        toDataURL: () => {
            const canvas = canvasRef.current;
            if (!canvas) return '';
            return canvas.toDataURL('image/png');
        },
        clear: () => {
            setStrokes([]);
            setCurrentStroke([]);
        },
        undo: () => {
            setStrokes(prev => prev.slice(0, -1));
        },
        isEmpty: () => {
            return strokes.length === 0 && currentStroke.length === 0;
        },
        fromDataURL: (dataUrl: string) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                // Draw the image scaled to fit
                ctx.drawImage(img, 0, 0, width, height);
                // Note: This won't populate the "strokes" state, 
                // but it will show correctly and and toDataURL will work.
                onSignatureChange?.(true);
            };
            img.src = dataUrl;
        }
    }));

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`bg-white border border-gray-200 cursor-crosshair touch-none ${className}`}
            style={{ touchAction: 'none' }}
        />
    );
});

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
