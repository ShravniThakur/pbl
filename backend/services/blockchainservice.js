require('dotenv').config();
const pinataSDK = require('@pinata/sdk');
const { ethers } = require('ethers');

// Initialize Pinata
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

async function recordDataOnChain(loanId, mlResultData) {
    try {
        console.log("--- Starting Blockchain Integration ---");

        // 1. Upload the ML Result JSON to IPFS
        const options = {
            pinataMetadata: { name: `Loan_${loanId}` }
        };
        const ipfsResult = await pinata.pinJSONToIPFS(mlResultData, options);
        const ipfsHash = ipfsResult.IpfsHash;
        console.log("✅ Data pinned to IPFS. Hash:", ipfsHash);

        // 2. Setup Ethereum Connection
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // This 'ABI' tells ethers how to talk to your specific contract functions
        const abi = [
            "function recordLoan(string memory _loanId, string memory _ipfsHash) public"
        ];
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

        // 3. Send Transaction to Sepolia
        console.log("⏳ Sending transaction to Sepolia...");
        const tx = await contract.recordLoan(loanId, ipfsHash);
        
        // Wait for the block to be mined (confirmation)
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

// Add this to your module.exports later
async function verifyLoanOnChain(loanId) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const abi = [
            "function getLoan(string memory _loanId) public view returns (string memory)"
        ];
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

        // Call the 'view' function (this costs 0 gas!)
        const ipfsHash = await contract.getLoan(loanId);
        
        if (!ipfsHash) return { success: false, message: "No record found." };

        return {
            success: true,
            ipfsHash: ipfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        };
    } catch (error) {
        console.error("Verification Error:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { recordDataOnChain, verifyLoanOnChain };

// module.exports = { recordDataOnChain };