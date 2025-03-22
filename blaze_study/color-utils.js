function mixColors(color1, color2, ratio) {
    // Extract RGB components from rgba strings
    const c1 = color1.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    const c2 = color2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    
    if (!c1 || !c2) return color1;
    
    // Mix the colors according to the ratio
    const r = Math.round(parseInt(c1[1]) * (1 - ratio) + parseInt(c2[1]) * ratio);
    const g = Math.round(parseInt(c1[2]) * (1 - ratio) + parseInt(c2[2]) * ratio);
    const b = Math.round(parseInt(c1[3]) * (1 - ratio) + parseInt(c2[3]) * ratio);
    
    return `rgba(${r}, ${g}, ${b}, 1)`;
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}