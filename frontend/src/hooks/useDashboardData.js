import { useState, useEffect, useMemo } from 'react';
import { listQuotes } from '../utils/quotes';

/**
 * Custom hook to fetch and aggregate dashboard data
 * @param {string} timeRange - 'week', 'month', or 'year'
 * @param {string} volumeFilter - 'all', 'quotes', or 'dips'
 */
const useDashboardData = (timeRange, volumeFilter) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch quotes data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listQuotes({ limit: 1000 }); // Get all quotes
        console.log('=== FETCHED QUOTES ===');
        console.log('Total quotes fetched:', res.quotes?.length || 0);
        if (res.quotes && res.quotes.length > 0) {
          console.log('Sample quote structure:', res.quotes[0]);
          console.log('All calculator types:', [...new Set(res.quotes.map(q => q.calculator_type))]);
          console.log('All product_scope values:', [...new Set(res.quotes.map(q => q.product_scope))]);
          console.log('All quote_status values:', [...new Set(res.quotes.map(q => q.quote_status))]);
          console.log('All dip_status values:', [...new Set(res.quotes.map(q => q.dip_status))]);

          // Show breakdown by calculator type and status
          const btlQuotes = res.quotes.filter(q => q.calculator_type === 'BTL');
          const bridgingQuotes = res.quotes.filter(q => q.calculator_type === 'BRIDGING');
          console.log('BTL quotes by status:', {
            total: btlQuotes.length,
            byStatus: [...new Set(btlQuotes.map(q => q.quote_status))],
            issued: btlQuotes.filter(q => q.quote_status === 'Issued').length,
            draft: btlQuotes.filter(q => q.quote_status === 'Draft' || q.quote_status === 'draft').length
          });
          console.log('Bridging quotes by status:', {
            total: bridgingQuotes.length,
            byStatus: [...new Set(bridgingQuotes.map(q => q.quote_status))],
            issued: bridgingQuotes.filter(q => q.quote_status === 'Issued').length,
            draft: bridgingQuotes.filter(q => q.quote_status === 'Draft' || q.quote_status === 'draft').length
          });
        }
        setQuotes(res.quotes || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fetch once on mount

  // Filter quotes by time range
  const filteredByTime = useMemo(() => {
    const now = new Date();
    let startDate;

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0); // All time
    }

    return quotes.filter(q => {
      // Exclude drafts for reporting (but include for testing as per requirement)
      // For now, we'll include all to help with testing
      // if (q.quote_status === 'Draft') return false;

      const createdAt = new Date(q.created_at);
      return createdAt >= startDate;
    });
  }, [quotes, timeRange]);

  // Filter by volume filter (all/quotes/dips)
  const filteredByVolume = useMemo(() => {
    console.log('=== VOLUME FILTERING ===');
    console.log('Volume filter:', volumeFilter);
    console.log('Filtered by time count:', filteredByTime.length);

    if (volumeFilter === 'quotes') {
      // Only quotes that are issued but NOT DIPs
      const filtered = filteredByTime.filter(q =>
        q.quote_status === 'Issued' && q.dip_status !== 'Issued'
      );
      console.log('Quotes only count:', filtered.length);
      return filtered;
    } else if (volumeFilter === 'dips') {
      // Only DIPs
      const filtered = filteredByTime.filter(q => q.dip_status === 'Issued');
      console.log('DIPs only count:', filtered.length);
      return filtered;
    } else {
      // All (both quotes and DIPs) - For testing, include all quotes regardless of status
      // In production, you'd want to only include issued quotes:
      // return filteredByTime.filter(q => q.quote_status === 'Issued' || q.dip_status === 'Issued');

      // For now, let's include ALL quotes to see the data:
      console.log('All quotes (including drafts for testing):', filteredByTime.length);
      return filteredByTime;
    }
  }, [filteredByTime, volumeFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const allFiltered = filteredByTime.filter(q =>
      q.quote_status === 'Issued' || q.dip_status === 'Issued'
    );

    return {
      totalQuotes: allFiltered.filter(q => q.quote_status === 'Issued').length,
      totalDIPs: allFiltered.filter(q => q.dip_status === 'Issued').length,
    };
  }, [filteredByTime]);

  // Helper to get property type (using product_scope from quote)
  const getPropertyType = (quote) => {
    return quote.product_scope || quote.property_type || 'Residential';
  };

  // Helper to get product group (Core/Specialist)
  const getProductGroup = (quote) => {
    const range = quote.selected_range || quote.product_range || '';
    if (range.toLowerCase().includes('spec')) return 'Specialist';
    if (range.toLowerCase().includes('core')) return 'Core';
    return null;
  };

  // Helper to get loan amount
  const getLoanAmount = (quote) => {
    // Try direct loan amount field
    if (quote.loan_amount) return parseFloat(quote.loan_amount);

    // Try Bridging-specific fields
    if (quote.gross_loan) return parseFloat(quote.gross_loan);
    if (quote.loan_required) return parseFloat(quote.loan_required);
    if (quote.net_loan) return parseFloat(quote.net_loan);

    // BTL: Calculate from property value * LTV
    if (quote.property_value && quote.target_ltv) {
      return parseFloat(quote.property_value) * (parseFloat(quote.target_ltv) / 100);
    }

    // Bridging: Try ltv field (might be decimal like 0.75 instead of 75)
    if (quote.property_value && quote.ltv) {
      const ltvValue = parseFloat(quote.ltv);
      // If ltv is > 1, it's a percentage; if < 1, it's a decimal
      const ltvMultiplier = ltvValue > 1 ? ltvValue / 100 : ltvValue;
      return parseFloat(quote.property_value) * ltvMultiplier;
    }

    return 0;
  };

  // Aggregate BTL volume data
  const btlData = useMemo(() => {
    const btlQuotes = filteredByVolume.filter(q =>
      q.calculator_type && q.calculator_type.toUpperCase() === 'BTL'
    );

    console.log('=== BTL AGGREGATION ===');
    console.log('Dashboard: BTL quotes count:', btlQuotes.length);
    if (btlQuotes.length > 0) {
      console.log('Sample BTL quote:', btlQuotes[0]);
      console.log('BTL product_scope values:', [...new Set(btlQuotes.map(q => q.product_scope))]);
      console.log('BTL selected_range values:', [...new Set(btlQuotes.map(q => q.selected_range))]);
    }

    // Group by property type and product
    const categories = ['Core', 'Specialist', 'Commercial', 'Semi-Commercial'];
    const productNames = ['2yr Fix', '3yr Fix', '2yr Tracker'];

    const aggregated = categories.map(category => {
      const segments = {};

      productNames.forEach(productName => {
        let categoryQuotes = [];

        if (category === 'Core') {
          // Core = Residential with product_group 'Core'
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            const productGroup = getProductGroup(q);
            return propertyType === 'Residential' && productGroup === 'Core';
          });
        } else if (category === 'Specialist') {
          // Specialist = Residential with product_group 'Specialist'
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            const productGroup = getProductGroup(q);
            return propertyType === 'Residential' && productGroup === 'Specialist';
          });
        } else if (category === 'Commercial') {
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            return propertyType === 'Commercial';
          });
        } else if (category === 'Semi-Commercial') {
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            return propertyType === 'Semi-Commercial';
          });
        }

        console.log(`${category} quotes found: ${categoryQuotes.length}`);

        // Sum loan amounts
        const total = categoryQuotes.reduce((sum, q) => {
          const loanAmount = getLoanAmount(q);
          return sum + loanAmount;
        }, 0);

        console.log(`BTL ${category} - ${productName}: ${categoryQuotes.length} quotes, £${total.toLocaleString()}`);
        segments[productName] = total;
      });

      return {
        label: category,
        segments,
      };
    });

    const totalVolume = aggregated.reduce((sum, cat) =>
      sum + Object.values(cat.segments).reduce((s, v) => s + v, 0), 0
    );

    return { data: aggregated, total: totalVolume };
  }, [filteredByVolume]);

  // Aggregate Bridging volume data
  const bridgingData = useMemo(() => {
    const bridgingQuotes = filteredByVolume.filter(q => {
      const type = (q.calculator_type || '').toLowerCase();
      return type.includes('bridg') || type.includes('bridge');
    });

    console.log('=== BRIDGING AGGREGATION ===');
    console.log('Dashboard: Bridging quotes count:', bridgingQuotes.length);
    if (bridgingQuotes.length > 0) {
      console.log('Sample Bridging quote:', bridgingQuotes[0]);
      console.log('Bridging product_scope values:', [...new Set(bridgingQuotes.map(q => q.product_scope))]);
      console.log('Bridging product type fields:', {
        product_type: bridgingQuotes[0].product_type,
        product_name: bridgingQuotes[0].product_name,
        selected_product: bridgingQuotes[0].selected_product,
        bridge_type: bridgingQuotes[0].bridge_type,
        loan_type: bridgingQuotes[0].loan_type
      });
    }

    // Group by property type only (no Core/Specialist for Bridging)
    const categories = ['Residential', 'Commercial', 'Semi-Commercial'];
    const productTypes = ['Fusion', 'Fixed Bridge', 'Variable Bridge'];

    const aggregated = categories.map(category => {
      const segments = {};

      productTypes.forEach(productType => {
        // Filter by property type
        const categoryQuotes = bridgingQuotes.filter(q => {
          const propertyType = getPropertyType(q);
          return propertyType === category;
        });

        console.log(`Bridging ${category} quotes found: ${categoryQuotes.length}`);

        // Sum loan amounts
        const total = categoryQuotes.reduce((sum, q) => {
          const loanAmount = getLoanAmount(q);
          if (categoryQuotes.length > 0 && categoryQuotes.indexOf(q) === 0) {
            // Only log first quote to avoid spam
            console.log(`Bridging ${category} quote loan calculation (first quote):`, {
              id: q.id,
              property_value: q.property_value,
              target_ltv: q.target_ltv,
              ltv: q.ltv,
              loan_amount: q.loan_amount,
              gross_loan: q.gross_loan,
              net_loan: q.net_loan,
              loan_required: q.loan_required,
              calculated: loanAmount
            });
          }
          return sum + loanAmount;
        }, 0);

        console.log(`Bridging ${category} - ${productType}: ${categoryQuotes.length} quotes, £${total.toLocaleString()}`);

        // Since product type is not available in the quote (it's in bridge_quote_results),
        // distribute the total volume equally across all three product types
        // This gives a rough approximation until we fetch results data
        segments[productType] = total / 3;
      });

      return {
        label: category,
        segments,
      };
    });

    const totalVolume = aggregated.reduce((sum, cat) =>
      sum + Object.values(cat.segments).reduce((s, v) => s + v, 0), 0
    );

    return { data: aggregated, total: totalVolume };
  }, [filteredByVolume]);

  return {
    loading,
    error,
    totals,
    btlData,
    bridgingData,
  };
};

export default useDashboardData;
