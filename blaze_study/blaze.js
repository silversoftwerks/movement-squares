document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('blazeCanvas');
    const ctx = canvas.getContext('2d');
    
    // Make the canvas a perfect square
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    canvas.width = size;
    canvas.height = size;
    
    // Set up variables for the pattern
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.45; // Slightly smaller than canvas to ensure it fits
    
    // Number of segments around the circle
    const segments = 72;
    
    // Angular width of each segment in radians
    const segmentAngle = (Math.PI * 2) / segments;
    
    // Draw the Blaze pattern
    function drawBlaze() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 1;
        
        // Draw each segment
        for (let i = 0; i < segments; i++) {
            const startAngle = i * segmentAngle;
            
            // Calculate zigzag points
            const zigzagPoints = calculateZigzagPoints(startAngle, segmentAngle);
            
            // Draw the zigzag
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            
            // Alternating fill color
            ctx.fillStyle = i % 2 === 0 ? 'black' : 'white';
            
            // Draw the zigzag path
            for (const point of zigzagPoints) {
                ctx.lineTo(point.x, point.y);
            }
            
            ctx.lineTo(centerX, centerY);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    // Calculate points for a zigzag line from center to edge
    function calculateZigzagPoints(startAngle, angleWidth) {
        const points = [];
        const zigzagCount = 8; // Number of zigzag segments
        
        // Calculate first and last angles of the segment
        const endAngle = startAngle + angleWidth;
        
        // Add the first point on the outer edge
        points.push({
            x: centerX + Math.cos(startAngle) * radius,
            y: centerY + Math.sin(startAngle) * radius
        });
        
        // Calculate intermediate zigzag points
        for (let j = 1; j < zigzagCount; j++) {
            // Calculate angle for this point
            const angle = startAngle + (angleWidth * j / zigzagCount);
            
            // Alternating radius for zigzag effect
            const zigzagRadius = j % 2 === 0 ? radius : radius * 0.7;
            
            points.push({
                x: centerX + Math.cos(angle) * zigzagRadius,
                y: centerY + Math.sin(angle) * zigzagRadius
            });
        }
        
        // Add the last point on the outer edge
        points.push({
            x: centerX + Math.cos(endAngle) * radius,
            y: centerY + Math.sin(endAngle) * radius
        });
        
        return points;
    }
    
    // Draw the pattern
    drawBlaze();
    
    // Redraw when window is resized
    window.addEventListener('resize', function() {
        const newSize = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        canvas.width = newSize;
        canvas.height = newSize;
        centerX = newSize / 2;
        centerY = newSize / 2;
        radius = newSize * 0.45;
        drawBlaze();
    });
}); 