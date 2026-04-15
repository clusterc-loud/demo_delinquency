const algosdk = require('algosdk');

// Use AlgoNode free public testnet API
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// For hackathon purposes, we generate a persistent testnet wallet per session or use env
// In production, KMS or AWS Secrets Manager would hold these private keys
let serverAccount = null;

const initializeAccount = () => {
  const mnemonic = (process.env.ALGORAND_MNEMONIC || '').trim();
  if (mnemonic && mnemonic.split(' ').length >= 25) {
    try {
      serverAccount = algosdk.mnemonicToSecretKey(mnemonic);
      console.log(`[Blockchain] Wallet loaded: ${serverAccount.addr}`);
    } catch (e) {
      console.error('[Blockchain] Failed to load mnemonic:', e.message);
      serverAccount = null;
    }
  } else {
    console.warn('[Blockchain] No valid ALGORAND_MNEMONIC found. Blockchain anchoring disabled.');
    serverAccount = null;
  }
};

/**
 * Record a transaction simulation and the resulting risk score on-chain
 * @param {string} customerId 
 * @param {string} transactionData 
 * @param {number} newRiskScore 
 */
const recordRiskTransactionOnChain = async (customerId, transactionData, newRiskScore, status) => {
  if (!serverAccount) initializeAccount();

  // If still null after init (bad mnemonic), skip gracefully
  if (!serverAccount) {
    console.warn('[Blockchain] Skipping on-chain record — no valid wallet configured.');
    return `SKIPPED_NO_WALLET_${Date.now()}`;
  }

  try {
    const params = await algodClient.getTransactionParams().do();
    
    // Construct payload for Note
    const notePayload = JSON.stringify({
      v: 1,
      sys: 'VITT_CHETAK',
      cId: customerId,
      sc: newRiskScore,
      st: status,
      tx: transactionData,
      ts: new Date().toISOString()
    });

    const note = new Uint8Array(Buffer.from(notePayload));

    let txn;
    // If we have an App ID, we make a Smart Contract hit (ApplicationCall)
    if (process.env.ALGORAND_APP_ID) {
      const appId = parseInt(process.env.ALGORAND_APP_ID, 10);
      const appArgs = [
        new Uint8Array(Buffer.from(String(customerId))),
        algosdk.encodeUint64(Math.round(newRiskScore))
      ];

      // We still include the note for verbose auditability
      txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: serverAccount.addr.toString(),
        appIndex: appId,
        appArgs: appArgs,
        note: note,
        suggestedParams: params,
      });
      console.log(`[Blockchain] Engaging Smart Contract ID: ${appId} for Customer ${customerId}`);
    } else {
      // Fallback: 0-ALGO payment to self with note (readable on any block explorer)
      txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: serverAccount.addr.toString(),
        receiver: serverAccount.addr.toString(),
        amount: 0,
        note: note,
        suggestedParams: params,
      });
    }

    const signedTxn = txn.signTxn(serverAccount.sk);
    const txID = txn.txID(); // Correctly get the ID from the txn object
    
    await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log(`[Blockchain] Successfully anchored risk event to Algorand.`);
    console.log(`[Blockchain] TXID: ${txID}`);
    console.log(`[Blockchain] View on Explorer: https://testnet.allo.info/tx/${txID}`);
    
    return txID;

  } catch (err) {
    console.error(`[Blockchain] Error recording to Algorand:`, err.message);
    // Determine if it was a funding error
    const isUnfunded = err.message.includes('overspend') || err.message.includes('balance');
    const prefix = isUnfunded ? 'UNFUNDED' : 'ERROR';
    return `MOCK_TX_${Date.now()}_${prefix}`;
  }
};

module.exports = {
  recordRiskTransactionOnChain
};
