import express from 'express';
const router = express.Router();

/**
 * @route   GET /api/postcode-lookup/:postcode
 * @desc    Lookup addresses for a UK postcode using ideal-postcodes API
 * @access  Private (requires auth)
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

    // Use postcodes.io API (free, no API key required)
    // Alternative to ideal-postcodes which requires paid API key and whitelist
    const apiUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`;
    
    console.log('📍 Calling postcodes.io API:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    console.log('📡 postcodes.io response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ postcodes.io error body:', errorBody);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          success: false, 
          message: 'Postcode not found' 
        });
      }
      throw new Error(`API returned status ${response.status}: ${errorBody}`);
    }
    
    const data = await response.json();
    console.log('✅ postcodes.io response:', JSON.stringify(data, null, 2));
    
    if (!data.result || data.status !== 200) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data found for this postcode' 
      });
    }

    // postcodes.io returns a single result object with location data, not individual addresses
    // We'll return the postcode with location details in a consistent format
    const result = data.result;
    
    // Format: Just return the postcode information
    // For actual property addresses, you'd need a different API (like ideal-postcodes with paid plan)
    // or use UK Land Registry / Royal Mail PAF database
    const addresses = [{
      display: `${result.postcode} - ${result.admin_district}, ${result.region}`,
      street: result.admin_ward || '',
      city: result.admin_district || '',
      postcode: result.postcode
    }];

    res.json({ 
      success: true, 
      addresses,
      // Include additional location data that might be useful
      location: {
        latitude: result.latitude,
        longitude: result.longitude,
        region: result.region,
        country: result.country
      }
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
