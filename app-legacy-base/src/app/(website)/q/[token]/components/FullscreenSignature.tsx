'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas, { SignatureCanvasRef } from './SignatureCanvas';

interface FullscreenSignatureProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dataUrl: string) => void;
}

export default function FullscreenSignature({ isOpen, onClose, onConfirm }: FullscreenSignatureProps) {
    const canvasRef = useRef<SignatureCanvasRef>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (isOpen) {
            setWindowSize({
                width: window.innerWidth - 32,
                height: window.innerHeight - 160, // Space for tools and buttons
            });
            // Lock scrolling when open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL();
            onConfirm(dataUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
            {/* Header Tools */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">全螢幕簽名</span>
                    <span className="text-xs text-gray-500 italic">請橫向旋轉手機以獲得更大空間</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => canvasRef.current?.undo()}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md active:bg-gray-100"
                    >
                        ↩ 撤銷
                    </button>
                    <button
                        onClick={() => canvasRef.current?.clear()}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-red-600 active:bg-red-50"
                    >
                        🗑 清除
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Signature Area */}
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-hidden">
                <div className="bg-white shadow-inner rounded-lg overflow-hidden border border-dashed border-gray-300">
                    <SignatureCanvas
                        ref={canvasRef}
                        width={windowSize.width}
                        height={windowSize.height}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-white flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 text-center border border-gray-300 rounded-xl font-medium text-gray-600 active:bg-gray-50 text-lg"
                >
                    取消
                </button>
                <button
                    onClick={handleConfirm}
                    className="flex-[2] py-3 text-center bg-[#1B3A5C] text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-transform text-lg"
                >
                    確認簽名
                </button>
            </div>

            {/* Background hint (optional watermark) */}
            {!windowSize.width && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-gray-900 font-bold text-4xl transform -rotate-12 translate-y-10">
                    SIGN HERE
                </div>
            )}
        </div>
    );
}
