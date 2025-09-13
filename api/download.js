export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { url, filename } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        // Fetch the file from the URL
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }
        
        // Get the file content
        const buffer = await response.arrayBuffer();
        
        // Set appropriate headers for download
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        res.setHeader('Content-Length', buffer.byteLength);
        
        if (filename) {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        
        // Send the file
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Download proxy error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
}
