import {Contract, ethers} from 'ethers';
import { useRef, useState } from 'react';
import { VotingEvent } from '../store/votingEvents';
import { votingContractAbi } from '../abi/votingContract';

export async function connectMetamask() {
  if(window.ethereum == null) {
    throw new Error('MetaMask is not installed');
  } else {
    const chainId = import.meta.env.VITE_VOTE_CHAIN_ID ? parseInt(import.meta.env.VITE_VOTE_CHAIN_ID) : undefined;
    const provider = new ethers.BrowserProvider(
      window.ethereum,
      chainId
    );
    const signer = await provider.getSigner();

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId?.toString(16)}` }]
      });
    } catch (switchError: any) {
      console.log('Error switching chain:', switchError);
    }

    return {provider, signer};
  }
}

export function dateStringToUnixSeconds(dateString: string): number {
  return Math.floor(new Date(dateString).getTime() / 1000);
}

export async function createVoting(signer: ethers.JsonRpcSigner, votingEvent: VotingEvent) {
  if (!votingEvent.votingStart) {
    throw new Error('Voting event must have a start date');
  }

  if (!votingEvent.votingEnd) {
    throw new Error('Voting event must have an end date');
  }

  if (!votingEvent.resultsPublishAt) {
    throw new Error('Voting event must have a results publish date');
  }

  if (!votingEvent.options || votingEvent.options.length === 0) {
    throw new Error('Voting event must have at least one option');
  }

  const voteContract = new Contract(
    import.meta.env.VITE_VOTE_CONTRACT_ADDRESS,
    votingContractAbi,
    signer,
  );

  const tx = await voteContract.createVote(
    votingEvent.id,
    votingEvent.name,
    dateStringToUnixSeconds(votingEvent.votingStart),
    dateStringToUnixSeconds(votingEvent.votingEnd),
    dateStringToUnixSeconds(votingEvent.resultsPublishAt),
    parseInt(votingEvent.chainRequestId),
    votingEvent.options.map(option => option.name)
  )

  await tx.wait();
}

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'notInstalled'>('disconnected');
  const [transactionState, setTransactionState] = useState<'idle' | 'pending' | 'success' | 'canceled' | 'error'>('idle');

  const accSigner = useRef<ethers.JsonRpcSigner | null>(null);

  const resetConnectionState = () => {
    setAccount(null);
    setConnectionState('disconnected');
    setTransactionState('idle');
    accSigner.current = null;
  }

  const resetTransactionState = () => {
    setTransactionState('idle');
  }

  const connectWallet = async () => {
    try {
      setConnectionState('connecting');
      const { signer } = await connectMetamask();
      accSigner.current = signer;
      setAccount(await accSigner.current.getAddress());
      setConnectionState('connected');
    } catch (error: any) {
      if (error.message === 'MetaMask is not installed') {
        setConnectionState('notInstalled');
      } else {
        setConnectionState('disconnected');
      }
    }
  };

  const callCreateVoting = async (votingEvent: VotingEvent) => {
    if (!accSigner.current) {
      throw new Error('Wallet not connected');
    }
    setTransactionState('pending');
    try {
      await createVoting(accSigner.current, votingEvent);
      setTransactionState('success');
    } catch (error: any) {
      if (error.message.includes('user rejected action')) {
        setTransactionState('canceled');
        throw new Error('tx_canceled');
      } else {
        setTransactionState('error');
      }
      throw error;
    }
  }

  return {
    connectionState,
    transactionState,
    account,
    connectWallet,
    callCreateVoting,
    resetConnectionState,
    resetTransactionState
  };
}