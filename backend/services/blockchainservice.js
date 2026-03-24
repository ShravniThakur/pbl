require('dotenv').config();
const { ethers } = require('ethers');

async function recordDataOnChain(loanId, mlResultData) {
    try {
        console.log("--- Starting Blockchain Integration ---");

        // 1. Upload to IPFS via Pinata using JWT
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PINATA_JWT}`
            },
            body: JSON.stringify({
                pinataContent: mlResultData,
                pinataMetadata: { name: `Loan_${loanId}` }
            })
        });

        const ipfsResult = await response.json();

        if (!response.ok) {
            throw new Error(`Pinata error: ${JSON.stringify(ipfsResult)}`);
        }

        const ipfsHash = ipfsResult.IpfsHash;
        console.log("✅ Data pinned to IPFS. Hash:", ipfsHash);

        // 2. Setup Ethereum Connection
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        const abi = [
            "function recordLoan(string memory _loanId, string memory _ipfsHash) public"
        ];
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

        // 3. Send Transaction to Sepolia
        console.log("⏳ Sending transaction to Sepolia...");
        const tx = await contract.recordLoan(loanId, ipfsHash);
        const receipt = await tx.wait();
        console.log("✅ Transaction Confirmed! Hash:", receipt.hash);

        return {
            success: true,
            ipfsHash: ipfsHash,
            txHash: receipt.hash
        };

    } catch (error) {
        console.error("❌ Blockchain Error:", error);
        return { success: false, error: error.message };
    }
}

async function verifyLoanOnChain(loanId) {
    try {
        // 1. Read the IPFS hash from the smart contract (this is the trustless verification)
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const abi = [
            "function getLoan(string memory _loanId) public view returns (string memory)"
        ];
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

        console.log("🔍 Querying chain for loanId:", loanId);
        const ipfsHash = await contract.getLoan(loanId);
        console.log("🔍 Chain returned ipfsHash:", ipfsHash);

        // Solidity returns "" for missing keys — treat as not found
        if (!ipfsHash || ipfsHash === "") {
            return { success: false, message: "No on-chain record found for this loan." };
        }

        // 2. Fetch the txHash from MongoDB (only used for the Etherscan link — not part of verification)
        const LoanEligibilityCheck = require('../models/LoanEligibilityCheck');
        const record = await LoanEligibilityCheck.findById(loanId).select('blockchainTxHash');
        const txHash = record?.blockchainTxHash || null;

        return {
            success: true,
            ipfsHash: ipfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            txHash: txHash  // included so frontend can show Etherscan link
        };

    } catch (error) {
        console.error("❌ Verification Error:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { recordDataOnChain, verifyLoanOnChain };