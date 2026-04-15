const algosdk = require('algosdk');

const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const indexerClient = new algosdk.Indexer(algodToken, 'https://testnet-idx.algonode.cloud', algodPort);

/**
 * Fetch verifiable Risk Events for a specific MSME or Retail customer
 * This is the public interface for global banks.
 */
async function fetchRiskAuditTrail(walletAddress) {
  try {
    console.log(`[Vitt Chetak Global Verification] Fetching immutable history for ${walletAddress}...`);
    
    // In Algorand, banks verify transactions originating from the VittChetak authority address
    const response = await indexerClient.searchForTransactions()
      .address(walletAddress)
      .addressRole('sender')
      .do();
    
    const transactions = response.transactions || [];
    console.log(`Found ${transactions.length} Risk Update events.\n`);

    transactions.forEach((tx) => {
      // Decode the Note Field
      if (tx.note) {
        const decodedNote = Buffer.from(tx.note, 'base64').toString('utf8');
        try {
          const payload = JSON.parse(decodedNote);
          // Only parse Vitt Chetak authenticated payloads
          if (payload.sys === 'VITT_CHETAK') {
             console.log(`Timestamp: ${payload.ts}`);
             console.log(`Customer: ${payload.cId}`);
             console.log(`Risk Score: ${payload.sc}`);
             console.log(`Flag Status: ${payload.st}`);
             console.log(`Trigger Event: ${payload.tx}`);
             console.log(`Algorand Verifiable TXID: ${tx.id}`);
             console.log('--------------------------------------------------');
          }
        } catch (e) {
          // Ignore transactions that don't match our JSON schema
        }
      }
    });

  } catch (error) {
    console.error("Failed to fetch from Algorand node:", error);
  }
}

// Example Execution
// fetchRiskAuditTrail('YOUR_VITTCHETAK_SERVER_WALLET_ADDRESS');
