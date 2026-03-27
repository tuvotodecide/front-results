import {Contract, ethers} from 'ethers';
import { useRef, useState } from 'react';
import { VotingEvent } from '../store/votingEvents';
import { votingContractAbi } from '../abi/votingContract';
import { v4 as uuidv4 } from 'uuid';

export async function connectMetamask() {
  if(window.ethereum == null) {
    throw new Error('MetaMask is not installed');
  } else {
    const chainId = import.meta.env.VITE_VOTE_CHAIN_ID ? parseInt(import.meta.env.VITE_VOTE_CHAIN_ID) : undefined;
    const chainIdHex = chainId != null ? `0x${chainId.toString(16)}` : undefined;
    const provider = new ethers.BrowserProvider(
      window.ethereum,
      chainId
    );
    const signer = await provider.getSigner();

    if (chainIdHex) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        });
      } catch (switchError: any) {
        // 4902 = unknown chain in wallet, attempt to add it and switch again.
        if (switchError?.code === 4902) {
          const chainName = import.meta.env.VITE_VOTE_CHAIN_NAME ?? 'Custom Network';
          const rpcUrl = import.meta.env.VITE_VOTE_CHAIN_RPC_URL;
          const blockExplorerUrl = import.meta.env.VITE_VOTE_CHAIN_BLOCK_EXPLORER_URL;

          if (!rpcUrl) {
            throw new Error('Missing VITE_VOTE_CHAIN_RPC_URL for wallet_addEthereumChain');
          }

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName,
              rpcUrls: [rpcUrl],
              blockExplorerUrls: blockExplorerUrl ? [blockExplorerUrl] : undefined,
              nativeCurrency: {
                name: import.meta.env.VITE_VOTE_CHAIN_CURRENCY_NAME ?? 'Ether',
                symbol: import.meta.env.VITE_VOTE_CHAIN_CURRENCY_SYMBOL ?? 'ETH',
                decimals: 18,
              },
            }]
          });

          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }]
          });
        } else {
          console.log('Error switching chain:', switchError);
        }
      }
    }

    return {provider, signer};
  }
}

export function dateStringToUnixSeconds(dateString: string): number {
  return Math.floor(new Date(dateString).getTime() / 1000);
}

export async function createVoting(signer: ethers.JsonRpcSigner, votingEvent: VotingEvent, userNullifiers: string[]) {
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
    userNullifiers,
    votingEvent.options.map(option => option.name)
  )

  await tx.wait();
}

export async function updateVotingSchedule(
  signer: ethers.JsonRpcSigner,
  votingEventId: string,
  newStart: string,
  newEnd: string,
  newResults: string
) {
  const voteContract = new Contract(
    import.meta.env.VITE_VOTE_CONTRACT_ADDRESS,
    votingContractAbi,
    signer,
  );

  const tx = await voteContract.updateVoteDates(
    votingEventId,
    dateStringToUnixSeconds(newStart),
    dateStringToUnixSeconds(newEnd),
    dateStringToUnixSeconds(newResults)
  );

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

  const handleTransactionError = (error: any) => {
    if (error.message.includes('user rejected action')) {
      setTransactionState('canceled');
      return new Error('tx_canceled');
    } else {
      setTransactionState('error');
    }
    return error;
  }

  const callCreateVoting = async (votingEvent: VotingEvent, votersCount: number): Promise<string[]> => {
    if (!accSigner.current) {
      throw new Error('Wallet not connected');
    }
    setTransactionState('pending');
    try {
      const userNullifiers = Array.from({ length: votersCount }, () => uuidv4());
      await createVoting(accSigner.current, votingEvent, userNullifiers);
      setTransactionState('success');
      return userNullifiers;
    } catch (error: any) {
      throw handleTransactionError(error);
    }
  }

  const callUpdateSchedule = async (votingEventId: string, newStart: string, newEnd: string, newResults: string) => {
    if (!accSigner.current) {
      throw new Error('Wallet not connected');
    }
    setTransactionState('pending');
    try {
      await updateVotingSchedule(accSigner.current, votingEventId, newStart, newEnd, newResults);
      setTransactionState('success');
    } catch (error: any) {
      throw handleTransactionError(error);
    }
  }

  return {
    connectionState,
    transactionState,
    account,
    connectWallet,
    callCreateVoting,
    callUpdateSchedule,
    resetConnectionState,
    resetTransactionState
  };
}