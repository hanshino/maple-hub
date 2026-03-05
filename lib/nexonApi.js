import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-nxopen-api-key': API_KEY,
  },
});

export const getCharacterBasicInfo = async (ocid) => {
  try {
    const response = await apiClient.get(`/character/basic?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch character basic info: ${error.message}`
    );
  }
};

export const getCharacterStats = async ocid => {
  try {
    const response = await apiClient.get(`/character/stat?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character stats: ${error.message}`);
  }
};

export const getCharacterEquipment = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/item-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character equipment: ${error.message}`);
  }
};

export const getCharacterCashItemEquipment = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/cashitem-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch cash item equipment: ${error.message}`
    );
  }
};

export const getCharacterPetEquipment = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/pet-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch pet equipment: ${error.message}`
    );
  }
};
