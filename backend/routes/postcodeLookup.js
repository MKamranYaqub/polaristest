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

    // Use ideal-postcodes.co.uk API
    // Note: Replace 'iddqd' with your actual API key from environment variable
    const apiKey = process.env.IDEAL_POSTCODES_API_KEY || 'iddqd';
    const apiUrl = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(postcode.trim())}?api_key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ 
          success: false, 
          message: 'Postcode not found' 
        });
      }
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.result || data.result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No addresses found for this postcode' 
      });
    }

    // Map the addresses to our format
    const addresses = data.result.map((addr) => {
      // Build the full address line for display
      const addressParts = [
        addr.line_1,
        addr.line_2,
        addr.line_3
      ].filter(part => part && part.trim() !== '');
      
      // For street field, combine all address lines except post_town
      const streetAddress = addressParts.join(', ');
      
      return {
        display: addressParts.join(', '),
        street: streetAddress,
        city: addr.post_town || '',
        postcode: addr.postcode
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
