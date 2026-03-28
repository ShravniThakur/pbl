import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const BlockchainVerifier = ({ loanId }) => {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBlockchainProof = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/verify-loan/${loanId}`);
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

    if (loanId) fetchBlockchainProof();
  }, [loanId]);

  if (loading) return (
    <div className="bg-card border border-borderColour rounded-2xl p-5">
      <p className="text-bodyText/50 italic animate-pulse text-sm">
        Verifying integrity on Sepolia Testnet...
      </p>
    </div>
  );

  if (error || !proof) return (
    <div className="bg-yellow-400/5 border border-yellow-400/30 rounded-2xl p-5">
      <p className="text-yellow-400 text-sm font-semibold">⚠ Blockchain Record Pending</p>
      <p className="text-bodyText/50 text-xs mt-1">
        No on-chain record found yet for this loan check.
      </p>
    </div>
  );

  const ipfsUrl = proof.ipfsUrl;
  const txUrl = proof.txHash ? `https://sepolia.etherscan.io/tx/${proof.txHash}` : null;

  return (
    <div className="bg-success/5 border border-success/30 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        <p className="text-success font-black text-lg">Verified by Blockchain</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-bodyText/50 font-semibold uppercase tracking-wide">IPFS CID</p>
        <code className="text-[13px] font-bold text-sidebar-bg bg-slate-50 border border-border-default rounded-[9px] px-3 py-2.5 break-all">
          {proof.ipfsHash}
        </code>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.open(ipfsUrl, '_blank')}
          className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-4 py-2 rounded-full text-sm"
        >
          View ML Report (IPFS)
        </button>
        {txUrl && (
          <button
            onClick={() => window.open(txUrl, '_blank')}
            className="border border-borderColour hover:bg-card duration-300 text-bodyText font-bold px-4 py-2 rounded-full text-sm"
          >
            View on Etherscan
          </button>
        )}
      </div>

      <p className="text-xs text-bodyText/40 border-t border-borderColour pt-3">
        This result is cryptographically anchored to the Ethereum network.
        It proves the AI decision was not tampered with after processing.
      </p>
    </div>
  );
};

export default BlockchainVerifier;