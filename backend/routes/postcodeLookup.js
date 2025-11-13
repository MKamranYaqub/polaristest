import express from 'express';
const router = express.Router();

/**
 * @route   GET /api/postcode-lookup/:postcode
 * @desc    Lookup addresses for a UK postcode using getAddress.io API
 * @access  Public
 * @note    Requires GETADDRESS_API_KEY environment variable
 *          Get free API key (20 lookups/day): https://getaddress.io/
 */
router.get('/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    if (!postcode || !postcode.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Postcode is required' 
      });
    }

    // Use getAddress.io API (free tier: 20 lookups/day, returns actual street addresses)
    // Get your free API key from: https://getaddress.io/
    const apiKey = process.env.GETADDRESS_API_KEY || 'YOUR_API_KEY_HERE';
    const apiUrl = `https://api.getaddress.io/find/${encodeURIComponent(postcode.trim())}?api-key=${apiKey}&expand=true`;
    
    console.log('📍 Calling getAddress.io API');
    
    const response = await fetch(apiUrl);
    
    console.log('📡 getAddress.io response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ getAddress.io error body:', errorBody);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          success: false, 
          message: 'Postcode not found' 
        });
      }
      if (response.status === 401) {
        throw new Error('Invalid API key - get your free key from https://getaddress.io/');
      }
      throw new Error(`API returned status ${response.status}: ${errorBody}`);
    }
    
    const data = await response.json();
    console.log('✅ getAddress.io found', data.addresses?.length || 0, 'addresses');
    
    if (!data.addresses || data.addresses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No addresses found for this postcode' 
      });
    }

    // Map getAddress.io format to our format
    // getAddress.io returns addresses as arrays: [line1, line2, line3, line4, locality, town/city, county]
    const addresses = data.addresses.map((addr) => {
      // addr is an array of address components
      const [line1, line2, line3, line4, locality, townCity, county] = addr.split(',').map(s => s.trim());
      
      // Build display address (skip empty parts)
      const displayParts = [line1, line2, line3, line4, locality, townCity].filter(part => part);
      
      // Street is typically line1 + line2
      const streetParts = [line1, line2, line3].filter(part => part);
      
      return {
        display: displayParts.join(', '),
        street: streetParts.join(', '),
        city: townCity || locality || '',
        postcode: data.postcode || postcode.trim().toUpperCase()
      };
    });

    res.json({ 
      success: true, 
      addresses
    });
    
  } catch (error) {
    // Log full error for diagnostics
    console.error('Postcode lookup error:', error);

    // In non-production or when debug=1 is provided, return the error details
    if (process.env.NODE_ENV !== 'production' || req.query.debug === '1') {
      return res.status(500).json({
        success: false,
        message: 'Failed to lookup postcode. See error details.',
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }

    // Generic response for production
    res.status(500).json({ 
      success: false, 
      message: 'Failed to lookup postcode. Please try again.' 
    });
  }
});

export default router;
