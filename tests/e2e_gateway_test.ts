/**
 * TOLLARY END-TO-END GATEWAY INTEGRATION & MULTI-AGENT CONCURRENCY TEST SUITE
 * Run: npx tsx tests/e2e_gateway_test.ts
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runStep(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`[PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, durationMs, details: err.message });
    console.error(`[FAIL] ${name} (${durationMs}ms):`, err.message);
  }
}

async function main() {
  console.log('================================================================');
  console.log('TOLLARY END-TO-END GATEWAY & MULTI-AGENT CONCURRENCY TEST SUITE');
  console.log('Testing: MCP Gateway, x402 Engine, Discovery, REST, & Ledger');
  console.log('================================================================\n');

  // Test 1: Health & System Info
  await runStep('1. Health Probe (/v1/health)', async () => {
    const res = await fetch(`${BASE_URL}/v1/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Status not healthy: ${data.status}`);
  });

  // Test 2: Provider Onboarding
  let createdProviderId = '';
  await runStep('2. Provider Onboarding (POST /v1/providers)', async () => {
    const res = await fetch(`${BASE_URL}/v1/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OmniSynthetics AI',
        contactEmail: 'api@omnisynth.ai',
        payoutAddress: '0x99A80128B91a27b8192A80129B812c7012B9a999',
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    createdProviderId = data.provider.id;
    if (!createdProviderId) throw new Error('No provider ID returned');
  });

  // Test 3: MCP Server Registration & Tool Ingestion
  await runStep('3. MCP Server Registration & Tool Ingestion (POST /v1/mcp/servers)', async () => {
    const res = await fetch(`${BASE_URL}/v1/mcp/servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Omni Vector Service',
        providerId: createdProviderId,
        initialTools: [
          {
            name: 'omni_similarity_search',
            description: 'Calculates cosine similarity across dense embedding vectors.',
            inputSchema: { type: 'object', properties: { vector: { type: 'array' } } },
            priceUsd: 0.008,
          },
        ],
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (!data.server.tools.includes('omni_similarity_search')) {
      throw new Error('Tool not registered in server catalog');
    }
  });

  // Test 4: Capability Discovery Search
  await runStep('4. Capability Discovery Search (GET /v1/discover?q=similarity)', async () => {
    const res = await fetch(`${BASE_URL}/v1/discover?q=similarity`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.total < 1) throw new Error('Expected at least 1 discovery match');
    if (!data.results.some((t: any) => t.name === 'omni_similarity_search')) {
      throw new Error("Newly registered tool 'omni_similarity_search' not found in discovery index");
    }
  });

  // Test 5: In-Band Meta-MCP Discovery
  await runStep('5. In-Band Meta-MCP Discovery (POST /mcp/srv_tollary_system)', async () => {
    const res = await fetch(`${BASE_URL}/mcp/srv_tollary_system`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'meta-01',
        method: 'tools/call',
        params: {
          name: 'tollary_discover_tools',
          arguments: { query: 'GST' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(`JSON-RPC Error: ${data.error.message}`);
    const innerText = data.result.content[0].text;
    if (!innerText.includes('gst_validator_pro')) {
      throw new Error('Expected gst_validator_pro inside discovery response');
    }
  });

  // Test 6: Unpaid Tool Execution -> HTTP 402 Challenge
  let capturedNonce = '';
  await runStep('6. Unpaid Priced Tool Execution -> HTTP 402 Payment Required', async () => {
    const res = await fetch(`${BASE_URL}/mcp/srv_fintech_mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-unpaid',
        method: 'tools/call',
        params: {
          name: 'gst_validator_pro',
          arguments: { gstin: '27AABCU9603R1ZM' },
        },
      }),
    });
    if (res.status !== 402) throw new Error(`Expected 402, got ${res.status}`);
    const costHeader = res.headers.get('X-Payment-Cost');
    const assetHeader = res.headers.get('X-Payment-Asset');
    capturedNonce = res.headers.get('X-Payment-Nonce') || '';
    if (costHeader !== '0.020000') throw new Error(`Unexpected cost header: ${costHeader}`);
    if (assetHeader !== 'USDC') throw new Error(`Unexpected asset header: ${assetHeader}`);
    if (!capturedNonce) throw new Error('Missing X-Payment-Nonce header');
  });

  // Test 7: Paid Tool Execution with Valid Proof -> HTTP 200 OK & Settlement
  const uniqueNonce = `nonce_agent_e2e_${Date.now()}`;
  await runStep('7. Paid Tool Execution -> Verification, Upstream Call & Settlement (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/mcp/srv_fintech_mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Payment-Signature': '0x9b1c7f8a91b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        'Payment-Nonce': uniqueNonce,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-paid',
        method: 'tools/call',
        params: {
          name: 'gst_validator_pro',
          arguments: { gstin: '27AABCU9603R1ZM' },
        },
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const settlementHeader = res.headers.get('X-Payment-Settlement');
    const txIdHeader = res.headers.get('X-Tollary-Transaction-ID');
    if (settlementHeader !== 'CONFIRMED_BASE_USDC') {
      throw new Error(`Unexpected settlement header: ${settlementHeader}`);
    }
    if (!txIdHeader) throw new Error('Missing X-Tollary-Transaction-ID header');
    const data = await res.json();
    if (!data.result?.content?.[0]?.text?.includes('Acme Cloud Solutions Private Limited')) {
      throw new Error('Tool execution payload missing expected output');
    }
  });

  // Test 8: Replay Attack Guard -> HTTP 409 Conflict
  await runStep('8. Replay Attack Guard (Reused Nonce) -> HTTP 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/mcp/srv_fintech_mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Payment-Signature': '0x9b1c7f8a91b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        'Payment-Nonce': uniqueNonce, // Reused!
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-replay',
        method: 'tools/call',
        params: {
          name: 'gst_validator_pro',
          arguments: { gstin: '27AABCU9603R1ZM' },
        },
      }),
    });
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    const securityHeader = res.headers.get('X-Tollary-Security');
    if (securityHeader !== 'DUPLICATE_PAYMENT_NONCE') {
      throw new Error(`Unexpected security header: ${securityHeader}`);
    }
  });

  // Test 9: Monetized REST Gateway Proxy -> HTTP 402 & Paid 200
  await runStep('9. Generic REST Monetization Proxy (/g/acme-fintech/company/search)', async () => {
    // 9a: Unpaid -> 402
    const resUnpaid = await fetch(`${BASE_URL}/g/acme-fintech/company/search?q=Acme`);
    if (resUnpaid.status !== 402) throw new Error(`Expected 402, got ${resUnpaid.status}`);

    // 9b: Paid -> 200
    const restNonce = `nonce_rest_test_${Date.now()}`;
    const resPaid = await fetch(`${BASE_URL}/g/acme-fintech/company/search?q=Acme`, {
      headers: {
        'Payment-Signature': '0x4a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
        'Payment-Nonce': restNonce,
      },
    });
    if (resPaid.status !== 200) throw new Error(`Expected 200, got ${resPaid.status}`);
    const data = await resPaid.json();
    if (!data.data?.results?.[0]?.ein) throw new Error('Missing EIN in proxied response');
  });

  // Test 10: Multi-Agent Concurrency (25 Concurrent Invocations)
  await runStep('10. Multi-Agent Concurrency (25 Concurrent Invocations)', async () => {
    const promises = Array.from({ length: 25 }, async (_, i) => {
      const agentNonce = `nonce_concurrency_${Date.now()}_${i}`;
      const res = await fetch(`${BASE_URL}/mcp/srv_web_scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Payment-Signature': '0x8888888888888888888888888888888888888888',
          'Payment-Nonce': agentNonce,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `concurrent-${i}`,
          method: 'tools/call',
          params: {
            name: 'extract_article_ai',
            arguments: { url: `https://example.com/post-${i}` },
          },
        }),
      });
      if (res.status !== 200) throw new Error(`Agent ${i} failed with status ${res.status}`);
      return res.json();
    });

    const allResults = await Promise.all(promises);
    if (allResults.length !== 25) throw new Error(`Expected 25 results, got ${allResults.length}`);
  });

  // Test 11: Final Financial Ledger Audit
  await runStep('11. Financial Ledger Audit (/v1/transactions)', async () => {
    const res = await fetch(`${BASE_URL}/v1/transactions`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.totalCount < 26) {
      throw new Error(`Expected at least 26 settled transactions, got ${data.totalCount}`);
    }
    if (data.platformRevenueUsd <= 0) {
      throw new Error('Platform fee revenue should be strictly positive');
    }
    console.log(`   [LEDGER AUDIT]: Gross GMV: $${data.grossVolumeUsd} | Platform Fees: $${data.platformRevenueUsd} | Provider Payouts: $${data.providerPayoutsUsd}`);
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log('================================================================');

  if (results.some((r) => !r.passed)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
