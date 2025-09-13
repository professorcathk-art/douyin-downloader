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
    
    const { aweme_id } = req.query;
    
    if (!aweme_id) {
        return res.status(400).json({ error: 'aweme_id parameter is required' });
    }
    
    try {
        // Proxy the request to the original API
        const apiUrl = `http://64.227.89.151/api/douyin/web/fetch_one_video?aweme_id=${encodeURIComponent(aweme_id)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Return the response
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch data from API' });
    }
}
