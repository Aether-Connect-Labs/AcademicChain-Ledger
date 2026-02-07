import React, { useEffect, useRef } from 'react';

const CyberBackground = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030014]">
            {/* Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

            {/* 3D Perspective Grid */}
            <div className="absolute inset-0 perspective-grid">
                <div className="cyber-grid"></div>
            </div>

            {/* Particles (Optional - CSS based for performance) */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '50px 50px', maskImage: 'radial-gradient(circle at center, black, transparent 80%)' }}></div>
        </div>
    );
};

export default CyberBackground;
