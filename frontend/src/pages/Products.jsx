// Products page removed
export default function Products() {
  return null;
}

  // Fetch rates based on current tab selection
  useEffect(() => {
    fetchRates();
  }, [mainTab, subTab]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('rates_flat').select('*');

      if (mainTab === 'btl') {
        // BTL Products
        if (subTab === 'core') {
          query = query.eq('set_key', 'Rates_Core');
        } else if (subTab === 'specialist') {
          query = query.eq('set_key', 'Rates_Spec').eq('property', 'RESIDENTIAL');
        } else if (subTab === 'commercial') {
          query = query.eq('set_key', 'Rates_Spec').eq('property', 'COMMERCIAL');
        } else if (subTab === 'semi-commercial') {
          query = query.eq('set_key', 'Rates_Spec').eq('property', 'SEMI_COMMERCIAL');
        }
      } else if (mainTab === 'bridge-fusion') {
        // Bridge & Fusion Products
        if (subTab === 'fixed') {
          query = query.eq('set_key', 'Bridging_Fix');
        } else if (subTab === 'variable') {
          query = query.eq('set_key', 'Bridging_Var');
        } else if (subTab === 'fusion') {
          query = query.eq('set_key', 'Fusion');
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      console.log(`Fetched ${data?.length || 0} rates for ${mainTab}/${subTab}:`, data?.slice(0, 3));
      setRatesData(data || []);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Transform flat rates data into structured table data for BTL
  const transformBTLData = () => {
    const structured = {};

    ratesData.forEach(rate => {
      const tier = rate.tier || 'Tier 1';
      const product = rate.product || 'Unknown';
      const feePercent = rate.product_fee !== undefined && rate.product_fee !== null && rate.product_fee !== ''
        ? Number(rate.product_fee)
        : null;

      if (!structured[tier]) {
        structured[tier] = {};
      }

      if (!structured[tier][product]) {
        structured[tier][product] = {
          feeRanges: new Set(),
          rates: [],
          revertRate: null,
          isTracker: rate.is_tracker || product.toLowerCase().includes('tracker')
        };
      }

      if (feePercent !== null && !Number.isNaN(feePercent)) {
        structured[tier][product].feeRanges.add(feePercent);
      }

      // Store rate with LTV
      const ltv = rate.max_ltv || rate.ltv || 0;
      structured[tier][product].rates.push({
        ltv: ltv,
        rate: rate.rate || 0,
        margin: rate.revert_margin || rate.margin || null
      });

      // Capture revert rate if available
      if (rate.revert_margin) {
        structured[tier][product].revertRate = `MVR + ${rate.revert_margin}%`;
      } else if (rate.revert_index && rate.revert_margin) {
        structured[tier][product].revertRate = `${rate.revert_index} + ${rate.revert_margin}%`;
      } else {
        structured[tier][product].revertRate = 'MVR';
      }
    });

    console.log('Structured BTL data:', structured);
    return structured;
  };

  // Transform data for Bridge Variable products (LTV-based table)
  const transformBridgeVariableData = () => {
    const products = {};

    ratesData.forEach(rate => {
      const product = rate.product || 'Unknown Product';
      const ltv = rate.max_ltv || rate.ltv || 0;
      const rateValue = rate.rate || 0;
      const minLoan = rate.min_loan || '';
      const maxLoan = rate.max_loan || '';
      const chargeType = rate.charge_type || rate.type || '';
      const maxTerm = rate.max_term || rate.term || '';

      if (!products[product]) {
        products[product] = {
          rates: {},
          loanSize: `${minLoan} - ${maxLoan}`,
          maxLTV: ltv,
          chargeType,
          term: maxTerm
        };
      }

      // Group by LTV
      const ltvKey = String(ltv);
      if (!products[product].rates[ltvKey]) {
        products[product].rates[ltvKey] = [];
      }

      products[product].rates[ltvKey].push(rateValue);
    });

    console.log('Bridge Variable data:', products);
    return products;
  };

  // Render BTL table (Tier-based)
  const renderBTLTable = () => {
    const structured = transformBTLData();
    const tiers = Object.keys(structured).sort();

    if (tiers.length === 0) {
      return <div className="no-data">No rates available for this product</div>;
    }

    // Determine unique products across all tiers
    const allProducts = new Set();
    tiers.forEach(tier => {
      Object.keys(structured[tier]).forEach(product => allProducts.add(product));
    });

    const products = Array.from(allProducts);

    // Determine dynamic LTV levels present in the data (sorted ascending)
    const ltvSet = new Set();
    tiers.forEach(tier => {
      ['3yr Fix', '2yr Fix', '2yr Tracker'].forEach(prod => {
        const entry = structured[tier][prod];
        (entry?.rates || []).forEach(r => {
          const n = Number(r.ltv);
          if (Number.isFinite(n) && n > 0) ltvSet.add(n);
        });
      });
    });
    const ltvLevels = Array.from(ltvSet).sort((a,b) => a - b);

    return (
      <div className="rates-table-container">
        <table className="rates-table">
          <thead>
            <tr>
              <th rowSpan="2"></th>
              {tiers.map(tier => (
                <th key={tier} colSpan="3" className={`tier-header tier-${tier.toLowerCase().replace(/\s+/g, '-')}`}>
                  {tier}
                </th>
              ))}
            </tr>
            <tr>
              {tiers.map(tier => (
                <React.Fragment key={`${tier}-cols`}>
                  <th className="product-col">3 yr Fix</th>
                  <th className="product-col">2 yr Fix</th>
                  <th className="product-col">2 yr Tracker</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Fee Range Row (per product column, supports multiple fee ranges) */}
            <tr className="fee-range-row">
              <td className="label-cell">Fee range</td>
              {tiers.map(tier => {
                const tierData = structured[tier] || {};
                const p3 = tierData['3yr Fix'];
                const p2 = tierData['2yr Fix'];
                const pt = tierData['2yr Tracker'];

                const fmt = (entry) => {
                  if (!entry) return '—';
                  const list = Array.from(entry.feeRanges || [])
                    .filter(v => !Number.isNaN(Number(v)))
                    .map(Number)
                    .sort((a,b) => a - b)
                    .map(v => `${v}%`);
                  if (list.length === 0) return '—';
                  return `${list.join(', ')} fee range`;
                };

                return (
                  <React.Fragment key={`${tier}-fee`}>
                    <td className="fee-range-cell">{fmt(p3)}</td>
                    <td className="fee-range-cell">{fmt(p2)}</td>
                    <td className="fee-range-cell">{fmt(pt)}</td>
                  </React.Fragment>
                );
              })}
            </tr>

            {/* Rate Rows */}
            {/* Rate rows by dynamic LTV levels, each followed by its revert row */}
            {ltvLevels.map(ltv => (
              <React.Fragment key={ltv}>
                <tr className="rate-row">
                  <td className="label-cell">Rate</td>
                  {tiers.map(tier => {
                    const tierData = structured[tier] || {};
                    const fix3yr = tierData['3yr Fix'] || {};
                    const fix2yr = tierData['2yr Fix'] || {};
                    const tracker2yr = tierData['2yr Tracker'] || {};

                    const r3 = fix3yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const r2 = fix2yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const rt = tracker2yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const rate3yr = r3?.rate ?? '-';
                    const rate2yr = r2?.rate ?? '-';
                    const rateTracker = rt?.rate ?? '-';

                    return (
                      <React.Fragment key={`${tier}-${ltv}`}>
                        <td>{typeof rate3yr === 'number' ? `${(rate3yr * 100).toFixed(2)}%` : rate3yr}</td>
                        <td>{typeof rate2yr === 'number' ? `${(rate2yr * 100).toFixed(2)}%` : rate2yr}</td>
                        <td>{typeof rateTracker === 'number' ? `${(rateTracker * 100).toFixed(2)}% +BBR` : rateTracker}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
                <tr className="revert-rate-row">
                  <td className="label-cell">Revert rate</td>
                  {tiers.map(tier => {
                    const tierData = structured[tier] || {};
                    const fix3yr = tierData['3yr Fix'] || {};
                    const fix2yr = tierData['2yr Fix'] || {};
                    const tracker2yr = tierData['2yr Tracker'] || {};

                    const r3 = fix3yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const r2 = fix2yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const rt = tracker2yr.rates?.find(r => Number(r.ltv) === Number(ltv));
                    const rev3 = r3?.revertRate || 'MVR';
                    const rev2 = r2?.revertRate || 'MVR';
                    const revt = rt?.revertRate || 'MVR';

                    return (
                      <React.Fragment key={`${tier}-revert-${ltv}`}>
                        <td>{rev3}</td>
                        <td>{rev2}</td>
                        <td>{revt}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}

            {/* Defer up to */}
            <tr className="defer-row">
              <td className="label-cell">Defer up to</td>
              {tiers.map(tier => (
                <React.Fragment key={`${tier}-defer`}>
                  <td>1.25%</td>
                  <td colSpan="2">2.00%</td>
                </React.Fragment>
              ))}
            </tr>

            {/* Roll up to */}
            <tr className="roll-row">
              <td className="label-cell">Roll up to</td>
              {tiers.map(tier => (
                <React.Fragment key={`${tier}-roll`}>
                  <td colSpan="3">9 months interest payments</td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Bridge Variable table (Product columns with LTV rows)
  const renderBridgeVariableTable = () => {
    const products = transformBridgeVariableData();
    const productNames = Object.keys(products);

    if (productNames.length === 0) {
      return <div className="no-data">No rates available for Variable Bridging</div>;
    }

    const ltvLevels = ['60', '70', '75'];

    return (
      <div className="bridge-table-container">
        <div className="bridge-title">Variable Bridging Loan Rates</div>
        <table className="bridge-table">
          <thead>
            <tr className="product-header-row">
              <th className="our-products-header" rowSpan="2">Our Products</th>
              {productNames.map(product => (
                <th key={product} className="product-header">{product}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rates by LTV */}
            {ltvLevels.map(ltv => (
              <tr key={ltv} className="ltv-row">
                <td className="ltv-label">Rates: {ltv}% LTV</td>
                {productNames.map(product => {
                  const productData = products[product];
                  const rates = productData.rates[ltv] || [];
                  const rate = rates[0] || 'N/A';
                  return (
                    <td key={`${product}-${ltv}`}>
                      {typeof rate === 'number' ? `${(rate * 100).toFixed(2)}%` : rate}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Loan Size */}
            <tr className="loan-size-row">
              <td className="label-cell">Loan Size</td>
              {productNames.map(product => (
                <td key={`${product}-loan`}>{products[product].loanSize}</td>
              ))}
            </tr>

            {/* Max LTV */}
            <tr className="max-ltv-row">
              <td className="label-cell">Max LTV</td>
              {productNames.map(product => {
                const maxLTV = products[product].maxLTV;
                return (
                  <td key={`${product}-maxltv`} colSpan={maxLTV === '75' ? productNames.length - 1 : 1}>
                    {maxLTV}%
                  </td>
                );
              })}
            </tr>

            {/* Charge Type */}
            <tr className="charge-type-row">
              <td className="label-cell">Charge Type</td>
              {productNames.map(product => (
                <td key={`${product}-charge`}>{products[product].chargeType}</td>
              ))}
            </tr>

            {/* Term */}
            <tr className="term-row">
              <td className="label-cell">Term (months)</td>
              <td colSpan={productNames.length}>{products[productNames[0]]?.term || '3 - 18'}</td>
            </tr>

            {/* Arrangement Fee */}
            <tr className="arrangement-fee-row">
              <td className="label-cell">Arrangement Fee (from)</td>
              <td colSpan={productNames.length}>2%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Bridge Fixed or Fusion table (simplified for now)
  const renderBridgeFixedTable = () => {
    if (ratesData.length === 0) {
      return <div className="no-data">No rates available for Fixed Bridging</div>;
    }

    return (
      <div className="bridge-fixed-container">
        <div className="bridge-title">Fixed Bridging Loan Rates</div>
        <div className="simple-rates-list">
          {ratesData.slice(0, 20).map((rate, idx) => (
            <div key={idx} className="rate-item">
              <span className="rate-product">{rate.product}</span>
              <span className="rate-value">{typeof rate.rate === 'number' ? `${(rate.rate * 100).toFixed(2)}%` : rate.rate}</span>
              <span className="rate-ltv">LTV: {rate.max_ltv}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFusionTable = () => {
    if (ratesData.length === 0) {
      return <div className="no-data">No rates available for Fusion products</div>;
    }

    return (
      <div className="fusion-container">
        <div className="bridge-title">Fusion Rates</div>
        <div className="simple-rates-list">
          {ratesData.slice(0, 20).map((rate, idx) => (
            <div key={idx} className="rate-item">
              <span className="rate-product">{rate.product}</span>
              <span className="rate-value">{typeof rate.rate === 'number' ? `${(rate.rate * 100).toFixed(2)}%` : rate.rate}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="products-page">
      {/* Header */}
      <header className="products-header">
        <h1 className="products-title">Products</h1>
        <div className="header-info">
          <span className="info-item">ℹ️ Asset Class</span>
          <span className="info-item">ℹ️ LTV Restrictions</span>
          <span className="info-item">ℹ️ Support</span>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button
          className={`main-tab ${mainTab === 'btl' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('btl');
            setSubTab('core');
          }}
        >
          Buy to Let
        </button>
        <button
          className={`main-tab ${mainTab === 'bridge-fusion' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('bridge-fusion');
            setSubTab('fixed');
          }}
        >
          Bridge & Fusion
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="sub-tabs">
        {mainTab === 'btl' && (
          <>
            <button
              className={`sub-tab ${subTab === 'core' ? 'active' : ''}`}
              onClick={() => setSubTab('core')}
            >
              Core Residential BTL
            </button>
            <button
              className={`sub-tab ${subTab === 'specialist' ? 'active' : ''}`}
              onClick={() => setSubTab('specialist')}
            >
              Specialist Residential BTL
            </button>
            <button
              className={`sub-tab ${subTab === 'commercial' ? 'active' : ''}`}
              onClick={() => setSubTab('commercial')}
            >
              Commercial BTL
            </button>
            <button
              className={`sub-tab ${subTab === 'semi-commercial' ? 'active' : ''}`}
              onClick={() => setSubTab('semi-commercial')}
            >
              Semi Commercial BTL
            </button>
          </>
        )}

        {mainTab === 'bridge-fusion' && (
          <>
            <button
              className={`sub-tab ${subTab === 'fixed' ? 'active' : ''}`}
              onClick={() => setSubTab('fixed')}
            >
              Bridging Fixed
            </button>
            <button
              className={`sub-tab ${subTab === 'variable' ? 'active' : ''}`}
              onClick={() => setSubTab('variable')}
            >
              Bridging Variable
            </button>
            <button
              className={`sub-tab ${subTab === 'fusion' ? 'active' : ''}`}
              onClick={() => setSubTab('fusion')}
            >
              Fusion
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="products-content">
        {loading && <div className="loading-state">Loading rates...</div>}
        {error && <div className="error-state">Error: {error}</div>}
        
        {!loading && !error && ratesData.length === 0 && (
          <div className="no-data">No rates found for {mainTab} / {subTab}. Check console for details.</div>
        )}
        
        {!loading && !error && ratesData.length > 0 && (
          <>
            <div style={{ padding: '0.5rem', background: '#f0f9ff', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem', color: '#0369a1' }}>
              📊 Loaded {ratesData.length} rate(s) for <strong>{subTab}</strong>
            </div>
            {mainTab === 'btl' && renderBTLTable()}
            {mainTab === 'bridge-fusion' && subTab === 'variable' && renderBridgeVariableTable()}
            {mainTab === 'bridge-fusion' && subTab === 'fixed' && renderBridgeFixedTable()}
            {mainTab === 'bridge-fusion' && subTab === 'fusion' && renderFusionTable()}
          </>
        )}
      </div>

      {/* Calculator Links */}
      <div className="calculator-links">
        <h3>Access Calculators</h3>
        <div className="link-buttons">
          <a href="/calculator" className="calc-link-btn">🏠 BTL Calculator</a>
          <a href="/calculator" className="calc-link-btn">⚡ Bridging Calculator</a>
          <a href="/calculator" className="calc-link-btn">🔄 Fusion Calculator</a>
        </div>
      </div>
    </div>
  );
};

// Removed
