const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

async function compileProgram(client, programSource) {
  const compileResponse = await client.compile(programSource).do();
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

async function deploy() {
  console.log("Compiling Smart Contracts...");
  try {
    const approvalProgramSource = fs.readFileSync(path.join(__dirname, '../contracts/risk_ledger.teal'), 'utf8');
    const clearProgramSource = fs.readFileSync(path.join(__dirname, '../contracts/clear_state.teal'), 'utf8');

    const approvalProgram = await compileProgram(algodClient, approvalProgramSource);
    const clearProgram = await compileProgram(algodClient, clearProgramSource);

    console.log("Successfully compiled TEAL.");
    
    // In production, instantiate account from Mnemonic
    let account;
    if (process.env.ALGORAND_MNEMONIC) {
      account = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
      console.log(`Using provided Mnemonic. Deployment Account: ${account.addr}`);
    } else {
      account = algosdk.generateAccount();
      console.log(`Generated Ephemeral Deployment Account: ${account.addr}`);
      console.log(`Mnemonic (Save this!): ${algosdk.secretKeyToMnemonic(account.sk)}`);
      console.log(`Please fund this account on the Algorand Testnet Dispenser before deploying: https://bank.testnet.algorand.network/`);
      return; // Stop execution if no funded mnemonic is provided
    }

    const params = await algodClient.getTransactionParams().do();
    // numLocalInts = 0, numLocalByteSlices = 0, numGlobalInts = 2, numGlobalByteSlices = 2
    const txn = algosdk.makeApplicationCreateTxn(account.addr, params, algosdk.OnApplicationComplete.NoOpOC, approvalProgram, clearProgram, 0, 0, 2, 2);
    const signedTxn = txn.signTxn(account.sk);
    const txId = txn.txID().toString();
    console.log(`Deploying Smart Contract. TXID: ${txId}...`);
    
    await algodClient.sendRawTransaction(signedTxn).do();
    
    const confirmation = await algosdk.waitForConfirmation(algodClient, txId, 4);
    const appId = confirmation['application-index'];
    console.log(`\n✅ Successfully Deployed Vitt Chetak Smart Contract!`);
    console.log(`App ID: ${appId}`);
    console.log(`Please add this to your backend/.env file as ALGORAND_APP_ID=${appId}`);

  } catch (error) {
    console.error("Failed to deploy smart contract:", error);
  }
}

deploy();
