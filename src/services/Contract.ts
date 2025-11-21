// Contract service for managing vehicle sale contracts
import { getAuthToken } from './Auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://evmarket-api-staging-backup.onrender.com/api/v1'

export interface ContractData {
  id?: string
  vehicleId: string
  vehicleInfo: {
    title: string
    brand: string
    model: string
    year: number
    price: number
    mileage?: number
    batteryCapacity?: string
    description?: string
  }
  seller: {
    id: string
    name: string
    email: string
    signedAt?: string
    signature?: string
  }
  buyer?: {
    id: string
    name: string
    email: string
    signedAt?: string
    signature?: string
  }
  status: 'PENDING_SELLER' | 'PENDING_BUYER' | 'COMPLETED'
  createdAt?: string
  updatedAt?: string
}

export interface ContractResponse {
  success: boolean
  message: string
  data?: ContractData
  error?: string
}

export interface ContractListResponse {
  success: boolean
  message: string
  data?: { contracts: ContractData[] }
  error?: string
}

// Local storage key for contracts (since we don't have API endpoint yet)
const CONTRACTS_STORAGE_KEY = 'ev_market_contracts'

// Helper to get contracts from local storage
const getStoredContracts = (): ContractData[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CONTRACTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save contracts to local storage
const saveContracts = (contracts: ContractData[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts))
  } catch (error) {
    console.error('Failed to save contracts:', error)
  }
}

// Create contract when seller creates listing
export const createSellerContract = async (contractData: Omit<ContractData, 'id' | 'status' | 'createdAt'>): Promise<ContractResponse> => {
  try {
    // In a real app, this would call the API
    // For now, we'll store in localStorage
    
    const contracts = getStoredContracts()
    
    const newContract: ContractData = {
      ...contractData,
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: contractData.seller.signature ? 'PENDING_BUYER' : 'PENDING_SELLER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    contracts.push(newContract)
    saveContracts(contracts)
    
    return {
      success: true,
      message: 'Contract created successfully',
      data: newContract
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create contract',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Sign contract as seller
export const signContractAsSeller = async (
  vehicleId: string,
  signature: string
): Promise<ContractResponse> => {
  try {
    const contracts = getStoredContracts()
    const contractIndex = contracts.findIndex(c => c.vehicleId === vehicleId && !c.seller.signature)
    
    if (contractIndex === -1) {
      throw new Error('Contract not found')
    }
    
    contracts[contractIndex].seller.signature = signature
    contracts[contractIndex].seller.signedAt = new Date().toISOString()
    contracts[contractIndex].status = 'PENDING_BUYER'
    contracts[contractIndex].updatedAt = new Date().toISOString()
    
    saveContracts(contracts)
    
    return {
      success: true,
      message: 'Contract signed successfully',
      data: contracts[contractIndex]
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to sign contract',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Sign contract as buyer
export const signContractAsBuyer = async (
  vehicleId: string,
  buyerInfo: {
    id: string
    name: string
    email: string
  },
  signature: string
): Promise<ContractResponse> => {
  try {
    const contracts = getStoredContracts()
    const contractIndex = contracts.findIndex(
      c => c.vehicleId === vehicleId && c.status === 'PENDING_BUYER'
    )
    
    if (contractIndex === -1) {
      throw new Error('Contract not found or not ready for buyer signature')
    }
    
    contracts[contractIndex].buyer = {
      ...buyerInfo,
      signature,
      signedAt: new Date().toISOString()
    }
    contracts[contractIndex].status = 'COMPLETED'
    contracts[contractIndex].updatedAt = new Date().toISOString()
    
    saveContracts(contracts)
    
    return {
      success: true,
      message: 'Contract completed successfully',
      data: contracts[contractIndex]
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to sign contract as buyer',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get contract by vehicle ID
export const getContractByVehicleId = async (vehicleId: string): Promise<ContractResponse> => {
  try {
    const contracts = getStoredContracts()
    const contract = contracts.find(c => c.vehicleId === vehicleId)
    
    if (!contract) {
      throw new Error('Contract not found')
    }
    
    return {
      success: true,
      message: 'Contract retrieved successfully',
      data: contract
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get contract',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get all contracts for a user (as seller or buyer)
export const getUserContracts = async (userId: string): Promise<ContractListResponse> => {
  try {
    const contracts = getStoredContracts()
    const userContracts = contracts.filter(
      c => c.seller.id === userId || c.buyer?.id === userId
    )
    
    return {
      success: true,
      message: 'User contracts retrieved successfully',
      data: { contracts: userContracts }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user contracts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Delete contract (for testing purposes)
export const deleteContract = async (vehicleId: string): Promise<ContractResponse> => {
  try {
    const contracts = getStoredContracts()
    const filteredContracts = contracts.filter(c => c.vehicleId !== vehicleId)
    saveContracts(filteredContracts)
    
    return {
      success: true,
      message: 'Contract deleted successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete contract',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get user contracts from API
export const getMyContracts = async (): Promise<any> => {
  try {
    // Check if running on client side
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching contracts from:', `${API_BASE_URL}/contracts`);
    console.log('Using token:', token ? 'Token exists' : 'No token');

    const response = await fetch(`${API_BASE_URL}/contracts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch contracts: ${response.status}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data);
    console.log('Data structure:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

// View contract HTML - opens in new tab
export const viewContract = async (contractId: string): Promise<void> => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Open URL directly with authorization in new tab
    const url = `${API_BASE_URL}/contracts/${contractId}/view`;
    const newWindow = window.open('', '_blank');
    
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Fetch and display HTML in the new window
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      newWindow.close();
      throw new Error('Failed to view contract');
    }

    const html = await response.text();
    newWindow.document.write(html);
    newWindow.document.close();
  } catch (error) {
    console.error('Error viewing contract:', error);
    throw error;
  }
}

// Download contract PDF
export const downloadContract = async (contractId: string): Promise<void> => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download contract');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${contractId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading contract:', error);
    throw error;
  }
}
