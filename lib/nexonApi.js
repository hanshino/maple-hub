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

export const getCharacterBasicInfo = async ocid => {
  try {
    const response = await apiClient.get(`/character/basic?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character basic info: ${error.message}`);
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
    throw new Error(`Failed to fetch cash item equipment: ${error.message}`);
  }
};

export const getCharacterPetEquipment = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/pet-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch pet equipment: ${error.message}`);
  }
};

export const getCharacterHyperStat = async ocid => {
  try {
    const response = await apiClient.get(`/character/hyper-stat?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character hyper stat: ${error.message}`);
  }
};

export const getCharacterSetEffect = async ocid => {
  try {
    const response = await apiClient.get(`/character/set-effect?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character set effect: ${error.message}`);
  }
};

export const getUnionRaider = async ocid => {
  try {
    const response = await apiClient.get(`/user/union-raider?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch union raider: ${error.message}`);
  }
};

export const getUnionArtifact = async ocid => {
  try {
    const response = await apiClient.get(`/user/union-artifact?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch union artifact: ${error.message}`);
  }
};

export const getCharacterLinkSkill = async ocid => {
  try {
    const response = await apiClient.get(`/character/link-skill?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch character link skill: ${error.message}`);
  }
};

const TWMS_API_BASE_URL = 'https://open.api.nexon.com/maplestorytw/v1';

const twmsApiClient = axios.create({
  baseURL: TWMS_API_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-nxopen-api-key': API_KEY,
  },
});

export const getCharacterHexaMatrix = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/hexamatrix?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch hexa matrix: ${error.message}`);
  }
};

export const getCharacterHexaMatrixStat = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/hexamatrix-stat?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch hexa matrix stat: ${error.message}`);
  }
};

export const getCharacterSymbolEquipment = async ocid => {
  try {
    const response = await twmsApiClient.get(
      `/character/symbol-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch symbol equipment: ${error.message}`);
  }
};

export const getCharacterUnion = async ocid => {
  try {
    const response = await apiClient.get(`/user/union?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch union data: ${error.message}`);
  }
};
