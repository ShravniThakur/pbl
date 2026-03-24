import React, { useState, useEffect } from 'react';

/**
 * BlockchainVerifier Component
 * Fetches and displays the immutable audit trail for a specific loan check.
 */
const BlockchainVerifier = ({ loanId }) => {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBlockchainProof = async () => {
      try {
        // Points to the GET route we added to your server.js
        const response = await fetch(`http://localhost:5000/api/verify-loan/${loanId}`);
        const data = await response.json();

        if (data.success) {
          setProof(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching blockchain proof:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (loanId) {
      fetchBlockchainProof();
    }
  }, [loanId]);

  if (loading) {
    return <p className="text-muted italic">Verifying integrity on Sepolia Testnet...</p>;
  }

  if (error || !proof) {
    return (
      <div className="alert alert-warning mt-3">
        <small>Blockchain record pending or not found for this ID.</small>
      </div>
    );
  }

  return (
    <div className="card mt-4 border-success shadow-sm">
      <div className="card-body bg-light">
        <h6 className="card-title text-success d-flex align-items-center">
          <span className="me-2">🛡️</span> Verified by Blockchain
        </h6>
        
        <div className="mt-2" style={{ fontSize: '0.85rem' }}>
          <p className="mb-1 text-dark">
            <strong>IPFS CID:</strong> 
            <code className="ms-1 text-break">{proof.ipfsHash}</code>
          </p>
          
          <div className="d-flex gap-3 mt-3">
            <a 
              href={proof.ipfsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              View ML Report (IPFS)
            </a>
            
            {/* Note: You can also link to Etherscan if you pass the txHash from backend */}
            {proof.txHash && (
               <a 
               href={`https://sepolia.etherscan.io/tx/${proof.txHash}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="btn btn-sm btn-outline-secondary"
             >
               View on Etherscan
             </a>
            )}
          </div>
          
          <p className="mt-3 mb-0 text-muted border-top pt-2" style={{ fontSize: '0.75rem' }}>
            This result is cryptographically anchored to the Ethereum network. 
            It proves that the AI decision logic was not tampered with after processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainVerifier;